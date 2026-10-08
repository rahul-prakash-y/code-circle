# Track 7: AI & Machine Learning — From Mathematical Foundations to Production MLOps

**Category**: Artificial Intelligence & Machine Learning  
**Target Audience**: AI Engineers, Machine Learning Researchers, Data Scientists  
**Core Technologies**: Python 3.12, NumPy, Pandas, Scikit-Learn, PyTorch, FastAPI, MLflow, Docker  
**Total Estimated Duration**: 140 Hours  

---

## Level 1: Foundations of Artificial Intelligence & Python Vectorization
- **Difficulty**: Beginner
- **Estimated Completion Time**: 10 Hours
- **Prerequisites**: High-school algebra and basic Python syntax.
- **Skills Unlocked**: AI taxonomy (Narrow vs General AI, Supervised, Unsupervised, Reinforcement), Python scientific environment, NumPy N-dimensional arrays (`ndarray`), Vectorized operations, Broadcasting rules.

### Description & Objectives
Understand the fundamental paradigm shift from rule-based programming to data-driven learning. Eliminate slow Python loops through NumPy vectorization.

### Key Concepts & Exercises
- Why Vectorization matters: SIMD instructions and contiguous memory allocation in NumPy.
- NumPy array manipulation: Reshaping, slicing, boolean indexing, mathematical reductions (`sum`, `mean`, `std`).

### Coding Challenges
- **Easy**: Vectorized Matrix Mean Normalizer using NumPy.
- **Medium**: High-Speed Euclidean Distance Matrix Computation (without nested loops).
- **Hard**: Custom One-Hot Encoder Function using Vectorized Indexing.

### Mini Project
- **Level 1 Micro-Utility**: **Vectorized Numerical Data Profiler & Summary Tool**
- Standalone Python utility computing vector summaries, detecting zero-variance features, and benchmarking vectorized vs native loop runtimes.

---

## Level 2: Applied Mathematics for Machine Learning
- **Difficulty**: Elementary
- **Estimated Completion Time**: 12 Hours
- **Skills Unlocked**: Vector dot products, Matrix multiplication, Eigenvalues & Eigenvectors, Partial derivatives, Gradients, Cost functions, Probability distributions (Gaussian, Bernoulli), Bayes' Theorem.

### Key Concepts & Exercises
- Linear Algebra: Geometry of dot products (cosine similarity), matrix transformations.
- Calculus: Gradient vectors ($\nabla f$) pointing in the direction of steepest ascent.
- Probability: Maximum Likelihood Estimation (MLE) concepts.

### Coding Challenges
- **Easy**: Analytical Gradient Calculation for Mean Squared Error (MSE).
- **Medium**: Cosine Similarity Matrix Calculator for Document Vectors.
- **Hard**: Numerical Gradient Descent Optimizer with Learning Rate Scheduling.

### Mini Project
- **Level 2 Utility**: **Linear Algebra & Statistical Geometry Engine**
- Python tool that projects high-dimensional vectors onto 2D planes, computes covariance matrices, and calculates statistical probabilities.

---

## Level 3: Data Preprocessing & Feature Transformation
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Pandas DataFrames, Handling missing data (Imputation: mean, median, iterative), Categorical Encoding (One-Hot, Ordinal, Target), Feature Scaling (StandardScaler, MinMaxScaler, RobustScaler), Outlier detection (IQR, Z-Score).

### Key Concepts & Exercises
- Preventing Data Leakage: Why scalers must be fit ONLY on training sets before transforming validation/test splits.
- Handling skewed distributions with log and Box-Cox transformations.
- Vectorized string and timestamp transformations in Pandas.

### Coding Challenges
- **Easy**: Missing Value Imputer with Column-Specific Fallback Strategies.
- **Medium**: Robust Outlier Clamper using Interquartile Range (IQR).
- **Hard**: Automated Feature Preprocessing Pipeline using Scikit-Learn `ColumnTransformer`.

### Mini Project
- **Level 3 Logic App**: **Automated Dataset Cleaning & Sanitization Pipeline**
- Production-grade ETL script that ingests raw, messy CSV files, detects anomalies, applies leakage-free transformations, and outputs analysis-ready Parquet files.

