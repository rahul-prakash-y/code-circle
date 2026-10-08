import { ISeedTrackData } from './types';

export const track8AiDs: ISeedTrackData = {
  name: 'AI & Data Science: Analytics to Production Data Products',
  description:
    'Master the data science lifecycle, exploratory analytics, DuckDB in-process SQL, hypothesis testing, predictive modeling, and Streamlit data products.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
  isLocked: false,
  levels: [
    {
      levelNumber: 1,
      title: 'Level 1: The Data Science Lifecycle & Descriptive Stats',
      youtubeVideoId: 'X3paOmcrTjQ',
      studyMaterials: [
        {
          title: 'Data Science Lifecycle & Five-Number Summary',
          type: 'notes',
          content: `# Data Science Foundations\n\n- The CRISP-DM Process: Business Understanding -> Data Understanding -> Data Prep -> Modeling -> Evaluation -> Deployment\n- Five-Number Summary: Min, Q1, Median, Q3, Max\n- Variance and Standard Deviation.`,
        },
      ],
      questQuestions: [
        {
          question: 'What metric divides an ordered dataset into two equal halves?',
          options: ['Median', 'Mean', 'Mode', 'Variance'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 1: Five-Number Summary Range Calculator',
        description: 'Read N integers. Output the minimum and maximum values (Range span = Max - Min).',
        inputFormat: 'Line 1: N\\nLine 2: N integers',
        outputFormat: 'Range span integer',
        constraints: '1 <= N <= 10^5',
        sampleInput: '5\n12 45 7 89 23',
        sampleOutput: '82',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        nums = [int(x) for x in lines[1:1+n]]\n        print(max(nums) - min(nums))\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '5\n12 45 7 89 23', expectedOutput: '82', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the relationship between variance and standard deviation?',
          options: ['Standard deviation is the square root of variance', 'Variance is square root of std dev', 'They are identical', 'Variance is std dev / N'],
          correctOptionIndex: 0,
          explanation: 'Standard deviation is defined mathematically as the positive square root of the variance.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: Data Manipulation with Pandas & NumPy',
      youtubeVideoId: 'zyGfECfJ9BY',
      studyMaterials: [
        {
          title: 'Pandas DataFrames & Aggregations',
          type: 'notes',
          content: `# Pandas for Data Science\n\n- Series and DataFrames\n- Selection: loc (label-based) vs iloc (integer position-based)\n- GroupBy operations: Split-Apply-Combine strategy.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the difference between loc and iloc in Pandas?',
          options: ['loc selects by index/column labels; iloc selects by integer row/column positions', 'No difference', 'iloc is for strings only', 'loc is deprecated'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 2: DataFrame GroupBy Category Sum Simulator',
        description: 'Read N records of (Category, Amount). Output category with lowest total sum.',
        inputFormat: 'Line 1: N\\nNext N lines: Category Amount',
        outputFormat: 'Lowest category name',
        constraints: '1 <= N <= 1000',
        sampleInput: '3\nHardware 1500\nSoftware 300\nHardware 500',
        sampleOutput: 'Software',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        totals = {}\n        idx = 1\n        for _ in range(n):\n            cat = lines[idx]\n            amt = float(lines[idx+1])\n            totals[cat] = totals.get(cat, 0.0) + amt\n            idx += 2\n        lowest = min(totals.items(), key=lambda x: x[1])[0]\n        print(lowest)\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '3\nHardware 1500\nSoftware 300\nHardware 500', expectedOutput: 'Software', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Which method reshapes a wide DataFrame into a tidy long format?',
          options: ['pd.melt()', 'pd.pivot()', 'pd.concat()', 'pd.merge()'],
          correctOptionIndex: 0,
          explanation: 'melt unpivots a DataFrame from wide format to long format.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: Inferential Statistics & Hypothesis Testing',
      youtubeVideoId: 'xxpc-HPKN28',
      studyMaterials: [
        {
          title: 'A/B Testing & p-Values',
          type: 'notes',
          content: `# Statistics & Probability\n\n- Null Hypothesis (H0) vs Alternative Hypothesis (H1)\n- p-value: Probability of observing data at least as extreme under H0\n- Significance level (alpha = 0.05).`,
        },
      ],
      questQuestions: [
        {
          question: 'If a calculated p-value is 0.02 and alpha is 0.05, what is the statistical conclusion?',
          options: ['Reject the null hypothesis (statistically significant difference)', 'Fail to reject null', 'Accept null as true', 'Inconclusive test'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 3: Two-Sample Conversion Rate Difference Evaluator',
        description: 'Read VisitorsA, ConversionsA, VisitorsB, ConversionsB. Print percentage difference in conversion rate (RateB - RateA) rounded to 2 decimal places.',
        inputFormat: 'VA CA VB CB',
        outputFormat: 'Difference percentage (e.g. 2.50%)',
        constraints: 'Visitors >= 1',
        sampleInput: '1000 50 1000 75',
        sampleOutput: '2.50%',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if len(lines) >= 4:\n        va, ca, vb, cb = [float(x) for x in lines[0:4]]\n        ra = (ca / va) * 100\n        rb = (cb / vb) * 100\n        diff = rb - ra\n        print(f"{diff:.2f}%")\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '1000 50 1000 75', expectedOutput: '2.50%', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is a Type I error in statistical hypothesis testing?',
          options: ['False Positive (rejecting a true null hypothesis)', 'False Negative', 'Calculation error', 'Measurement error'],
          correctOptionIndex: 0,
          explanation: 'A Type I error occurs when researchers reject the null hypothesis even though it is actually true.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 4,
      title: 'Level 4: Advanced Data Cleaning & Imputation',
      youtubeVideoId: 'bDhvCp3_lYw',
      studyMaterials: [
        {
          title: 'Missing Mechanisms & Winsorization',
          type: 'notes',
          content: `# Data Cleaning\n\n- Missing mechanisms: MCAR (Missing Completely at Random), MAR, MNAR\n- Winsorization: Clamping extreme values at 5th and 95th percentiles\n- Cyclical feature encoding for timestamps (sine/cosine transformations).`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the purpose of cyclical sine/cosine feature encoding for hour of day (0-23)?',
          options: ['Preserves cyclical continuity so hour 23 is mathematically close to hour 0', 'Compresses values', 'Scales to 0-1', 'Prevents negative numbers'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 4: Percentile Clamping Outlier Trimmer',
        description: 'Read N numbers, lower bound L, and upper bound U. Output values clamped between L and U.',
        inputFormat: 'Line 1: N L U\\nLine 2: N numbers',
        outputFormat: 'Clamped numbers space-separated',
        constraints: '1 <= N <= 1000',
        sampleInput: '4 10 50\n5 25 60 10',
        sampleOutput: '10 25 50 10',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        low = float(lines[1])\n        high = float(lines[2])\n        nums = [float(x) for x in lines[3:3+n]]\n        res = [str(int(min(high, max(low, x)))) for x in nums]\n        print(" ".join(res))\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '4 10 50\n5 25 60 10', expectedOutput: '10 25 50 10', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is Target Encoding in categorical feature processing?',
          options: ['Replacing categorical values with the mean value of the target label for that category', 'One-hot encoding', 'Label encoding', 'Frequency encoding'],
          correctOptionIndex: 0,
          explanation: 'Target encoding maps categorical values to the posterior probability or mean of the target variable.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 5,
      title: 'Level 5: Visual Storytelling & Interactive Plotly Charts',
      youtubeVideoId: 'GGL6U0k8WYA',
      studyMaterials: [
        {
          title: 'Visual Storytelling & Plotly Dashboards',
          type: 'notes',
          content: `# Data Visualization\n\n- Choosing chart types: scatter for correlations, boxplot for distributions, bar for categorical counts\n- Interactive Plotly figures with hover data\n- Colorblind-safe palettes.`,
        },
      ],
      questQuestions: [
        {
          question: 'Which chart type is optimal for visualizing the distribution and quartiles across multiple groups?',
          options: ['Box Plot / Violin Plot', 'Pie Chart', 'Line Chart', 'Radar Chart'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 5: Histogram Bin Frequency Counter',
        description: 'Read N values and a bin width W. Output count of values falling into [0, W) and [W, 2W).',
        inputFormat: 'Line 1: N W\\nLine 2: N values',
        outputFormat: '<CountBin1> <CountBin2>',
        constraints: 'Values in [0, 2W)',
        sampleInput: '4 10\n3 8 12 18',
        sampleOutput: '2 2',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        w = float(lines[1])\n        nums = [float(x) for x in lines[2:2+n]]\n        b1 = sum(1 for x in nums if 0 <= x < w)\n        b2 = sum(1 for x in nums if w <= x < 2 * w)\n        print(f"{b1} {b2}")\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '4 10\n3 8 12 18', expectedOutput: '2 2', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the primary visual flaw of 3D pie charts in analytical presentations?',
          options: ['Perspective distortion misrepresents slice proportions and impairs accurate area comparison', 'Takes too much screen space', 'Hard to print', 'Slow to render'],
          correctOptionIndex: 0,
          explanation: '3D angle distortions exaggerate the visual area of foreground slices, misleading viewers.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 6,
      title: 'Level 6: SQL Window Functions & DuckDB Analytics',
      youtubeVideoId: 'HXV3zeRRhuQ',
      studyMaterials: [
        {
          title: 'Advanced SQL & DuckDB',
          type: 'notes',
          content: `# SQL for Data Engineering\n\n- Window Functions: ROW_NUMBER(), RANK(), LEAD(), LAG()\n- Common Table Expressions (CTEs) for readable multi-step queries\n- DuckDB: In-process analytical OLAP database reading Parquet directly.`,
        },
      ],
      questQuestions: [
        {
          question: 'What does the LAG() window function do in SQL?',
          options: ['Accesses data from a previous row in the partition without a self-join', 'Delays query execution', 'Filters nulls', 'Ranks rows'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 6: SQL Moving Average Window Simulation',
        description: 'Read N daily sales numbers. Compute a 3-day moving average starting from day 3 rounded to 1 decimal place.',
        inputFormat: 'Line 1: N\\nLine 2: N numbers',
        outputFormat: 'Moving averages space-separated',
        constraints: '3 <= N <= 1000',
        sampleInput: '4\n10 20 30 40',
        sampleOutput: '20.0 30.0',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        nums = [float(x) for x in lines[1:1+n]]\n        res = []\n        for i in range(2, n):\n            avg = (nums[i-2] + nums[i-1] + nums[i]) / 3.0\n            res.append(f"{avg:.1f}")\n        print(" ".join(res))\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '4\n10 20 30 40', expectedOutput: '20.0 30.0', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What differentiates DuckDB from traditional SQLite?',
          options: ['DuckDB is a columnar OLAP execution engine optimized for large analytical vector queries on Parquet files', 'SQLite is faster on big data', 'DuckDB does not support SQL', 'DuckDB runs in browser only'],
          correctOptionIndex: 0,
          explanation: 'DuckDB is designed for fast analytical queries (OLAP) using a columnar vectorized execution engine.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 7,
      title: 'Level 7: Predictive Modeling for Business Decisions',
      youtubeVideoId: 'i_LwzRVP7bg',
      studyMaterials: [
        {
          title: 'Scikit-Learn Pipelines & Business Value',
          type: 'notes',
          content: `# Predictive Data Science\n\n- Scikit-Learn Pipeline: Bundles imputation, scaling, and estimator\n- Calibration curves for reliable probabilities\n- Cost-benefit threshold tuning.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the purpose of bundling preprocessing and models inside a Scikit-Learn Pipeline?',
          options: ['Prevents data leakage during cross-validation by ensuring transformations apply cleanly to folds', 'Compresses models', 'Speeds up CPU', 'Generates charts'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 7: Expected Monetary Value Decision Evaluator',
        description: 'Read ProbabilityOfDefault P, LoanAmount A, and RecoveryRate R. Calculate expected loss = P * A * (1 - R).',
        inputFormat: 'P A R',
        outputFormat: 'Expected loss rounded to 2 decimals',
        constraints: '0 <= P, R <= 1, A >= 0',
        sampleInput: '0.10 50000 0.20',
        sampleOutput: '4000.00',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if len(lines) >= 3:\n        p, a, r = [float(x) for x in lines[0:3]]\n        loss = p * a * (1.0 - r)\n        print(f"{loss:.2f}")\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '0.10 50000 0.20', expectedOutput: '4000.00', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is probability calibration in binary classification?',
          options: ['Adjusting model output scores so they accurately reflect true empirical risk probabilities', 'Normalizing feature columns', 'Threshold tuning', 'Imputing missing values'],
          correctOptionIndex: 0,
          explanation: 'Calibrated models output probabilities where a prediction of 0.8 actually occurs 80% of the time.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 8,
      title: 'Level 8: Time Series Forecasting & Recommender Engines',
      youtubeVideoId: 'e8Yw4alG16Q',
      studyMaterials: [
        {
          title: 'Time Series Decomposition & Collaborative Filtering',
          type: 'notes',
          content: `# Advanced Analytics\n\n- Time series components: Trend, Seasonality, Residuals\n- Stationarity testing with Augmented Dickey-Fuller (ADF)\n- User-Item matrix factorization for recommendations.`,
        },
      ],
      questQuestions: [
        {
          question: 'What does a time series being "stationary" mean?',
          options: ['Its statistical properties (mean, variance, autocorrelation) do not change over time', 'It has zero values', 'It has no noise', 'It increases monotonically'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 8: Collaborative Filtering Cosine Affinity Evaluator',
        description: 'Read ratings of 2 users for 3 items. Compute cosine similarity between both users to 2 decimal places.',
        inputFormat: 'Line 1: u1 u2 u3\\nLine 2: v1 v2 v3',
        outputFormat: 'Similarity to 2 decimals',
        constraints: 'Rating values >= 0',
        sampleInput: '5 3 0\n4 2 1',
        sampleOutput: '0.94',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\nimport math\n\ndef main():\n    lines = [float(x) for x in sys.stdin.read().split()]\n    if len(lines) >= 6:\n        u = lines[0:3]\n        v = lines[3:6]\n        dot = sum(a*b for a, b in zip(u, v))\n        m1 = math.sqrt(sum(a*a for a in u))\n        m2 = math.sqrt(sum(b*b for b in v))\n        sim = dot / (m1 * m2) if (m1 * m2) != 0 else 0\n        print(f"{sim:.2f}")\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '5 3 0\n4 2 1', expectedOutput: '0.94', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the "Cold Start" problem in recommender systems?',
          options: ['Difficulty generating accurate recommendations for new users or items with zero historical interaction data', 'Server booting latency', 'Database cache misses', 'Network timeouts'],
          correctOptionIndex: 0,
          explanation: 'New users or items lack rating history, making collaborative filtering predictions difficult.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 9,
      title: 'Level 9: Building Interactive Data Products with Streamlit',
      youtubeVideoId: 'D0D4Pa22iG0',
      studyMaterials: [
        {
          title: 'Streamlit & FastAPI Data Products',
          type: 'notes',
          content: `# Data Products\n\n- Streamlit: Reactive web applications with Python widgets (st.slider, st.plotly_chart)\n- FastAPI endpoints for predictions and data queries\n- Caching dataframes with @st.cache_data.`,
        },
      ],
      questQuestions: [
        {
          question: 'What decorator does Streamlit provide to cache expensive computation or DataFrame loads?',
          options: ['@st.cache_data', '@st.memoize', '@st.keep', '@st.persist'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 9: Streamlit Slider Filter Threshold Simulator',
        description: 'Read threshold T and N values. Print count of values >= T.',
        inputFormat: 'Line 1: T N\\nLine 2: N numbers',
        outputFormat: 'Count integer',
        constraints: '1 <= N <= 1000',
        sampleInput: '50 4\n30 50 75 20',
        sampleOutput: '2',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        t = float(lines[0])\n        n = int(lines[1])\n        nums = [float(x) for x in lines[2:2+n]]\n        print(sum(1 for x in nums if x >= t))\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '50 4\n30 50 75 20', expectedOutput: '2', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the key architecture difference between Streamlit and Flask/FastAPI?',
          options: ['Streamlit re-executes the Python script from top to bottom on user interaction while caching state; FastAPI is a request-response REST server', 'Streamlit only works on mobile', 'FastAPI has no routes', 'Streamlit compiles to C'],
          correctOptionIndex: 0,
          explanation: 'Streamlit uses a reactive script execution model on widget state changes, whereas FastAPI operates as a standard HTTP server.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 10,
      title: 'Level 10: Production Data Science, Governance & Capstone',
      youtubeVideoId: 'N32r92oEeqE',
      studyMaterials: [
        {
          title: 'Data Governance, DVC & Fairlearn',
          type: 'notes',
          content: `# Production Data Science\n\n- Data Version Control (DVC) for reproducible datasets\n- Fairness & Bias auditing with Fairlearn (Disparate Impact ratio)\n- Executive communication and ROI calculation.`,
        },
      ],
      questQuestions: [
        {
          question: 'What does the Disparate Impact ratio evaluate in Algorithmic Fairness?',
          options: ['The ratio of selection rate for a protected demographic group compared to the unprivileged group (must be >= 0.80 by four-fifths rule)', 'GPU speed', 'Memory leakage', 'Model training loss'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 10: Disparate Impact Fairness Four-Fifths Evaluator',
        description: 'Read SelectionRateProtected and SelectionRateUnprivileged. Output "FAIR" if Protected/Unprivileged >= 0.80, else "BIASED".',
        inputFormat: 'RateP RateU',
        outputFormat: 'FAIR or BIASED',
        constraints: 'Both rates > 0',
        sampleInput: '0.85 0.90',
        sampleOutput: 'FAIR',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if len(lines) >= 2:\n        rp, ru = [float(x) for x in lines[0:2]]\n        ratio = rp / ru if ru != 0 else 0\n        print("FAIR" if ratio >= 0.80 else "BIASED")\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '0.85 0.90', expectedOutput: 'FAIR', isHidden: false },
          { input: '0.50 0.90', expectedOutput: 'BIASED', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is Data Version Control (DVC) primarily used for in MLOps?',
          options: ['Versioning large datasets and machine learning model files in Git repositories using external cloud storage pointers', 'Writing SQL queries', 'Building CSS styles', 'Deploying containers'],
          correctOptionIndex: 0,
          explanation: 'DVC manages large data and model files via metadata pointers tracked in Git, ensuring versioned reproducibility.',
          points: 1,
        },
      ],
    },
  ],
};
