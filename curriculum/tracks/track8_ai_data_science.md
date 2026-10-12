# Track 8: AI & Data Science — From Exploratory Analytics to Production Data Products

**Category**: Artificial Intelligence & Data Science  
**Target Audience**: Data Scientists, Analytics Engineers, Business Intelligence Leaders  
**Core Technologies**: Python 3.12, Pandas, SQL (PostgreSQL), DuckDB, Plotly, Scikit-Learn, Streamlit, FastAPI  
**Total Estimated Duration**: 135 Hours  

---

## Level 1: The Data Science Lifecycle & Python Foundations
- **Difficulty**: Beginner
- **Estimated Completion Time**: 8 Hours
- **Prerequisites**: High-school mathematics.
- **Skills Unlocked**: CRISP-DM lifecycle (Business Understanding $\to$ Deployment), Jupyter notebooks, Python primitives, Type structures, Basic statistical terms (Mean, Median, Mode, Variance).

### Description & Objectives
Understand how business problems are translated into quantitative hypotheses. Learn the end-to-end data science lifecycle and set up a scientific Python workstation.

### Coding Challenges
- **Easy**: Summary Statistic Calculator for Raw Integer Lists.
- **Medium**: Categorical Frequency Table and Percentile Rank Generator.
- **Hard**: Automated Column Type Classifier (Continuous vs Categorical vs Text).

### Mini Project
- **Level 1 Micro-Utility**: **Dataset Statistical Profiler & Metadata Extractor**
- CLI tool scanning tabular files, extracting record counts, missing percentages, data types, and five-number summaries.

---

## Level 2: High-Performance Data Manipulation with Pandas & NumPy
- **Difficulty**: Elementary
- **Estimated Completion Time**: 12 Hours
- **Skills Unlocked**: Pandas Series and DataFrames, Indexing (`loc`, `iloc`), Multi-indexing, Filtering, GroupBy operations, Aggregations, Joining/Merging (`merge`, `concat`).

### Key Concepts & Exercises
- Fast vectorized transformations vs slow `.iterrows()` loops.
- Split-Apply-Combine strategy with `.groupby().agg()`.
- Reshaping data: Pivoting, melting, and stacking.

### Coding Challenges
- **Easy**: Multi-Condition DataFrame Filtering & Sorting.
- **Medium**: Multi-Level GroupBy Aggregation (Total, Mean, 95th Percentile).
- **Hard**: Reshaping Wide Survey Data to Tidy Long Format via `pd.melt()`.

### Mini Project
- **Level 2 Utility**: **Automated Multi-Source Sales Transaction Consolidation Pipeline**
- Ingests multiple branch CSV files, standardizes headers, performs relational merges, and generates sales summary tables.

---

## Level 3: Rigorous Probability & Inferential Statistics
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Probability distributions (Normal, Binomial, Poisson, Exponential), Central Limit Theorem (CLT), Hypothesis Testing ($Z$-test, $t$-test, ANOVA, Chi-Square), $p$-values, Confidence intervals, Correlation vs Causation.

### Key Concepts & Exercises
- Formulating null ($H_0$) and alternative ($H_1$) hypotheses.
- Avoiding $p$-hacking and understanding Type I ($\alpha$) and Type II ($\beta$) errors.
- Statistically sound A/B test analysis.

### Coding Challenges
- **Easy**: Normal Distribution Probability Density Calculator.
- **Medium**: Independent Two-Sample $t$-Test with Confidence Interval Output.
- **Hard**: Automated A/B Testing Evaluation Script with Sample Size Power Calculation.

