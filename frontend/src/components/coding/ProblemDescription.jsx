import React from 'react';

const ProblemDescription = ({ problem }) => {
  return (
    <div className="p-6 prose prose-invert max-w-none">
      <h2 className="text-xl font-bold text-white mb-4">Description</h2>
      <div className="text-gray-300 leading-relaxed space-y-4">
        {problem.description.split('\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Example Test Cases</h3>
        {problem.testCases.map((tc, index) => (
          <div key={index} className="bg-white/5 rounded-lg p-4 mb-4 border border-white/5">
            <div className="mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Input</span>
              <pre className="bg-black/30 p-2 rounded mt-1 text-sm text-primary-light font-mono whitespace-pre-wrap">
                {tc.input}
              </pre>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expected Output</span>
              <pre className="bg-black/30 p-2 rounded mt-1 text-sm text-green-400 font-mono whitespace-pre-wrap">
                {tc.expectedOutput}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProblemDescription;