---

## Level 4: Exploratory Data Analysis (EDA) & Visual Storytelling
- **Difficulty**: Upper-Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Matplotlib, Seaborn, Univariate/Bivariate/Multivariate analysis, Correlation heatmaps, Pairplots, Boxplots for distribution shifts, Interactive visualization with Plotly.

### Key Concepts & Exercises
- Identifying collinearity and multicollinearity with Variance Inflation Factor (VIF).
- Detecting class imbalance in target labels.
- Generating publication-quality charts and actionable statistical narratives.

### Coding Challenges
- **Easy**: Automated Correlation Matrix Plotter with Threshold Filtering.
- **Medium**: Target Distribution Shift Visualizer across Train and Test Splits.
- **Hard**: Comprehensive Automated EDA Summary Report Generator.

### Mini Project
- **Level 4 Data-Processing App**: **Exploratory Data Analysis Report Suite for Loan Defaults**
- Comprehensive EDA notebook and automated script examining 10,000+ credit records, diagnosing risk factors, and surfacing actionable insights.

---

## Level 5: Classical Supervised Learning: Regression & Classification
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: Linear Regression (Ordinary Least Squares vs Ridge vs Lasso), Logistic Regression, Decision Trees (Entropy, Gini impurity), Random Forests, K-Nearest Neighbors (KNN), Scikit-Learn estimators.

### Key Concepts & Exercises
- Bias-Variance Tradeoff: Underfitting vs Overfitting.
- Regularization: L1 (Lasso) for feature selection vs L2 (Ridge) for shrinkage.
- Ensemble methods: Bagging and bootstrap sampling in Random Forests.

### Coding Challenges
- **Easy**: Polynomial Regression Model with L2 Regularization.
- **Medium**: Logistic Regression Classifier with Decision Threshold Tuning.
- **Hard**: Random Forest Classifier with Custom Feature Importance Extractor.

### Mini Project
- **Level 5 Structured App**: **Hospital Patient Readmission Prediction System**
- Complete supervised learning pipeline predicting whether discharged patients will be readmitted within 30 days, optimizing recall to minimize clinical risk.

---

## Level 6: Unsupervised Learning & Dimensionality Reduction
- **Difficulty**: Advanced
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: K-Means Clustering, Elbow Method & Silhouette Analysis, Hierarchical Clustering (Dendrograms), DBSCAN (Density-based spatial clustering), Principal Component Analysis (PCA), t-SNE fundamentals.

### Key Concepts & Exercises
- The curse of dimensionality and geometric distance degradation.
- PCA: Covariance matrix decomposition, explained variance ratio.
- Density-based clustering: Finding arbitrary non-spherical clusters and identifying noise points.

### Coding Challenges
- **Easy**: K-Means Clustering with Automated Optimal $K$ Detection via Silhouette Score.
- **Medium**: PCA Dimensionality Reducer retaining 95% Explained Variance.
- **Hard**: Anomaly Detection Engine using Isolation Forest and DBSCAN.

### Mini Project
- **Level 6 Structured App**: **E-Commerce Customer Behavioral Segmentation Engine**
- Unsupervised clustering system grouping customer transaction patterns into actionable personas for targeted marketing.

---

## Level 7: Rigorous Model Evaluation & Feature Engineering
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: Stratified K-Fold Cross-Validation, Evaluation Metrics (ROC-AUC, Precision, Recall, F1-Score, PR-AUC, Confusion Matrix), Hyperparameter Optimization (GridSearchCV, RandomizedSearchCV, Optuna), Feature Selection (SHAP values, Permutation Importance).

### Key Concepts & Exercises
- Why Accuracy is deceiving on imbalanced datasets (e.g., fraud detection).
- Hyperparameter tuning using Bayesian Optimization with Optuna.
- Explainable AI (XAI): Computing SHAP (SHapley Additive exPlanations) values to interpret black-box models.

### Coding Challenges
- **Easy**: Stratified Cross-Validation Loop with Custom Metric Scoring.
- **Medium**: Optuna Objective Function for XGBoost Hyperparameter Tuning.
- **Hard**: SHAP Value Feature Importance & Dependency Explainer Pipeline.

