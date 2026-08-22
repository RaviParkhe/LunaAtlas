"""
space_weather.py -- Live Space-Weather Status Poller (FastAPI router)

Polls NOAA SWPC public JSON feeds for the current planetary K-index
and active space-weather alerts.

DATA SOURCES (verified 2026-08-22):
  K-index: https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
    - 3-hourly planetary Kp index, last 7 days
    - Updates every 3 hours
  Alerts:  https://services.swpc.noaa.gov/products/alerts.json
    - Active NOAA SWPC product messages

NOAA GEOMAGNETIC STORM G-SCALE (official, source: swpc.noaa.gov):
  G1 (Minor)   : Kp = 5
  G2 (Moderate): Kp = 6
  G3 (Strong)  : Kp = 7
  G4 (Severe)  : Kp = 8 / 9-
  G5 (Extreme) : Kp = 9o

STATUS CLASSIFICATION (for badge):
  Quiet        : Kp < 5   (no geomagnetic storm)
  Elevated     : 5 <= Kp < 7  (G1-G2, minor to moderate storm)
  Storm Watch  : Kp >= 7 OR active Gx-scale alert in NOAA feed (G3+)

POLL CADENCE:
  The NOAA planetary K-index product updates every 3 hours.
  We poll every 3 hours (10800 seconds), matching the source cadence.
  Polling faster would not yield fresher data.

IMPORTANT: This module is ISOLATED from the static radiation scoring
engine.  It does NOT modify, read, or influence site rankings, radiation
scores, SVF grids, or any other layer.  It is a standalone live-status
indicator only.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants -- verified from NOAA SWPC
# ---------------------------------------------------------------------------
KINDEX_URL  = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
ALERTS_URL  = "https://services.swpc.noaa.gov/products/alerts.json"

# NOAA K-index product updates every 3 hours (source-verified cadence)
POLL_INTERVAL_SECONDS = 10_800  # 3 hours

# Request timeout (NOAA can be slow; generous but finite)
HTTP_TIMEOUT_SECONDS = 15

# Maximum number of historical Kp readings to store for the sparkline
HISTORY_MAXLEN = 16  # 16 x 3h = 48h of trend

# G-scale thresholds (official NOAA, swpc.noaa.gov/noaa-scales-explanation)
# G1=Kp5, G2=Kp6, G3=Kp7, G4=Kp8, G5=Kp9
KP_ELEVATED      = 5.0   # >= G1 Minor
KP_STORM_WATCH   = 7.0   # >= G3 Strong


# ---------------------------------------------------------------------------
# Shared state -- single in-process cache updated by background task
# ---------------------------------------------------------------------------
class SpaceWeatherState:
    """Thread-safe (asyncio single-task) state container."""

    def __init__(self):
        self.kp_current:       Optional[float]   = None
        self.kp_history:       list              = []   # list of {time_tag, Kp}
        self.classification:   str               = "unknown"
        self.active_gx_alert:  bool              = False
        self.alert_details:    list              = []   # human-readable alert summaries
        self.last_confirmed_utc: Optional[str]   = None  # ISO-8601 UTC timestamp
        self.is_stale:         bool              = True  # True until first successful poll
        self.error_message:    Optional[str]     = None


_state = SpaceWeatherState()
_poller_task: Optional[asyncio.Task] = None

# ---------------------------------------------------------------------------
# Classification logic
# ---------------------------------------------------------------------------

def _classify(kp: float, active_gx_alert: bool) -> str:
    """
    Return one of 'Quiet' | 'Elevated' | 'Storm Watch' based on:
      - Current planetary Kp value (NOAA official G-scale thresholds)
      - Whether any active G3+ alert is present in the NOAA alerts feed

    Thresholds sourced from swpc.noaa.gov/noaa-scales-explanation:
      G1=Kp5, G2=Kp6, G3=Kp7
    """
    if kp >= KP_STORM_WATCH or active_gx_alert:
        return "Storm Watch"
    if kp >= KP_ELEVATED:
        return "Elevated"
    return "Quiet"


# ---------------------------------------------------------------------------
# Alert parsing helpers
# ---------------------------------------------------------------------------
_GSTORM_ALERT_CODES = {
    # product_id values that indicate geomagnetic storm >= G3
    # NOAA SWPC product codes:
    #   K07A = Alert: Geomagnetic K-index of 7 (G3)
    #   K08A = Alert: Geomagnetic K-index of 8 (G4)
    #   K09A = Alert: Geomagnetic K-index of 9 (G5)
    "K07A", "K08A", "K09A",
    "A50F", "A99F",  # storm watch >= G3
}

_GSTORM_TEXT_MARKERS = [
    "G3", "G4", "G5",
    "Geomagnetic K-index of 7",
    "Geomagnetic K-index of 8",
    "Geomagnetic K-index of 9",
    "Storm Category G3", "Storm Category G4", "Storm Category G5",
]


def _parse_alerts(alerts_json: list):
    """
    Inspect the NOAA alerts feed for active G3+ geomagnetic storm indicators.
    Returns: (active_gx_alert: bool, summaries: list of str)
    """
    active = False
    summaries = []

    for entry in alerts_json:
        product_id = entry.get("product_id", "")
        message    = entry.get("message", "")
        issue_time = entry.get("issue_datetime", "")

        if product_id in _GSTORM_ALERT_CODES:
            active = True
            summaries.append(
                f"[{product_id}] {issue_time[:16]}: "
                f"{message[:120].strip()}"
            )
            continue

        if any(marker in message for marker in _GSTORM_TEXT_MARKERS):
            msg_upper = message.upper()
            if any(kw in msg_upper for kw in ["ALERT:", "WARNING:", "WATCH:"]):
                if "CANCEL" not in msg_upper:
                    active = True
                    clean = message[:120].replace("\r", " ").replace("\n", " ").strip()
                    summaries.append(f"[{product_id}] {issue_time[:16]}: {clean}")

    return active, summaries[:5]


# ---------------------------------------------------------------------------
# NOAA fetch helpers
# ---------------------------------------------------------------------------

async def _fetch_kp(client: httpx.AsyncClient):
    """Fetch and return the raw K-index JSON list, or None on error."""
    try:
        resp = await client.get(KINDEX_URL, timeout=HTTP_TIMEOUT_SECONDS)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, list) or len(data) == 0:
            logger.warning("space_weather: K-index response was empty or not a list")
            return None
        return data
    except Exception as exc:
        logger.warning("space_weather: K-index fetch failed: %s", exc)
        return None


async def _fetch_alerts(client: httpx.AsyncClient):
    """Fetch and return the raw alerts JSON list, or None on error."""
    try:
        resp = await client.get(ALERTS_URL, timeout=HTTP_TIMEOUT_SECONDS)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, list):
            return []
        return data
    except Exception as exc:
        logger.warning("space_weather: alerts fetch failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Background poll task
# ---------------------------------------------------------------------------

async def _poll_once():
    """Perform a single poll of both NOAA endpoints and update _state."""
    async with httpx.AsyncClient() as client:
        kp_data, alerts_data = await asyncio.gather(
            _fetch_kp(client),
            _fetch_alerts(client),
        )

    if kp_data is None and alerts_data is None:
        # Both failed -- mark stale, preserve last known values
        _state.is_stale = True
        _state.error_message = "Both NOAA endpoints unreachable. Serving last known value."
        logger.warning("space_weather: all endpoints failed, serving stale data")
        return

    # --- Process K-index ---
    if kp_data is not None:
        recent = kp_data[-1]
        kp_val = float(recent.get("Kp", 0.0))

        history = [
            {"time_tag": r.get("time_tag", ""), "Kp": float(r.get("Kp", 0.0))}
            for r in kp_data[-HISTORY_MAXLEN:]
        ]
        _state.kp_current = kp_val
        _state.kp_history = history
        _state.error_message = None
    else:
        kp_val = _state.kp_current or 0.0
        logger.warning("space_weather: K-index unavailable; using last known Kp=%.2f", kp_val)

    # --- Process alerts ---
    if alerts_data is not None:
        active_gx, summaries = _parse_alerts(alerts_data)
    else:
        active_gx, summaries = False, []

    # --- Update state atomically ---
    _state.active_gx_alert  = active_gx
    _state.alert_details     = summaries
    _state.classification    = _classify(kp_val, active_gx)
    _state.last_confirmed_utc = datetime.now(timezone.utc).isoformat()
    _state.is_stale          = False

    logger.info(
        "space_weather: poll OK  Kp=%.2f  class=%s  gx_alert=%s",
        kp_val, _state.classification, active_gx,
    )


async def _background_poller():
    """Async background task: poll immediately, then every POLL_INTERVAL_SECONDS."""
    logger.info(
        "space_weather: background poller starting (interval=%ds = every 3 hours)",
        POLL_INTERVAL_SECONDS,
    )
    while True:
        try:
            await _poll_once()
        except Exception as exc:
            _state.is_stale = True
            _state.error_message = f"Unexpected poller error: {exc}"
            logger.exception("space_weather: unexpected error in poll cycle: %s", exc)
        await asyncio.sleep(POLL_INTERVAL_SECONDS)


# ---------------------------------------------------------------------------
# FastAPI router
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/api/space-weather", tags=["space-weather"])


@router.on_event("startup")
async def _start_poller():
    """Launch background poller when the FastAPI app starts."""
    global _poller_task
    _poller_task = asyncio.create_task(_background_poller())
    logger.info("space_weather: background poll task created")


@router.get("/status")
async def get_space_weather_status():
    """
    Return the current space-weather status.

    Response schema:
      classification      : "Quiet" | "Elevated" | "Storm Watch" | "unknown"
      kp_current          : float | null   -- latest planetary Kp value
      kp_history          : list           -- last 16 readings for sparkline
      active_gx_alert     : bool           -- G3+ alert detected
      alert_details       : list           -- up to 5 alert summaries
      last_confirmed_utc  : ISO-8601 str | null
      is_stale            : bool           -- true if last poll failed
      error_message       : str | null
      noaa_g_scale_note   : str            -- always present
      scope_note          : str            -- always present; non-lunar caveat

    SCOPE NOTE: This reflects near-Earth space-weather only. It is NOT a
    lunar surface radiation measurement and does NOT affect site scoring.
    """
    return {
        "classification":      _state.classification,
        "kp_current":          _state.kp_current,
        "kp_history":          _state.kp_history,
        "active_gx_alert":     _state.active_gx_alert,
        "alert_details":       _state.alert_details,
        "last_confirmed_utc":  _state.last_confirmed_utc,
        "is_stale":            _state.is_stale,
        "error_message":       _state.error_message,
        "noaa_g_scale_note": (
            "G-scale thresholds (NOAA official): G1=Kp\u22655 (Minor), "
            "G2=Kp\u22656 (Moderate), G3=Kp\u22657 (Strong). "
            "Source: swpc.noaa.gov/noaa-scales-explanation. "
            "K-index updates every 3 hours; badge reflects most recent 3-hour synoptic reading."
        ),
        "scope_note": (
            "Operational near-Earth space-weather status \u2014 "
            "not a direct measurement of lunar surface radiation. "
            "Does not affect site radiation scores or rankings."
        ),
    }


# ---------------------------------------------------------------------------
# Minimal standalone app for isolated testing
# ---------------------------------------------------------------------------
def create_app():
    """Create a minimal FastAPI app for testing this router standalone."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI(
        title="Space Weather Status API",
        description="Live NOAA K-index / G-scale status -- standalone test mode.",
        version="1.0.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["GET"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(create_app(), host="0.0.0.0", port=8001, log_level="info")
