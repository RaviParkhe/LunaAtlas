# 🌕 LunaAstra — AI Lunar Habitat Site Decision Support Workstation
**NSIC Software Track (SW02) — Lunar Habitat Site Selection using AI**

---

## 🎯 Problem Statement
Establishing a permanent, sustainable human habitat on the Moon requires optimizing across multi-physics constraints:
1. **Terrain Flatness & Construction Safety** (Slope gradients, surface roughness, impact crater hazard density).
2. **Solar Illumination & Energy Stability** (Maximizing peak photovoltaic hours and avoiding extended cryogenic nights).
3. **In-Situ Resource Utilization (ISRU)** (Access to water ice trapped within cryogenic Permanently Shadowed Regions / PSRs).
4. **Radiation Protection & Shielding** (Minimizing Galactic Cosmic Radiation / GCR exposure via natural terrain horizon obstruction).
5. **Operational Dust Dynamics** (Mitigating electrostatic dust levitation hazards along shadow terminators).

---

## 🔬 Core Decision-Support Architecture (Why Ranking vs Prediction)
Unlike consumer AI products, there is **zero historical ground-truth dataset** of human lunar habitat successes or failures. Supervised classification would invent artificial labels. 

**LunaAstra** implements **Multi-Criteria Decision Analysis (MCDA)** grounded in verified orbital science:
- **Orbital Datasets**: NASA LRO/LROC Illumination ($120\text{ m}$), USGS/LOLA Polar DEM ($240\text{ m}$), Robbins Lunar Crater Database, and CRaTER radiation baseline ($130\text{ mGy/year}$).
- **Spatial Matrix**: $400 \times 400\text{ km}$ Lunar South Pole grid ($160,000$ cells, South Polar Stereographic projection).
- **Dynamic Physics Engine**: Vectorized multi-criteria weighting with instantaneous recalculation ($< 5\text{ ms}$) across mission profiles (*Balanced Artemis*, *Power Maximization*, *ISRU/Water Mining*, *Maximum Safety*).
- **Candidate Ground-Truth Alignment**: Benchmarked against official NASA Artemis candidate sites (*Shackleton Crater Rim*, *de Gerlache Rim*, *Malapert Massif*, *Faustini Rim*, *Nobile Rim*, *Haworth Crater*).

---

## 📂 Project Organization

```
LunaAstra-Main/
├── backend/
│   ├── data_merger.py         # Unifies Track A (Terrain) & Track B (Sunlight/Ice) into binary NPZ cache
│   ├── scoring_engine.py      # Vectorized Multi-Criteria Decision Analysis & Top-N spatial clustering
│   ├── main.py                # FastAPI REST API & WebSockets (Part 4)
│   └── live_monitor.py        # Real-time NOAA Space Weather Prediction Center (SWPC) live monitor
├── data/
│   ├── merged_layers_400x400.npz   # High-speed compressed 160k-cell array cache
│   ├── merged_lunar_dataset.json   # Unified metadata and candidate site coordinates
│   ├── craters_in_box.csv          # Robbins Lunar Crater Database
│   ├── elevation_grid.json         # LOLA South Pole DEM metrics
│   ├── final_terrain_hazard_output.json
│   └── sunlight_ice_dust_final.json
├── frontend/                  # Mission Control Tactical GIS Workstation (React + WebGL)
├── scripts/                   # Data inspection, auditing, and export utilities
│   ├── inspect_pipeline_data.py
│   ├── audit_all_branches.py
│   └── extract_all_data.py
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart

### 1. Backend Engine
```bash
# Install dependencies
pip install fastapi uvicorn numpy pandas httpx pyproj

# Run Scoring Engine Test
python backend/scoring_engine.py
```

### 2. Candidate Sites Real Performance Preview
| Candidate Site | Sunlight | Ice Potential | Landing Safety | Radiation Score | Flatness Gate |
|---|---|---|---|---|---|
| **Shackleton Crater Rim** | **53.3** | 0.0 | **86.0** | 56.8 | **True** |
| **de Gerlache Rim** | **50.0** | 6.6 | 46.7 | 57.9 | **True** |
| **Malapert Massif** | **46.7** | 12.9 | 63.1 | 57.6 | **True** |
| **Faustini Rim** | 41.8 | 22.4 | **89.1** | 56.8 | **True** |
| **Nobile Rim** | 39.1 | 27.8 | 75.7 | 57.3 | **True** |
| **Haworth Crater** | 0.0 | **100.0** | 0.0 | 59.5 | False |

---
© 2026 LunaAstra Team — NSIC Track SW02
