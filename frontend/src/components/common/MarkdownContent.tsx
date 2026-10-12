import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(codeText);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={`markdown-content text-[13px] text-label-primary/90 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="text-base sm:text-lg font-bold text-label-primary tracking-tight mt-3 mb-2 pb-1 border-b border-separator/40 first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-sm sm:text-base font-bold text-label-primary tracking-tight mt-3 mb-1.5 first:mt-0">
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className="text-xs sm:text-sm font-bold text-label-primary tracking-tight mt-2 mb-1 first:mt-0">
              {children}
            </h5>
          ),
          h4: ({ children }) => (
            <h6 className="text-xs font-bold uppercase tracking-wider text-label-secondary mt-2 mb-1 first:mt-0">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="text-[13px] text-label-primary/90 leading-relaxed mb-2.5 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-label-primary">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-label-primary/80">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2.5 pl-4 list-disc marker:text-accent">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2.5 pl-5 list-decimal marker:text-accent marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[13px] text-label-primary/90 leading-relaxed pl-0.5">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent/70 pl-3 py-1 my-2 text-label-secondary italic bg-surface-secondary/40 rounded-r-lg">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-separator/60" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline font-semibold hover:opacity-80 transition inline-flex items-center gap-0.5"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-separator/60">
              <table className="min-w-full divide-y divide-separator/60 text-xs text-left">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-bold text-label-primary bg-surface-secondary/60">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-label-secondary border-t border-separator/30">
              {children}
            </td>
          ),
          pre: ({ children }) => {
            return (
              <div className="relative group my-2.5">
                <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-[12px] overflow-x-auto border border-slate-800 leading-relaxed">
                  {children}
                </pre>
              </div>
            );
          },
          code: ({ className, children, ...props }) => {
            const codeString = String(children).replace(/\n$/, '');
            const isMultiLine = codeString.includes('\n');
            const hasLanguage = Boolean(className && className.startsWith('language-'));

            if (!hasLanguage && !isMultiLine) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-surface-secondary text-accent font-mono text-[12px] border border-separator/50 font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => handleCopy(codeString)}
                  className="absolute right-2 top-2 z-10 px-2 py-1 rounded-md text-[11px] font-medium bg-white/10 hover:bg-white/20 text-slate-200 transition opacity-0 group-hover:opacity-100 flex items-center gap-1 cursor-pointer"
                  title="Copy Code"
                >
                  {copiedCode === codeString ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
