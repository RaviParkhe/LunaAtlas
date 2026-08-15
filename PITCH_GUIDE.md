# 🏆 LunaAstra — Hackathon Presentation & Pitch Guide
**Project Code: SW02 | AI Lunar Habitat Site Selection Workstation**

---

## 1. The 30-Second Elevator Pitch

> *"Building humanity's first permanent lunar habitat is a multi-billion-dollar optimization problem. One wrong site choice means cryogenic power failure or catastrophic radiation exposure. **LunaAstra** is an aerospace-grade AI Decision Support Workstation that ingests real NASA LRO/LOLA orbital data across 160,000 lunar south pole cells, computing multi-objective physics trade-offs in under 5 milliseconds with real-time NOAA space weather resiliency."*

---

## 2. Core Credibility Moment: "Why Ranking, Not Supervised Prediction?"

**Question Judges Will Ask:** *"Why didn't you just train a supervised neural network or random forest on habitat survival?"*

**Your Winning Answer:**
> *"Humans have never built a lunar habitat before — there is zero historical labeled dataset of 'successful vs failed lunar bases'. Any supervised classifier would rely on fabricated labels. Instead, LunaAstra implements **Multi-Criteria Decision Analysis (MCDA)** — the exact mathematical framework NASA and ESA use for planetary landing site selection. Every factor is derived directly from calibrated NASA LROC illumination maps, LOLA polar DEMs, Robbins crater catalogs, and CRaTER radiation measurements."*

**The Headline Demo Validation:**
> *"When we set our system to Solar Power Priority, our #1 ranked site is the **Shackleton Crater Rim** ($53.3\%$ illumination peak and $86\%$ landing suitability), perfectly matching NASA's real Artemis III candidate selection."*

---

## 3. Live 3-Minute Hackathon Demo Flow

| Time | Action | What to Say / Show |
|---|---|---|
| **0:00 – 0:30** | **The Problem & 3D Globe** | Open **LunaAstra Desktop Workstation**. Show the interactive **3D Moon Globe** with the Lunar South Pole heatmap drape and 3D candidate site markers. |
| **0:30 – 1:00** | **Real-Time Physics Engine** | Switch to the **2D Raster Grid**. Adjust the **Mission Priority Sliders** (Sunlight, Water Ice, Landing Safety, Radiation). Show that all 160,000 cells and site rankings recalculate instantaneously ($<5\text{ms}$). |
| **1:00 – 1:30** | **AI Natural Language Interface** | Click **"AI Natural Language"**. Type: *"Prioritize water ice and radiation safety, slope is secondary"*. Show the NLP engine convert human language into normalized scoring weights and recalculate the leaderboard. |
| **1:30 – 2:00** | **"What-If" Trade-Off Analysis** | Click **"Compare Sites"**. Compare *Solar Power Maximization* vs. *ISRU Ice Mining*. Show the ranking shifts (Shackleton Rim $\rightarrow$ Haworth Crater) and explain the scientific trade-off commentary. |
| **2:00 – 2:30** | **Detailed Terrain Assessment** | Switch to the **Terrain Analysis Tab**. Show the $10\text{km}$ elevation cross-section profile, slope distribution donut chart ($78\% < 5^\circ$), and landing zone polar radar. |
| **2:30 – 3:00** | **Live Space Weather & Dossier** | Highlight the **Live NOAA SWPC Satellite Badge** (pulsing beacon showing real-time solar flare status). Click **"Export Report"** to generate the clean printable PDF Mission Dossier. |

---

## 4. Revenue & Commercialization Model (For Q&A)

1. **Institutional Licensing**: One-time or per-seat licensing for space agencies (NASA, ISRO, ESA) and prime aerospace contractors (SpaceX, Blue Origin, Lockheed Martin).
2. **On-Premise / Air-Gapped Software**: Aerospace and defense customers require secure, offline-capable local software rather than cloud databases — LunaAstra's standalone desktop architecture meets defense compliance standards out-of-the-box.
3. **Academic / Research SaaS**: Cloud-hosted tier for planetary science research labs and universities.

---

## 5. Summary of Built Assets

- 🚀 **One-Click Desktop Launcher**: `run_workstation.bat`
- 💻 **Developer Mode**: `run_dev.bat`
- 📁 **Clean Git Repository**: Version controlled and ready for submission