### Mini Project
- **Level 7 Real-World App**: **Credit Card Fraud Detection Engine with XAI Explainability**
- High-precision classification system handling extreme class imbalance (0.1% fraud), utilizing SMOTE / class weights, cross-validation, and SHAP decision explanations.

---

## Level 8: Deep Learning Foundations with PyTorch
- **Difficulty**: Advanced
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: PyTorch Tensors, Autograd (`loss.backward()`), Neural Network Architecture (`nn.Module`), Activation Functions (ReLU, GELU, Softmax), Optimizers (Adam, SGD with momentum), Loss functions (CrossEntropyLoss, MSELoss), Convolutional Neural Networks (CNNs).

### Key Concepts & Exercises
- The forward pass, loss calculation, backpropagation, and optimizer step cycle.
- Convolutional layers: Kernels, stride, padding, pooling, receptive fields.
- Preventing vanishing/exploding gradients with Batch Normalization and Residual connections.

### Coding Challenges
- **Easy**: Custom PyTorch Multi-Layer Perceptron (MLP) for Tabular Data.
- **Medium**: Custom PyTorch Training & Validation Loop with Early Stopping.
- **Hard**: Convolutional Neural Network (CNN) with Residual Blocks for Image Classification.

### Mini Project
- **Level 8 Real-World App**: **Medical Chest X-Ray Pneumonia Classification System**
- Deep learning computer vision pipeline trained in PyTorch to classify chest radiographs, generating Grad-CAM heatmaps to visualize model attention regions.

---

## Level 9: Advanced AI: Transfer Learning, NLP & Transformers
- **Difficulty**: Professional
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: Transfer Learning (Fine-tuning pre-trained models via Hugging Face), Tokenization (Byte-Pair Encoding), Self-Attention Mechanism, Transformers architecture, Text Embeddings, Vector Databases (ChromaDB / Pinecone), Retrieval-Augmented Generation (RAG) fundamentals.

### Key Concepts & Exercises
- The Transformer breakthrough: Multi-Head Self-Attention ($Q, K, V$ matrices).
- Leveraging pre-trained foundation models (BERT, RoBERTa, LLaMA) with parameter-efficient fine-tuning (PEFT/LoRA).
- Semantic search pipelines combining dense embeddings and vector databases.

### Coding Challenges
- **Easy**: Semantic Text Similarity Matcher using Sentence Transformers.
- **Medium**: Fine-Tuning a Transformer Classifier with Hugging Face Trainer.
- **Hard**: RAG Question-Answering Pipeline querying Local Knowledge Documents.

### Mini Project
- **Level 9 Production Project**: **Enterprise Technical Documentation AI Assistant**
- RAG-powered intelligent question-answering assistant that indexes internal PDF/Markdown manuals into ChromaDB and generates cited, grounded answers using open-source LLMs.

---

## Level 10: Production MLOps & Capstone
- **Difficulty**: Capstone / Professional
- **Estimated Completion Time**: 22 Hours
- **Skills Unlocked**: MLOps lifecycle, Model Serialization (ONNX, TorchScript), High-Performance Inference APIs with FastAPI, Experiment Tracking with MLflow, Model Monitoring (Data Drift, Concept Drift with Evidently AI), Docker containerization, Responsible AI & Fairness audits.

### Key Concepts & Exercises
- Exporting trained PyTorch models to ONNX runtime for $5\times$ faster CPU/GPU inference.
- Building asynchronous, low-latency REST endpoints for real-time model inference.
- Detecting distribution drift between production input data and training baselines.

### Level 10 Capstone Project
- **Production Capstone**: **End-to-End Enterprise Real-Time AI Inference & Monitoring Platform**
  - **Scope**: Production-ready, cloud-deployable machine learning platform serving real-time predictions with monitoring and automated retraining pipelines.
  - **Key Features**:
    - High-throughput FastAPI serving engine running ONNX-optimized models with sub-20ms inference latency.
    - Automated MLflow experiment tracking logging metrics, parameters, and model artifacts.
    - Real-time data drift monitoring engine alerting on statistical distribution shifts.
    - Fully containerized with Docker, automated unit tests for model inputs/outputs, and documented API endpoints via Swagger.
