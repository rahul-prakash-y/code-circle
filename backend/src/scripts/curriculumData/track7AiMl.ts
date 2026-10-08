import { ISeedTrackData } from './types';

export const track7AiMl: ISeedTrackData = {
  name: 'AI & Machine Learning: Foundations to MLOps',
  description:
    'Master mathematical foundations, NumPy vectorization, Scikit-Learn pipelines, PyTorch deep learning, and production MLOps serving.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  isLocked: false,
  levels: [
    {
      levelNumber: 1,
      title: 'Level 1: AI Taxonomy & NumPy Vectorization',
      youtubeVideoId: 'QUT1VHiLmmI',
      studyMaterials: [
        {
          title: 'NumPy Vectorization & SIMD Operations',
          type: 'notes',
          content: `# AI Foundations\n\n- Supervised vs Unsupervised vs Reinforcement Learning\n- NumPy ndarray: Contiguous memory storage and SIMD vectorization\n- Broadcasting rules: Trailing dimensions must be equal or 1.`,
        },
      ],
      questQuestions: [
        {
          question: 'Why are vectorized NumPy operations faster than standard Python for-loops?',
          options: ['They execute in compiled C using SIMD CPU instructions with contiguous memory', 'They run on GPU only', 'They use multiprocessing', 'They disable types'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 1: Vectorized Mean Normalizer',
        description: 'Read N numbers, subtract their mean from each element, and print the normalized numbers to 2 decimal places.',
        inputFormat: 'Line 1: N\\nLine 2: N numbers',
        outputFormat: 'Space-separated normalized numbers',
        constraints: '1 <= N <= 1000',
        sampleInput: '3\n10 20 30',
        sampleOutput: '-10.00 0.00 10.00',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        nums = [float(x) for x in lines[1:1+n]]\n        mean = sum(nums) / n\n        res = [f"{x - mean:.2f}" for x in nums]\n        print(" ".join(res))\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '3\n10 20 30', expectedOutput: '-10.00 0.00 10.00', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What type of machine learning uses labeled training datasets?',
          options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Heuristic Learning'],
          correctOptionIndex: 0,
          explanation: 'Supervised learning trains models on input-output pairs with known ground-truth labels.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: Applied Mathematics: Linear Algebra & Calculus',
      youtubeVideoId: '7ujgQnbvPao',
      studyMaterials: [
        {
          title: 'Gradients & Vector Dot Products',
          type: 'notes',
          content: `# Math for ML\n\n- Dot product: a . b = ||a|| ||b|| cos(theta)\n- Gradient vector points towards steepest ascent\n- Gradient Descent update: w = w - alpha * grad.`,
        },
      ],
      questQuestions: [
        {
          question: 'What does a learning rate (alpha) that is too high cause during gradient descent?',
          options: ['The loss oscillates and can diverge rather than converging to a minimum', 'Immediate convergence', 'Zero loss', 'Memory leak'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 2: Euclidean Distance & Cosine Similarity Evaluator',
        description: 'Read two 3D vectors. Compute and print their dot product integer.',
        inputFormat: 'Line 1: x1 y1 z1\\nLine 2: x2 y2 z2',
        outputFormat: 'Dot product integer',
        constraints: 'Integers between -1000 and 1000',
        sampleInput: '1 2 3\n4 5 6',
        sampleOutput: '32',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if len(lines) >= 6:\n        v1 = [int(x) for x in lines[0:3]]\n        v2 = [int(x) for x in lines[3:6]]\n        dot = sum(a * b for a, b in zip(v1, v2))\n        print(dot)\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '1 2 3\n4 5 6', expectedOutput: '32', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is an eigenvector of a square matrix A?',
          options: ['A non-zero vector whose direction does not change when transformed by A (Av = lambda * v)', 'A vector of zeros', 'An identity matrix', 'A row vector'],
          correctOptionIndex: 0,
          explanation: 'Eigenvectors only get scaled by a factor (eigenvalue lambda) when transformed by matrix A.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: Data Cleaning & Transformation Pipelines',
      youtubeVideoId: 'vmEHCJofslg',
      studyMaterials: [
        {
          title: 'Pandas & Data Leakage Prevention',
          type: 'notes',
          content: `# Data Cleaning\n\n- Imputation strategies: mean, median, mode\n- One-Hot Encoding for nominal variables\n- Preventing Data Leakage: fit scalers ONLY on train sets.`,
        },
      ],
      questQuestions: [
        {
          question: 'Why must feature scalers be fit only on the training set and not on the entire dataset?',
          options: ['To prevent data leakage from validation/test data into training models', 'To save memory', 'Required by Python', 'For faster calculation'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 3: Missing Value Median Imputer',
        description: 'Read numbers where -1 represents a missing value. Replace missing values with the median of non-missing values (rounded to integer).',
        inputFormat: 'Line 1: N\\nLine 2: N space-separated integers',
        outputFormat: 'Imputed array space-separated',
        constraints: 'At least one non-missing value',
        sampleInput: '5\n10 -1 30 -1 50',
        sampleOutput: '10 30 30 30 50',
        difficulty: 'Medium',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        arr = [int(x) for x in lines[1:1+n]]\n        valid = sorted([x for x in arr if x != -1])\n        mid = len(valid) // 2\n        med = valid[mid] if len(valid) % 2 == 1 else (valid[mid - 1] + valid[mid]) // 2\n        res = [str(x if x != -1 else med) for x in arr]\n        print(" ".join(res))\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '5\n10 -1 30 -1 50', expectedOutput: '10 30 30 30 50', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is StandardScaler formula in Scikit-Learn?',
          options: ['z = (x - u) / s (subtract mean, divide by standard deviation)', 'z = x / max', 'z = log(x)', 'z = x - min'],
          correctOptionIndex: 0,
          explanation: 'StandardScaler standardizes features by centering the mean to 0 and scaling variance to 1.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 4,
      title: 'Level 4: Exploratory Data Analysis & Feature Diagnostics',
      youtubeVideoId: 'a9UrKTVEeZA',
      studyMaterials: [
        {
          title: 'EDA, Seaborn & Outlier Detection',
          type: 'notes',
          content: `# Exploratory Data Analysis\n\n- Interquartile Range (IQR): IQR = Q3 - Q1; Outliers < Q1 - 1.5*IQR or > Q3 + 1.5*IQR\n- Correlation heatmaps: Pearson vs Spearman\n- Multicollinearity and VIF.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the standard multiplier for IQR when detecting statistical outliers using Tukey fences?',
          options: ['1.5', '2.0', '1.0', '3.0'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 4: Pearson Correlation Coefficient Evaluator',
        description: 'Read two arrays of N numbers. Compute Pearson correlation to 2 decimal places.',
        inputFormat: 'Line 1: N\\nLine 2: N numbers for X\\nLine 3: N numbers for Y',
        outputFormat: 'Correlation to 2 decimals',
        constraints: '3 <= N <= 100',
        sampleInput: '3\n1 2 3\n2 4 6',
        sampleOutput: '1.00',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\nimport math\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        x = [float(v) for v in lines[1:1+n]]\n        y = [float(v) for v in lines[1+n:1+2*n]]\n        mx, my = sum(x)/n, sum(y)/n\n        num = sum((a - mx)*(b - my) for a, b in zip(x, y))\n        den = math.sqrt(sum((a - mx)**2 for a in x) * sum((b - my)**2 for b in y))\n        print(f"{num/den:.2f}" if den != 0 else "0.00")\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '3\n1 2 3\n2 4 6', expectedOutput: '1.00', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What does a Pearson correlation coefficient of -1 indicate?',
          options: ['Perfect negative linear relationship', 'No correlation', 'Perfect positive correlation', 'Non-linear dependency'],
          correctOptionIndex: 0,
          explanation: '-1 indicates that as one variable increases, the other decreases in an exact linear relationship.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 5,
      title: 'Level 5: Supervised Learning: Regression & Ensembles',
      youtubeVideoId: 'Gv9_4yMHFhI',
      studyMaterials: [
        {
          title: 'Decision Trees & Regularization',
          type: 'notes',
          content: `# Supervised Learning\n\n- Linear Regression: Ordinary Least Squares vs Ridge (L2) vs Lasso (L1)\n- Logistic Regression for binary probabilities via sigmoid function\n- Random Forests: Bootstrap aggregation (Bagging) reduces variance.`,
        },
      ],
      questQuestions: [
        {
          question: 'What type of regularization does Lasso regression apply?',
          options: ['L1 penalty (sum of absolute weights), driving coefficients to zero for feature selection', 'L2 penalty', 'Dropout', 'Batch normalization'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 5: Logistic Sigmoid Activation Function',
        description: 'Read a float Z. Output sigmoid(Z) = 1 / (1 + exp(-Z)) rounded to 4 decimal places.',
        inputFormat: 'Single float Z',
        outputFormat: 'Sigmoid value to 4 decimals',
        constraints: '-100 <= Z <= 100',
        sampleInput: '0.0',
        sampleOutput: '0.5000',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\nimport math\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        z = float(lines[0])\n        sig = 1.0 / (1.0 + math.exp(-z))\n        print(f"{sig:.4f}")\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '0.0', expectedOutput: '0.5000', isHidden: false },
          { input: '2.0', expectedOutput: '0.8808', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the primary difference between Bagging and Boosting?',
          options: ['Bagging trains models independently in parallel; Boosting trains models sequentially to correct previous errors', 'Bagging uses neural networks', 'Boosting uses clustering', 'No difference'],
          correctOptionIndex: 0,
          explanation: 'Bagging reduces variance by averaging independent models; Boosting reduces bias by learning sequentially.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 6,
      title: 'Level 6: Unsupervised Learning & PCA',
      youtubeVideoId: 'IqyhnUj8kew',
      studyMaterials: [
        {
          title: 'K-Means & Principal Component Analysis',
          type: 'notes',
          content: `# Unsupervised Learning\n\n- K-Means: Minimizes within-cluster sum of squares (Inertia)\n- Silhouette Score evaluates cluster cohesion and separation\n- PCA projects data onto orthogonal axes of maximum variance.`,
        },
      ],
      questQuestions: [
        {
          question: 'What range does the Silhouette Score fall into?',
          options: ['-1 to +1', '0 to 100', '-Infinity to +Infinity', '0 to 1'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 6: 1D K-Means Centroid Assignment Simulator',
        description: 'Given two initial centroids C1 and C2, and N numbers, assign each number to the closer centroid and output counts [CountC1 CountC2].',
        inputFormat: 'Line 1: C1 C2 N\\nLine 2: N numbers',
        outputFormat: '<CountC1> <CountC2>',
        constraints: '1 <= N <= 1000',
        sampleInput: '10 50 4\n5 12 45 55',
        sampleOutput: '2 2',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        c1 = float(lines[0])\n        c2 = float(lines[1])\n        n = int(lines[2])\n        nums = [float(x) for x in lines[3:3+n]]\n        k1, k2 = 0, 0\n        for x in nums:\n            if abs(x - c1) <= abs(x - c2): k1 += 1\n            else: k2 += 1\n        print(f"{k1} {k2}")\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '10 50 4\n5 12 45 55', expectedOutput: '2 2', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the goal of Principal Component Analysis (PCA)?',
          options: ['Reduces dataset dimensionality while preserving the maximum possible variance', 'Classifies images', 'Imputes missing values', 'Trains decision trees'],
          correctOptionIndex: 0,
          explanation: 'PCA identifies the directions (principal components) along which the variation in the data is greatest.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 7,
      title: 'Level 7: Model Evaluation, Cross-Validation & SHAP',
      youtubeVideoId: '85dPEYr_KzY',
      studyMaterials: [
        {
          title: 'Evaluation Metrics & Explainable AI',
          type: 'notes',
          content: `# Evaluation & XAI\n\n- Precision = TP / (TP + FP), Recall = TP / (TP + FN), F1 = 2 * (P * R) / (P + R)\n- ROC-AUC measures discrimination threshold performance\n- SHAP (SHapley Additive exPlanations) values quantify individual feature contributions.`,
        },
      ],
      questQuestions: [
        {
          question: 'Which metric is most critical when evaluating a model for rare disease diagnosis where false negatives are dangerous?',
          options: ['Recall (Sensitivity)', 'Accuracy', 'Precision', 'Specificity'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 7: Binary Classification Confusion Matrix Metrics',
        description: 'Read TP, FP, FN, TN. Compute and print Precision and Recall to 2 decimal places.',
        inputFormat: 'TP FP FN TN',
        outputFormat: 'Precision=<P> Recall=<R>',
        constraints: 'Non-negative integers',
        sampleInput: '80 20 10 90',
        sampleOutput: 'Precision=0.80 Recall=0.89',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if len(lines) >= 4:\n        tp, fp, fn, tn = [float(x) for x in lines[0:4]]\n        prec = tp / (tp + fp) if (tp + fp) > 0 else 0\n        rec = tp / (tp + fn) if (tp + fn) > 0 else 0\n        print(f"Precision={prec:.2f} Recall={rec:.2f}")\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '80 20 10 90', expectedOutput: 'Precision=0.80 Recall=0.89', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the purpose of SHAP values in Explainable AI?',
          options: ['Fairly allocates the contribution of each feature to a specific prediction based on cooperative game theory', 'Normalizes weights', 'Runs gradient descent', 'Splits training sets'],
          correctOptionIndex: 0,
          explanation: 'SHAP calculates Shapley values from game theory to quantify the exact impact of each feature on a model output.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 8,
      title: 'Level 8: Deep Learning Foundations with PyTorch',
      youtubeVideoId: 'V_xro1bcAuA',
      studyMaterials: [
        {
          title: 'Neural Networks & PyTorch Tensors',
          type: 'notes',
          content: `# PyTorch Deep Learning\n\n- PyTorch Autograd: loss.backward() calculates gradients automatically\n- Activation functions: ReLU(x) = max(0, x), GELU\n- CNNs: Convolution kernels capture spatial patterns.`,
        },
      ],
      questQuestions: [
        {
          question: 'What does loss.backward() do in PyTorch?',
          options: ['Computes the gradient of the loss with respect to all model parameters using reverse-mode autodiff', 'Updates the weights', 'Zeroes the gradients', 'Saves the checkpoint'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 8: ReLU Activation & Layer Output Simulator',
        description: 'Read N numbers. Apply ReLU activation (max(0, x)) and print space-separated.',
        inputFormat: 'Line 1: N\\nLine 2: N numbers',
        outputFormat: 'Activated numbers',
        constraints: '1 <= N <= 1000',
        sampleInput: '4\n-5 0 3 -2',
        sampleOutput: '0 0 3 0',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        nums = [int(float(x)) for x in lines[1:1+n]]\n        res = [str(max(0, x)) for x in nums]\n        print(" ".join(res))\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '4\n-5 0 3 -2', expectedOutput: '0 0 3 0', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Why is optimizer.zero_grad() called before loss.backward() in a PyTorch training loop?',
          options: ['Because PyTorch accumulates gradients by default; calling zero_grad resets them before the new backward pass', 'Clears GPU RAM', 'Resets weights to zero', 'Loads batches'],
          correctOptionIndex: 0,
          explanation: 'Gradients accumulate across backward calls unless explicitly cleared with zero_grad().',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 9,
      title: 'Level 9: Transformers, NLP & RAG Systems',
      youtubeVideoId: 'bM4_2K36s60',
      studyMaterials: [
        {
          title: 'Attention Mechanism & Vector Databases',
          type: 'notes',
          content: `# Transformers & Modern AI\n\n- Self-Attention: Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V\n- Tokenization: Byte-Pair Encoding (BPE)\n- Retrieval-Augmented Generation (RAG): Dense embeddings + ChromaDB / Pinecone vector search.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the key advantage of the Self-Attention mechanism over recurrent networks (RNNs)?',
          options: ['Allows parallel processing across all tokens in a sequence rather than sequential step-by-step unrolling', 'Zero parameters', 'Disables matrix math', 'Runs on CPU only'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 9: Cosine Document Similarity Vector Ranker',
        description: 'Read a query vector and 2 document vectors (each 2D). Output "DOC_1" or "DOC_2" based on higher cosine similarity.',
        inputFormat: 'Query: Qx Qy\\nDoc1: D1x D1y\\nDoc2: D2x D2y',
        outputFormat: 'DOC_1 or DOC_2',
        constraints: 'Non-zero vectors',
        sampleInput: '1 0\n2 0\n0 5',
        sampleOutput: 'DOC_1',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\nimport math\n\ndef cos_sim(v1, v2):\n    dot = v1[0]*v2[0] + v1[1]*v2[1]\n    m1 = math.sqrt(v1[0]**2 + v1[1]**2)\n    m2 = math.sqrt(v2[0]**2 + v2[1]**2)\n    return dot / (m1 * m2) if (m1 * m2) != 0 else 0\n\ndef main():\n    lines = [float(x) for x in sys.stdin.read().split()]\n    if len(lines) >= 6:\n        q = lines[0:2]\n        d1 = lines[2:4]\n        d2 = lines[4:6]\n        if cos_sim(q, d1) >= cos_sim(q, d2): print('DOC_1')\n        else: print('DOC_2')\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '1 0\n2 0\n0 5', expectedOutput: 'DOC_1', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is Retrieval-Augmented Generation (RAG)?',
          options: ['A technique that retrieves relevant factual context from external knowledge databases to augment generative LLM prompts', 'Retraining from scratch', 'Compressing images', 'A translation model'],
          correctOptionIndex: 0,
          explanation: 'RAG retrieves authoritative source documents from vector databases to generate grounded, cited responses without retraining.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 10,
      title: 'Level 10: Production MLOps & Capstone Serving',
      youtubeVideoId: '0sOvCWFmrtA',
      studyMaterials: [
        {
          title: 'High-Performance Serving & Drift Monitoring',
          type: 'notes',
          content: `# Production MLOps\n\n- Model serialization via ONNX Runtime for <20ms inference latency\n- FastAPI asynchronous prediction endpoints\n- Data drift monitoring (KS-Test, PSI) using Evidently AI.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is Data Drift in a deployed machine learning system?',
          options: ['A statistical shift in the distribution of input features compared to training data, potentially degrading model accuracy', 'Hardware overheating', 'Database crash', 'Git merge conflict'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 10: High-Speed Batch Prediction Latency Benchmark',
        description: 'Read N inference runtimes in milliseconds. Output average latency to 1 decimal place.',
        inputFormat: 'Line 1: N\\nLine 2: N latencies',
        outputFormat: 'Avg latency: <X>ms',
        constraints: '1 <= N <= 1000',
        sampleInput: '3\n12.5 15.0 11.5',
        sampleOutput: 'Avg latency: 13.0ms',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        lats = [float(x) for x in lines[1:1+n]]\n        avg = sum(lats) / n\n        print(f"Avg latency: {avg:.1f}ms")\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '3\n12.5 15.0 11.5', expectedOutput: 'Avg latency: 13.0ms', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the primary benefit of converting PyTorch models to ONNX (Open Neural Network Exchange) format for deployment?',
          options: ['Enables cross-platform, highly-optimized hardware acceleration across multiple runtime engines with lower inference latencies', 'Deletes model weights', 'Requires no memory', 'Converts to HTML'],
          correctOptionIndex: 0,
          explanation: 'ONNX standardizes model graphs, allowing hardware-specific runtimes (like TensorRT or ONNX Runtime) to optimize inference.',
          points: 1,
        },
      ],
    },
  ],
};
