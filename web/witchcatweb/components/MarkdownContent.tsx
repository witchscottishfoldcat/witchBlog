'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-4xl font-bold mb-4 mt-8 text-gray-900 dark:text-white" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-3xl font-bold mb-3 mt-6 text-gray-900 dark:text-white" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-2xl font-semibold mb-2 mt-4 text-gray-900 dark:text-white" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 text-gray-700 dark:text-gray-300 leading-7" {...props} />
          ),
          code: ({ node, className, ...props }: any) => {
            const isInline = !className;
            return isInline ? (
              <code
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm text-pink-600 dark:text-pink-400"
                {...props}
              />
            ) : (
              <code className={className} {...props} />
            );
          },
          pre: ({ node, ...props }) => (
            <pre
              className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto mb-4"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-pink-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 underline"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

