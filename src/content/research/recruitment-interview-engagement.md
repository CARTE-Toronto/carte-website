---
title: "Predicting Interview Engagement in Real-Time Recruitment: Class Imbalance and Behavioral Feature Analysis"
authors: "Kim, J., Seo, M., Choi, E. & Olson, A."
venue: "NML@ICDM 2025 (Workshop co-located with ICDM, Washington DC)"
year: 2025
description: "Machine learning models for predicting candidate interview engagement on a real-time recruitment platform under extreme class imbalance, highlighting the importance of behavioral and temporal features alongside algorithmic match scores."
featured: false
icon: "people"
tags: ["Machine Learning", "User Behavior", "Imbalanced Data"]
order: 8
---

This work studies interview engagement on a real-time recruitment platform characterized by extreme class imbalance between attended and missed interviews. Using 73,000 real-world candidate–job matching instances from a North American platform, the authors systematically evaluate 120 model configurations that combine multiple machine learning algorithms with different imbalance-handling strategies. The best-performing approach—LightGBM with a 1:3 class weighting scheme and Tomek Links undersampling—substantially improves macro F1 over a majority-class baseline, while feature analysis reveals that engagement and temporal signals are as predictive as algorithmic match scores. The study also uncovers counterintuitive behavioral patterns, including a negative association between match score and interview participation, offering concrete guidance for optimizing recruitment platforms and other real-time matching systems facing severe imbalance.

