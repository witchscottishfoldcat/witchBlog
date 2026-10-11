import Link from 'next/link';
import { Calendar, FileText, ArrowRight } from 'lucide-react';
import { BlogPost } from '@/types';
import { formatDate } from '@/lib/utils';

interface PostCardProps {
  post: BlogPost;
  locale: string;
  wordsLabel: string;
}

export default function PostCard({ post, locale, wordsLabel }: PostCardProps) {

  return (
    <Link href={`/${locale}/posts/${post.slug}`}>
      <article className="group relative flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gradient-to-b from-pink-400 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100"></div>

        {/* Content */}
        <div className="flex-1">
          <h2 className="mb-3 text-xl font-semibold text-gray-900 transition-colors group-hover:text-pink-500 dark:text-gray-100 dark:group-hover:text-pink-400">
            {post.title}
          </h2>
          
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {post.description}
          </p>

          {/* Meta info */}
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.date, locale)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {post.wordCount} {wordsLabel}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow icon */}
        <div className="flex-shrink-0">
          <ArrowRight className="h-6 w-6 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-pink-500 dark:text-gray-600 dark:group-hover:text-pink-400" />
        </div>
      </article>
    </Link>
  );
}
