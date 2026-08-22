# Lunar Habitat AI (LunaAstra)

Lunar Habitat AI is an advanced, end-to-end decision support system for selecting and justifying lunar habitat sites (e.g., Artemis mission planning). It combines spatial Machine Learning, deterministic Multi-Criteria Decision Making, Explainable AI (XAI), and Blockchain-backed auditability to create a transparent and tamper-proof site selection process.

## 🏗 System Architecture

The architecture is split into four distinct but integrated phases:

### 1. Machine Learning Pipeline (`ml/pipeline.py`)
Analyzes 160,000 lunar grid cells (Topography, Ice, Illumination) to discover patterns.
* **K-Means Clustering**: Partitions the lunar surface into distinct geological "Archetypes" (e.g., *Peak of Eternal Light*, *Deep PSR*). Used because it efficiently groups vast spatial data into interpretable zones.
* **GMM (Gaussian Mixture Model)**: Used as a probabilistic comparison to K-Means to ensure cluster robustness.
* **Isolation Forest**: An anomaly detection algorithm used to flag highly unusual grid cells (e.g., an extremely deep, permanently shadowed crater surrounded by high illumination) that might warrant special scientific interest or extreme caution.

### 2. Deterministic Scoring (`scoring_engine.py`)
Ranks specific candidate sites (e.g., Shackleton Crater, Malapert Massif).
* **AHP (Analytic Hierarchy Process)**: A structured technique for organizing and analyzing complex decisions based on mathematics and psychology. It assigns relative weights to factors (Safety, Ice, Sunlight, Resources, Expansion, Scientific Value) using a pairwise comparison matrix (Saaty 1-9 scale). We use AHP because it guarantees the ranking is mathematically sound, reproducible, and free from AI hallucination.

### 3. Explainable AI (XAI) Dashboard (`xai/gemini/` & `sample_ui/`)
Translates the hard math into human understanding.
* **Google Gemini (LLM - Large Language Model)**: Takes the deterministic AHP results and ML archetypes via strict JSON payloads and generates human-readable narratives. It explains *why* a site was selected, identifies team-specific *Risk & Mitigations*, and performs *Counterfactual Sensitivity* (what if our priorities changed?).

### 4. Blockchain Auditing (`blockchain/`)
Ensures the integrity of the site selection process.
* **Smart Contracts (Solidity/Ethereum)**: Generates a "Decision Manifest" containing cryptographic hashes (SHA-256) of the input data, the AHP configuration, and the final decision outputs. 
* **How it works in depth**: When a decision is finalized, a Python script compiles the hashes of all critical files and registers them to a local blockchain node (e.g., Hardhat). If a malicious actor or an accidental save alters the input data or changes the AHP weights to favor a different site, the `verify_decision.py` script will recalculate the hashes, compare them to the blockchain registry, and immediately fail the verification. This ensures complete, tamper-proof transparency for space agencies.

## 🚀 Getting Started

1. **Start the Blockchain Node** (in a separate terminal):
   ```bash
   npx hardhat node
   ```
2. **Run the ML Pipeline**:
   ```bash
   python ml/pipeline.py
   ```
3. **Run the Blockchain Tamper Demo**:
   ```bash
   python -m blockchain.demo
   ```
4. **Start the XAI Dashboard**:
   ```bash
   uvicorn sample_ui.backend:app --host 0.0.0.0 --port 8090 --env-file .env
   ```
   *Visit `http://localhost:8090` in your browser.*

## 🔒 Focus on Blockchain Implementation

The Blockchain module (`blockchain/`) solves the "Black Box Trust" problem. In high-stakes missions (like $10B space habitats), stakeholders need proof that the math wasn't manipulated behind closed doors to favor a specific contractor's landing site. 

**The Flow:**
1. `manifest.py` reads the exact state of the `sunlight_ice_dust_final.json`, the `ahp_config.json`, and the output result.
2. It generates a single Merkle-root style hash representing the entire state.
3. `registry.py` talks to an Ethereum Smart Contract (via Web3.py) and permanently logs this hash with a timestamp.
4. `verifier.py` can be run years later by a third-party auditor. It re-hashes the local files and queries the blockchain. If a single decimal point was changed in the AHP weights, the hashes won't match, proving tampering.
