"""
xai/gemini/__init__.py
======================
Gemini-powered XAI layer for the Lunar Habitat Site Selector.

This package adds natural-language explanation generation (via the Gemini API)
on top of the existing deterministic XAI layers. It is completely isolated
from the AHP scoring engine — the LLM never performs numerical calculations.

Architecture:
    AHP / Python calculations
         ↓
    xai/gemini/payloads.py       → XAI DTO structures (safe data transfer objects)
         ↓
    xai/gemini/risk_engine.py    → Derives risk levels from existing factor scores
         ↓
    xai/gemini/counterfactual.py → Mission-priority counterfactual engine (pure Python)
         ↓
    xai/gemini/gemini_service.py → Gemini API integration + deterministic fallback
         ↓
    xai/gemini/xai_gemini.py     → Orchestrator: runs all above, saves JSON outputs

Entry point:
    python -m xai.gemini.xai_gemini          # no API key → fallback explanations
    GEMINI_API_KEY=key python -m xai.gemini.xai_gemini   # with Gemini
"""
