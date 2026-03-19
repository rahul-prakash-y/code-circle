import React from 'react';
import { Terminal, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const Console = ({ result }) => {
  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 gap-2">
        <Terminal size={20} />
        <span>Run your code to see results here</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto custom-scrollbar font-mono text-sm leading-relaxed">
      <div className="flex items-center gap-2 mb-4">
        {result.status === 'Accepted' ? (
          <CheckCircle2 className="text-green-500" size={20} />
        ) : (
          <XCircle className="text-red-500" size={20} />
        )}
        <span className={`font-bold ${result.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
          {result.status}
        </span>
      </div>

      <div className="space-y-4">
        {result.results.map((res, index) => (
          <div key={index} className={`p-3 rounded border ${
            res.status === 'Accepted' ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Test Case #{index + 1}</span>
              <span className={res.status === 'Accepted' ? 'text-green-400' : 'text-red-400'}>{res.status}</span>
            </div>
            
            {res.stdout && (
              <div className="mt-2 text-gray-300">
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">STDOUT</div>
                <pre className="whitespace-pre-wrap">{res.stdout}</pre>
              </div>
            )}
            
            {res.stderr && (
              <div className="mt-2 text-red-300">
                <div className="text-[10px] text-red-500 uppercase font-bold mb-1">STDERR</div>
                <pre className="whitespace-pre-wrap">{res.stderr}</pre>
              </div>
            )}

            <div className="mt-2 flex gap-4 text-[11px] text-gray-500">
              <span>Time: {res.time}s</span>
              <span>Memory: {(res.memory / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Console;