### Mini Project
- **Level 3 Logic App**: **Statistically Sound E-Commerce A/B Experimentation Analyzer**
- Evaluates conversion rates between variant A and variant B, computing test statistics, $p$-values, effect sizes (Cohen's $d$), and business recommendations.

---

## Level 4: Advanced Data Cleaning & Feature Engineering
- **Difficulty**: Upper-Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Handling missing data (MCAR, MAR, MNAR), Advanced imputation (KNN, MICE), Outlier treatment (Tukey fences, Winsorization), Categorical feature encoding, Text normalization, DateTime feature extraction.

### Key Concepts & Exercises
- Diagnosing missingness mechanisms before applying imputation.
- Encoding high-cardinality categories using Target Encoding with smoothing.
- Engineering cyclical features from dates/times (sine/cosine transformations).

### Coding Challenges
- **Easy**: Cyclical Date-Time Transformer (Hour of Day $\to$ Sin/Cos components).
- **Medium**: High-Cardinality Target Encoder with Cross-Validation Smoothing.
- **Hard**: Robust Multi-Column Data Quality Cleaning & Sanitization Suite.

### Mini Project
- **Level 4 Data-Processing App**: **Messy Healthcare Patient Data Ingestion & Sanitization Engine**
- Ingests dirty healthcare records with mixed formats, malformed dates, typos, and outliers, producing clean, validated data ready for modeling.

---

## Level 5: Exploratory Data Analysis & Visual Storytelling
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Data storytelling principles, Seaborn, Matplotlib, Interactive visualizations with Plotly, Distribution charts (KDE, Violin plots), Geospatial mapping (Choropleth), Dashboard wireframing.

### Key Concepts & Exercises
- Choosing the right chart type for relational, comparative, and composition queries.
- Designing accessible color palettes (colorblind-safe).
- Building interactive charts with tooltips, zooming, and dynamic filtering using Plotly.

### Coding Challenges
- **Easy**: Customized Multi-Faceted Scatter Plot using Seaborn.
- **Medium**: Interactive Time-Series Financial Candlestick Chart with Plotly.
- **Hard**: Geospatial Choropleth Visualizer for Regional Sales Metrics.

### Mini Project
- **Level 5 Structured App**: **Interactive Executive Global Climate & Carbon Dashboard**
- Interactive Plotly-based dashboard examining decades of climate indicators across countries, with interactive sliders, maps, and statistical breakdowns.

---

## Level 6: SQL & Modern Analytical Data Warehousing
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: Advanced SQL, Relational joins (Inner, Left, Full, Cross), Aggregation with `GROUP BY` and `HAVING`, Window Functions (`ROW_NUMBER()`, `RANK()`, `LEAD()`, `LAG()`, `SUM() OVER()`), Common Table Expressions (CTEs), DuckDB in-process OLAP queries.

### Key Concepts & Exercises
- Writing complex analytical queries without mutating raw tables.
- Running analytical SQL directly on local Parquet files using DuckDB.
- Computing customer retention cohorts and month-over-month growth rates in pure SQL.

### Coding Challenges
- **Easy**: SQL Window Function: Running Cumulative Total and Moving Average.
- **Medium**: SQL Cohort Retention Analysis CTE Query.
- **Hard**: DuckDB In-Memory Query Engine processing 10M rows from S3/Parquet.

### Mini Project
- **Level 6 Structured App**: **Enterprise Customer Churn & Cohort Retention Analytics Pipeline**
- DuckDB/PostgreSQL SQL pipeline computing multi-month cohort retention matrices, customer lifetime value (LTV), and churn indicators.

---

## Level 7: Applied Machine Learning for Data Science
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: Scikit-Learn pipelines, Regression modeling, Binary & Multiclass Classification, Clustering, Model interpretability (Permutation feature importance, Partial Dependence Plots), Evaluation metrics.

### Key Concepts & Exercises
- Structuring leak-free data modeling pipelines (`Pipeline`, `ColumnTransformer`).
- Calibrating model probabilities for risk modeling.
- Communicating model outputs to non-technical business stakeholders.

### Coding Challenges
- **Easy**: Scikit-Learn Pipeline combining Preprocessing and Ridge Regression.
- **Medium**: Calibrated Binary Classifier for Credit Risk Modeling.
- **Hard**: Model Feature Explainer with Partial Dependence & ICE Plots.

### Mini Project
- **Level 7 Real-World App**: **Predictive Real Estate Valuation & Investment Engine**
- Machine learning model predicting property values, extracting key price drivers, and generating investor property scorecards.

---

## Level 8: Advanced Analytics: NLP, Time Series & Recommender Systems
- **Difficulty**: Advanced
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: Time-series decomposition (Trend, Seasonality, Residuals), Forecasting (ARIMA, Prophet), Natural Language Processing (TF-IDF, Sentiment Analysis, VADER), Recommender Systems (Collaborative Filtering, Matrix Factorization).

### Key Concepts & Exercises
- Stationarity in time-series data: Differencing and ADF test.
- User-item interaction matrices and cosine collaborative filtering.
- Text feature extraction from user reviews for sentiment scoring.

### Coding Challenges
- **Easy**: Sentiment Analysis Pipeline on Product Customer Reviews.
- **Medium**: Time-Series Sales Forecaster with 7-Day Moving Average & Trend.
- **Hard**: Collaborative Filtering Recommender Engine using Matrix Factorization.

### Mini Project
- **Level 8 Real-World App**: **Personalized Media Content & Book Recommendation Engine**
- Hybrid recommendation system combining user review NLP sentiment with collaborative filtering to suggest books with high user affinity.

---

## Level 9: Data Products with Streamlit, FastAPI & Cloud
- **Difficulty**: Professional
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: Rapid data app development with Streamlit, Inference endpoints with FastAPI, Asynchronous data fetching, Data caching strategies, Packaging data applications with Docker.

### Key Concepts & Exercises
- Turning data scripts into interactive web applications for business teams.
- Structuring clean REST APIs for data predictions.
- Containerizing data apps for reproducible cloud deployment.

### Coding Challenges
- **Easy**: Interactive Streamlit Dashboard with File Uploader and Metric Cards.
- **Medium**: FastAPI Data Query Endpoint with Pydantic Schema Validation.
- **Hard**: Docker Containerized Streamlit + FastAPI Data Microservice.

### Mini Project
- **Level 9 Production Project**: **AI-Powered Financial Market Analytics & Prediction Product**
- Full data product: Streamlit interactive frontend communicating with a FastAPI backend, executing time-series forecasts, sentiment scoring, and historical trend analysis.

---

## Level 10: Production Data Science, Governance & Capstone
- **Difficulty**: Capstone / Professional
- **Estimated Completion Time**: 22 Hours
- **Skills Unlocked**: End-to-end data pipeline automation, Data versioning (DVC), Model monitoring & governance, Data ethics & bias detection (Fairlearn), Automated report generation, Executive communication.

### Key Concepts & Exercises
- Building production data pipelines that execute reliably without manual intervention.
- Auditing machine learning algorithms for disparate impact across demographic groups.
- Writing executive summaries and quantifiable business value reports.

### Level 10 Capstone Project
- **Production Capstone**: **End-to-End Enterprise Customer Intelligence & Churn Prevention Platform**
  - **Scope**: Enterprise-grade customer analytics platform integrating data ingestion, automated cleaning, predictive churn modeling, and an executive dashboard.
  - **Key Features**:
    - Automated ETL pipeline ingesting customer telemetry and billing data into DuckDB/PostgreSQL.
    - Predictive churn classification model with calibrated probability outputs and SHAP decision rationales.
    - Fairness audit report verifying zero demographic bias using Fairlearn metrics.
    - Interactive Streamlit executive portal allowing account managers to simulate retention intervention campaigns.
    - Fully containerized with Docker and version-controlled via DVC.
