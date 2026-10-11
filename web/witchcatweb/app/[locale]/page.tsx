import { getAllPosts } from '@/lib/posts';
import { getTranslations } from 'next-intl/server';
import Hero from '@/components/Hero';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Load translations with error handling
  let wordsLabel = locale === 'zh' ? '字' : 'words';
  try {
    const t = await getTranslations('common');
    wordsLabel = t('words');
  } catch (error) {
    console.error('Translation error:', error);
  }
  
  // Load posts with error handling
  let posts: ReturnType<typeof getAllPosts> = [];
  try {
    posts = getAllPosts();
  } catch (error) {
    console.error('Posts loading error:', error);
    posts = [];
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Hero />

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Sidebar />
        </div>

        {/* Posts List */}
        <div className="lg:col-span-3 space-y-6">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-gray-500 dark:text-gray-400">
                No posts yet. Add some markdown files in content/posts/
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard 
                key={post.slug} 
                post={post} 
                locale={locale} 
                wordsLabel={wordsLabel}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
