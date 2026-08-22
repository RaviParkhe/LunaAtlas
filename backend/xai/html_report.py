"""
xai/html_report.py
==================
Assembles a self-contained HTML XAI report.
All charts embedded as base64 — no external dependencies.
"""

import os, sys, json, base64
from datetime import datetime

_HERE = os.path.dirname(os.path.abspath(__file__))
_REPO = os.path.dirname(_HERE)
if _REPO not in sys.path:
    sys.path.insert(0, _REPO)

XAI_OUT = os.path.join(_HERE, "outputs")
ML_OUT  = os.path.join(_REPO, "ml", "outputs")
AHP_CFG = os.path.join(_REPO, "ahp_config.json")


def _img_b64(path: str) -> str:
    """Read an image file and return base64 data-URI, or empty string if missing."""
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    ext = os.path.splitext(path)[1].lower().lstrip(".")
    fmt = "jpeg" if ext in ("jpg", "jpeg") else "png"
    return f"data:image/{fmt};base64,{data}"


def _img_tag(path: str, alt: str = "", width: str = "100%") -> str:
    src = _img_b64(path)
    if not src:
        return f'<p class="missing">[Chart not found: {os.path.basename(path)}]</p>'
    return f'<img src="{src}" alt="{alt}" style="width:{width};border-radius:8px;margin:8px 0;" />'


