import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, setCode, languageId }) => {
  const getLanguage = (id) => {
    switch (id) {
      case 63: return 'javascript';
      case 62: return 'java';
      case 71: return 'python';
      default: return 'javascript';
    }
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <Editor
        height="100%"
        theme="vs-dark"
        language={getLanguage(languageId)}
        value={code}
        onChange={(value) => setCode(value || '')}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          fontFamily: "'Fira Code', 'Courier New', monospace",
        }}
      />
    </div>
  );
};

export default CodeEditor;
