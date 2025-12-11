import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { useAppStore } from '../store/useAppStore';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const { ideas, setActiveIdea } = useAppStore();

  // Pre-process content to convert [[Title]] to [Title](idea://Title)
  const processedContent = content.replace(/\[\[(.*?)\]\]/g, (match, title) => {
    return `[${title}](idea://${title})`; 
  });

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        urlTransform={(url) => {
          if (url.startsWith('idea://')) return url;
          // Default behavior for other URLs
          return url;
        }}
        components={{
          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
          a: ({node, href, children, ...props}) => {
            const isIdeaLink = href?.startsWith('idea://');
            if (isIdeaLink) {
              const title = href?.replace('idea://', '');
              return (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const decodedTitle = decodeURIComponent(title || '');
                    console.log(`引用跳转: ${decodedTitle}`);
                    
                    // Find the idea by title (case-insensitive)
                    const targetIdea = ideas.find(i => i.title.toLowerCase() === decodedTitle.toLowerCase());
                    
                    if (targetIdea) {
                      setActiveIdea(targetIdea);
                    } else {
                      alert(`未找到灵感: "${decodedTitle}"`);
                    }
                  }}
                  className="text-blue-600 bg-blue-50 px-1 rounded hover:bg-blue-100 transition-colors cursor-pointer font-medium"
                  title={`跳转到: ${decodeURIComponent(title || '')}`}
                >
                  {children}
                </span>
              );
            }
            return <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