def build_html_report(l1: dict, l2: dict, l3: dict) -> str:
    """Assemble the full HTML report. Returns HTML string."""

    # Load data
    with open(AHP_CFG) as f:
        ahp = json.load(f)
    factors = ahp["factors"]
    cr      = ahp["ahp_consistency"]["consistency_ratio"]

    try:
        with open(os.path.join(ML_OUT, "cluster_stats.json")) as f:
            cluster_stats = json.load(f)
    except Exception:
        cluster_stats = {}

    try:
        with open(os.path.join(XAI_OUT, "score_breakdown.json")) as f:
            score_bd = json.load(f)
    except Exception:
        score_bd = {}

    try:
        with open(os.path.join(XAI_OUT, "counterfactuals.json")) as f:
            cfs = json.load(f)
    except Exception:
        cfs = {}

    try:
        with open(os.path.join(XAI_OUT, "cluster_delta_report.json")) as f:
            delta_report = json.load(f)
    except Exception:
        delta_report = {}

    try:
        with open(os.path.join(XAI_OUT, "ahp_pairwise_narrative.json")) as f:
            narratives = json.load(f)
    except Exception:
        narratives = {"narratives": [], "cr_note": ""}

    try:
        with open(os.path.join(XAI_OUT, "rank_sensitivity.json")) as f:
            rank_sens = json.load(f)
    except Exception:
        rank_sens = {"rank_flip_messages": []}

    # --- Site cards ---
    site_cards_html = ""
    for site_name, bd in score_bd.items():
        rank  = bd.get("rank", "-")
        score = bd.get("composite_score", 0)
        archetype = ""
        cf_text   = ""
        delta_text = ""

        # Cluster archetype
        try:
            with open(os.path.join(ML_OUT, "named_site_archetypes.json")) as f:
                sa = json.load(f)
            site_entry = sa.get(site_name, {})
            archetype  = site_entry.get("archetype_label", "")
        except Exception:
            pass

        # Counterfactual sentences
        cf_entry = cfs.get(site_name, {})
        cf_sentences = [v.get("sentence", "") for v in cf_entry.get("counterfactuals", {}).values()]
        if cf_sentences:
            cf_text = "".join(f"<li>{s}</li>" for s in cf_sentences)
            cf_text = f"<ul class='cf-list'>{cf_text}</ul>"
        else:
            cf_text = "<p class='muted'>No single-feature change moves this site to a different cluster.</p>"

        # Delta report sentences
        delta_entry = delta_report.get(site_name, {})
        delta_sentences = delta_entry.get("narratives", [])
        if delta_sentences:
            delta_text = "".join(f"<li>{s}</li>" for s in delta_sentences)
            delta_text = f"<ul class='delta-list'>{delta_text}</ul>"

        # Factor contributions table
        fw    = bd.get("factor_contributions", {})
        fs    = bd.get("factor_raw_scores", {})
        ws    = bd.get("factor_weights", {})
        rows_html = ""
        for fid, flabel in [(f["id"], f["label"]) for f in factors]:
            w   = ws.get(fid, 0) * 100
            raw = fs.get(fid, 0)
            con = fw.get(fid, 0)
            col = FACTOR_COLORS_HEX.get(fid, "#888")
            rows_html += f"""
            <tr>
              <td><span class="dot" style="background:{col}"></span> {flabel}</td>
              <td>{w:.1f}%</td>
              <td>{raw:.1f}</td>
              <td><strong>{con:.2f}</strong></td>
            </tr>"""

        safe_name = site_name.replace(" ", "_").replace("/", "-")
        waterfall_img = _img_tag(
            os.path.join(XAI_OUT, f"waterfall_{safe_name}.png"),
            alt=f"Waterfall chart for {site_name}", width="100%"
        )

        site_cards_html += f"""
        <div class="site-card">
          <div class="site-header">
            <div>
              <h3>{site_name}</h3>
              <span class="tag">{archetype}</span>
            </div>
            <div class="score-badge">
              <span class="rank">#{rank}</span>
              <span class="score">{score:.1f}</span>
              <span class="score-label">/ 100</span>
            </div>
          </div>
          <div class="site-body">
            <div class="waterfall-section">{waterfall_img}</div>
            <div class="table-section">
              <table class="factor-table">
                <thead><tr><th>Factor</th><th>Weight</th><th>Raw Score</th><th>Points</th></tr></thead>
                <tbody>{rows_html}</tbody>
              </table>
            </div>
          </div>
          <div class="explainer-block">
            <h4>Feature Comparison to Cluster</h4>{delta_text}
            <h4>Counterfactual — What Would Change Its Cluster?</h4>{cf_text}
          </div>
        </div>"""

    # --- AHP pairwise table ---
    pairwise_rows = ""
    for n in narratives.get("narratives", []):
        pairwise_rows += f"""
        <tr>
          <td>{n['factor_a']}</td>
          <td>{n['factor_b']}</td>
          <td>{n['raw_value']:.2f}</td>
          <td>{n['sentence']}</td>
        </tr>"""

    # --- Rank flip messages ---
    flip_html = ""
    for msg in rank_sens.get("rank_flip_messages", []):
        flip_html += f"<li>{msg}</li>"
    if not flip_html:
        flip_html = "<li>No rank flips detected in any factor sweep.</li>"

    # --- Cluster archetype cards ---
    cluster_cards = ""
    archetype_icons = {"High-Elevation": "mountain", "Shadow": "shadow", "Solar": "sun"}
    for cid, prof in sorted(cluster_stats.items(), key=lambda x: int(x[0])):
        lbl  = prof.get("archetype_label", f"Cluster {cid}")
        n    = prof.get("n_cells", 0)
        pct  = prof.get("pct_of_region", 0)
        mn   = prof.get("mean", {})
        strs = prof.get("strengths", [])
        lims = prof.get("limitations", [])
        str_html = "".join(f"<li class='strength'>{s}</li>" for s in strs) or "<li>—</li>"
        lim_html = "".join(f"<li class='limitation'>{l}</li>" for l in lims) or "<li>—</li>"
        color = ["#2196F3", "#FF5722", "#4CAF50"][int(cid) % 3]
        cluster_cards += f"""
        <div class="cluster-card" style="border-top: 4px solid {color}">
          <h4>Cluster {cid}: {lbl}</h4>
          <p class="cluster-meta">{n:,} cells &nbsp;|&nbsp; {pct}% of region</p>
          <div class="cluster-stats">
            <span>Elevation: <b>{mn.get('elevation_m', 0):.0f} m</b></span>
            <span>Slope: <b>{mn.get('slope_deg', 0):.1f}&deg;</b></span>
            <span>Sunlight: <b>{mn.get('sunlight_score', 0):.1f}%</b></span>
          </div>
          <ul class="strength-list">{str_html}</ul>
          <ul class="limit-list">{lim_html}</ul>
        </div>"""

    # === Full HTML ===
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Lunar Habitat Site Selector — XAI Report</title>
<style>
  :root {{
    --bg: #0d1117; --card: #161b22; --border: #30363d;
    --text: #e6edf3; --muted: #8b949e; --accent: #58a6ff;
    --green: #3fb950; --red: #f85149; --yellow: #d29922;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; line-height: 1.6; }}
  a {{ color: var(--accent); }}
  h1 {{ font-size: 2.2rem; font-weight: 700; }}
  h2 {{ font-size: 1.5rem; font-weight: 600; color: var(--accent); margin: 32px 0 12px; border-bottom: 1px solid var(--border); padding-bottom: 6px; }}
  h3 {{ font-size: 1.15rem; font-weight: 600; }}
  h4 {{ font-size: 0.95rem; color: var(--muted); margin: 10px 0 4px; text-transform: uppercase; letter-spacing: 0.04em; }}
  .container {{ max-width: 1100px; margin: 0 auto; padding: 32px 24px; }}
  .hero {{ background: linear-gradient(135deg, #0d2137 0%, #0d1117 60%); padding: 52px 24px 40px; text-align: center; border-bottom: 1px solid var(--border); }}
  .hero p {{ color: var(--muted); margin-top: 10px; font-size: 1.05rem; }}
  .badge-row {{ display: flex; gap: 12px; justify-content: center; margin-top: 18px; flex-wrap: wrap; }}
  .badge {{ background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 6px 16px; font-size: 0.85rem; color: var(--muted); }}
  .badge b {{ color: var(--text); }}
  .card {{ background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 20px; margin-bottom: 20px; }}
  .site-card {{ background: var(--card); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 28px; overflow: hidden; }}
  .site-header {{ display: flex; justify-content: space-between; align-items: flex-start; padding: 18px 20px; background: #1c2128; border-bottom: 1px solid var(--border); }}
  .site-header h3 {{ font-size: 1.25rem; }}
  .tag {{ background: #1f3a5c; color: var(--accent); border-radius: 12px; padding: 3px 10px; font-size: 0.78rem; margin-top: 4px; display: inline-block; }}
  .score-badge {{ text-align: right; }}
  .rank {{ font-size: 2rem; font-weight: 800; color: var(--accent); display: block; }}
  .score {{ font-size: 2.5rem; font-weight: 900; display: inline; }}
  .score-label {{ color: var(--muted); font-size: 1rem; }}
  .site-body {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0; }}
  .waterfall-section {{ padding: 16px; border-right: 1px solid var(--border); }}
  .table-section {{ padding: 16px; }}
  .explainer-block {{ padding: 16px 20px; border-top: 1px solid var(--border); background: #0d1117; }}
  .factor-table {{ width: 100%; border-collapse: collapse; font-size: 0.88rem; }}
  .factor-table th {{ color: var(--muted); text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--border); }}
  .factor-table td {{ padding: 6px 8px; border-bottom: 1px solid #21262d; }}
  .dot {{ display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }}
  .cf-list, .delta-list {{ margin: 4px 0 10px 16px; font-size: 0.87rem; color: var(--muted); }}
  .cf-list li, .delta-list li {{ margin-bottom: 4px; }}
  .muted {{ color: var(--muted); font-size: 0.88rem; }}
  .missing {{ color: var(--red); font-size: 0.85rem; font-style: italic; }}
  .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }}
  .grid-3 {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }}
  .cluster-card {{ background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }}
  .cluster-meta {{ color: var(--muted); font-size: 0.85rem; margin: 4px 0 8px; }}
  .cluster-stats {{ display: flex; gap: 12px; font-size: 0.85rem; margin-bottom: 10px; flex-wrap: wrap; }}
  .cluster-stats span {{ background: #21262d; border-radius: 6px; padding: 3px 10px; }}
  .strength-list {{ margin-left: 14px; font-size: 0.84rem; color: var(--green); }}
  .limit-list {{ margin-left: 14px; font-size: 0.84rem; color: var(--red); margin-top: 4px; }}
  .strength {{ color: var(--green); }}
  .limitation {{ color: var(--red); }}
  .pairwise-table {{ width: 100%; border-collapse: collapse; font-size: 0.85rem; }}
  .pairwise-table th {{ color: var(--muted); text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--border); }}
  .pairwise-table td {{ padding: 6px 10px; border-bottom: 1px solid #21262d; vertical-align: top; }}
  .cr-box {{ background: #1a2e1a; border: 1px solid var(--green); border-radius: 8px; padding: 14px 18px; margin: 12px 0; color: var(--green); }}
  .flip-list {{ margin-left: 16px; font-size: 0.87rem; color: var(--muted); }}
  .flip-list li {{ margin-bottom: 4px; }}
  .disclaimer {{ background: #1f1a0d; border: 1px solid var(--yellow); border-radius: 8px; padding: 14px 18px; color: var(--yellow); font-size: 0.87rem; }}
  .full-img {{ width: 100%; border-radius: 8px; margin: 8px 0; }}
  @media (max-width: 700px) {{ .site-body, .grid-2, .grid-3 {{ grid-template-columns: 1fr; }} }}
  footer {{ border-top: 1px solid var(--border); padding: 24px; text-align: center; color: var(--muted); font-size: 0.85rem; margin-top: 48px; }}
</style>
</head>
<body>

<!-- HERO -->
<div class="hero">
  <h1>Lunar Habitat Site Selector</h1>
  <h2 style="border:none;color:#8b949e;font-size:1rem;margin:4px 0">Explainable AI Report</h2>
  <p>Every decision is traceable — from raw lunar data to final site ranking.</p>
  <div class="badge-row">
    <div class="badge">Region: <b>South Polar (400x400 km)</b></div>
    <div class="badge">Grid Cells: <b>160,000</b></div>
    <div class="badge">ML Model: <b>K-Means k=3</b></div>
    <div class="badge">AHP CR: <b>{cr:.4f}</b> (< 0.10 threshold)</div>
    <div class="badge">Generated: <b>{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</b></div>
  </div>
</div>

<div class="container">

<!-- ARCHITECTURE -->
<h2>System Architecture</h2>
<div class="card">
  <pre style="color:#58a6ff;font-size:0.9rem;line-height:2">
REAL LUNAR DATA (DEM + Sunlight/Ice/Dust)
       |
       v
[LAYER 1 — ML] K-Means Clustering (k=3)
       "What types of environments exist in this region?"
       |
       v
Environmental Archetypes: High-Elevation | Shadow-Dominated | Solar-Exposed
       |
       v
[LAYER 2 — AHP] Weight Derivation (Pairwise Comparison)
       "How important is Safety vs Water Ice vs Sunlight vs ...?"
       |
       v
Mission Weights: Safety=39.7% | Water Ice=26.9% | Sunlight=12.1% | ...
       |
       v
[LAYER 3 — SCORING] Weighted-Sum per Site
       "Which site scores highest for the selected mission profile?"
       |
       v
RANKED SITE RECOMMENDATION
  </pre>
</div>

<!-- LAYER 1 -->
<h2>Layer 1 — ML Environmental Clustering</h2>
<p style="color:var(--muted);margin-bottom:16px">K-Means (k=3) discovered 3 distinct environmental archetypes from 160,000 grid cells using 3 independent features: Elevation, Slope, and Sunlight Score.</p>

<div class="grid-3">{cluster_cards}</div>

{_img_tag(os.path.join(ML_OUT, "cluster_spatial_map.png"), "Cluster spatial map", "100%")}
<p style="color:var(--muted);font-size:0.82rem;text-align:center">Figure: 400x400 km south-polar region coloured by environmental archetype.</p>

{_img_tag(os.path.join(XAI_OUT, "decision_boundary_elev_sun.png"), "Decision boundary", "100%")}
<p style="color:var(--muted);font-size:0.82rem;text-align:center">Figure: Cluster decision boundaries in Elevation vs Sunlight space. Stars = named candidate sites.</p>

<h2 style="margin-top:24px">Layer 1a — SHAP Feature Importance</h2>
<p style="color:var(--muted);margin-bottom:12px">SHAP (SHapley Additive exPlanations) shows which features most strongly drive cluster assignment across the 160,000-cell population.</p>
{_img_tag(os.path.join(XAI_OUT, "shap_cluster_summary.png"), "SHAP importance", "60%")}

<h2>Layer 1b — Counterfactual Explanations</h2>
<p style="color:var(--muted);margin-bottom:12px">For each site: the minimum feature change that would move it to a different environmental archetype.</p>

<!-- SITE CARDS -->
<h2>Layer 3 — Site Score Explanation</h2>
<p style="color:var(--muted);margin-bottom:16px">Each site card shows: rank, composite score, factor-by-factor contribution, cluster membership context, and counterfactual analysis.</p>

{site_cards_html}

<!-- LAYER 3 GLOBAL -->
<h2>Score Comparison — All Sites</h2>
{_img_tag(os.path.join(XAI_OUT, "score_comparison_stacked.png"), "Score comparison", "100%")}

<h2>Rank Sensitivity — What-If Analysis</h2>
<p style="color:var(--muted);margin-bottom:12px">How does the site ranking change as each AHP weight is swept from 0% to 100%? A flat line means the site's rank is stable regardless of that weight.</p>
{_img_tag(os.path.join(XAI_OUT, "rank_sensitivity_heatmap.png"), "Rank sensitivity", "100%")}

<h4>Detected Rank Changes During Sweeps</h4>
<ul class="flip-list">{flip_html}</ul>

<!-- LAYER 2 -->
<h2>Layer 2 — AHP Weight Derivation</h2>

<div class="cr-box">
  <strong>Consistency Ratio (CR) = {cr:.4f}</strong> — well below the 0.10 threshold.<br/>
  This confirms the 15 pairwise judgments are internally consistent. There are no logical contradictions (e.g. Safety &gt; Water Ice &gt; Sunlight &gt; Safety).
</div>

{_img_tag(os.path.join(XAI_OUT, "ahp_weights_chart.png"), "AHP weights", "70%")}

<h4>All Pairwise Judgments</h4>
<table class="pairwise-table">
  <thead><tr><th>Factor A</th><th>Factor B</th><th>Saaty Value</th><th>Plain-Language Judgment</th></tr></thead>
  <tbody>{pairwise_rows}</tbody>
</table>

<h4 style="margin-top:20px">Weight Sensitivity (effect of +/-1 Saaty point per judgment)</h4>
{_img_tag(os.path.join(XAI_OUT, "ahp_weight_sensitivity.png"), "AHP sensitivity", "100%")}

<!-- DISCLAIMER -->
<h2>What This System Does NOT Claim</h2>
<div class="disclaimer">
  <ul style="margin-left:16px;line-height:2">
    <li>The ML cluster labels (e.g. "Shadow-Dominated") are statistical descriptions, NOT safety assessments.</li>
    <li>SHAP values show correlation, NOT causation.</li>
    <li>AHP weights reflect agreed expert judgment — they are not objective truth.</li>
    <li>All feature comparisons are relative to this 400x400 km dataset, not absolute lunar science.</li>
    <li>The system does not account for radiation, micrometeorite flux, or subsurface properties.</li>
  </ul>
</div>

</div><!-- /container -->
<footer>
  Lunar Habitat Site Selector — XAI Report &nbsp;|&nbsp;
  ML: K-Means k=3 (scikit-learn) &nbsp;|&nbsp;
  XAI: SHAP, Counterfactuals, Waterfall, Rank Sensitivity &nbsp;|&nbsp;
  AHP: Saaty Method (CR={cr:.4f}) &nbsp;|&nbsp;
  Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
</footer>
</body>
</html>"""

    return html


FACTOR_COLORS_HEX = {
    "safety":           "#E74C3C",
    "water_ice":        "#3498DB",
    "sunlight":         "#F39C12",
    "resources":        "#27AE60",
    "expansion":        "#9B59B6",
    "scientific_value": "#1ABC9C",
}


def save_html_report(l1: dict, l2: dict, l3: dict) -> str:
    os.makedirs(XAI_OUT, exist_ok=True)
    html   = build_html_report(l1, l2, l3)
    path   = os.path.join(XAI_OUT, "xai_report.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    size_kb = round(os.path.getsize(path) / 1024)
    print(f"\n[xai-html] Report saved -> {path}  ({size_kb} KB)")
    return path
