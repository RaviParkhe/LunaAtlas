# Lunar Habitat AI — Presentation Guide

If you are presenting this project to a panel, stakeholders, or at a hackathon, use this narrative structure to effectively communicate the depth and innovation of the LunaAstra architecture.

## 🎤 1. The Hook (The Problem)
**What to say:**
"Selecting a site for a $10 Billion lunar habitat isn't just about finding ice; it's about balancing safety, logistics, and power while maintaining absolute transparency. Traditional methods rely on opaque AI models (black boxes) or highly political human negotiations where data can be manipulated to favor a specific contractor."

## 🧠 2. The Solution: ML + AHP (The Math)
**What to say:**
"We don't use AI to make the final decision. We use Machine Learning to *understand* the terrain, and deterministic math to *make* the decision."
* **Mention K-Means & GMM:** Explain that we process 160,000 spatial data points using K-Means clustering to classify the moon into distinct 'Archetypes' (like *Peaks of Eternal Light*). 
* **Mention Isolation Forest:** Highlight that we use this anomaly detection model to automatically flag extremely rare geological anomalies that might pose high risks or high scientific rewards.
* **Mention AHP (Analytic Hierarchy Process):** Emphasize that the actual site ranking is done using AHP. It's a proven mathematical framework that guarantees the ranking is 100% deterministic and reproducible based on our weighted priorities.

## 🗣 3. Explainable AI (XAI) Dashboard (The Demo)
**What to show:**
Open the Dashboard (`http://localhost:8090`).
**What to say:**
"Math is hard to read for policymakers. So, we built an Explainable AI layer using Google Gemini."
* **Demonstrate Site Selection:** Show how Gemini translates the AHP numbers into a human narrative.
* **Demonstrate Risk & Mitigation:** Change the 'Team Size' dropdown to "Large" and click Generate. Show the audience how Gemini dynamically understands that a large team elevates dust risk, and outputs localized mitigations.
* **Demonstrate Counterfactual Sensitivity:** Show the audience how the system explains "What if we cared more about Earth Comm line-of-sight? Shackleton Crater would win instead." This proves the system is robust and explores edge cases.

## 🔗 4. The Blockchain Implementation (The Trust Layer)
**What to show:**
Run the `python -m blockchain.demo` script in the terminal.
**What to say:**
"In multi-billion dollar aerospace contracts, trust is everything. How do you prove you didn't tweak the algorithm to favor Site A over Site B?"
* **Explain the Smart Contract:** We wrote an Ethereum Smart Contract that acts as an immutable Decision Registry. 
* **Explain the Manifest:** When a decision is finalized, we take a cryptographic hash (SHA-256) of the input data, the AHP configuration (the weights), and the final outputs.
* **Show the Tamper Demo:** 
  1. The demo registers the hash to the local blockchain (Hardhat).
  2. The demo maliciously alters the local result file.
  3. The verification script is run, and it **FAILS**, catching the tamper immediately because the new hash doesn't match the blockchain record.
  4. The file is restored, and verification **PASSES**.

**Conclusion:** 
"By combining ML for spatial understanding, AHP for deterministic ranking, Gemini LLM for human explanation, and Ethereum Blockchain for cryptographic auditability, Lunar Habitat AI represents the future of high-stakes, transparent aerospace decision-making."
