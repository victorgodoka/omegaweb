import { useState, useEffect } from 'react';
import { api } from '@/utils/Api';
import type { DiscourseLatestPostsAPI, DiscourseCategoryAPI, LatestPost, Category } from './types';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<LatestPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both APIs in parallel
        const [postsResponse, categoriesResponse] = await Promise.all([
          api.external.forum.getPosts(),
          api.external.forum.getCategories()
        ]);

        if (!postsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to fetch data from Discourse API');
        }

        const postsData: DiscourseLatestPostsAPI = postsResponse.data;
        const categoriesData: DiscourseCategoryAPI = categoriesResponse.data;

        setPosts(postsData.latest_posts);
        setCategories(categoriesData.category_list.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryById = (categoryId: number): Category | undefined => {
    return categories.find(cat =>
      cat.id === categoryId || cat.subcategory_ids.includes(categoryId)
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    // Choose locale from current i18n language
    const locale = i18n.language?.startsWith('pt') ? 'pt-BR' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvatarUrl = (avatarTemplate: string, size: number = 45): string => {
    return `https://forum.duelistsunite.org${avatarTemplate.replace('{size}', size.toString())}`;
  };

  const SkeletonCard = () => (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
      {/* Title skeleton */}
      <div className="h-6 bg-zinc-700 rounded mb-3 animate-pulse"></div>
      <div className="h-6 bg-zinc-700 rounded w-3/4 mb-4 animate-pulse"></div>

      {/* Author skeleton */}
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-zinc-700 rounded-full mr-3 animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-zinc-700 rounded w-1/2 mb-1 animate-pulse"></div>
          <div className="h-3 bg-zinc-700 rounded w-1/3 animate-pulse"></div>
        </div>
      </div>

      {/* Category skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-zinc-700 rounded-full w-20 animate-pulse"></div>
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
        <div className="h-3 bg-zinc-700 rounded w-24 animate-pulse"></div>
        <div className="flex items-center space-x-3">
          <div className="h-3 bg-zinc-700 rounded w-8 animate-pulse"></div>
          <div className="h-3 bg-zinc-700 rounded w-8 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 mt-12">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-300 mb-2">{t('home.title')}</h1>
            <p className="text-zinc-400">{t('home.subtitle')}</p>
          </div>

          {/* Skeleton Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center mt-12">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {t('home.error_title')}</div>
          <p className="text-zinc-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 mt-12">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-300 mb-2">{t('home.title')}</h1>
          <p className="text-zinc-400">{t('home.subtitle')}</p>
        </div>

        {/* Posts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const category = getCategoryById(post.category_id);
            return (
              <a
                href={`https://forum.duelistsunite.org${post.post_url}`}
                target="_blank"
                rel="noopener noreferrer"
                key={post.id}
                className="bg-zinc-800 cursor-pointer rounded-lg border border-zinc-700 p-6 hover:border-blue-400 transition-colors duration-200 flex flex-col"
              >
                {/* Post Title */}
                <h3 className="text-lg font-semibold text-zinc-100 mb-3 line-clamp-2">
                  {post.topic_title}
                </h3>

                {/* Category Badge */}
                {category && (
                  <div className="mb-4">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `#${category.color}20`,
                        color: `#${category.color}`,
                        border: `1px solid #${category.color}40`
                      }}
                    >
                      {category.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-400 mb-4">
                  <span>{formatDate(post.created_at)}</span>
                </div>

                {/* Footer - Always at bottom */}
                <div className="mt-auto flex flex-wrap items-center justify-between pt-4 border-t border-zinc-700">

                  {/* Author Info */}
                  <div className="w-full flex items-center mb-4">
                    <img
                      src={getAvatarUrl(post.avatar_template)}
                      alt={t('home.alt_avatar', { username: post.username })}
                      className="w-10 h-10 rounded-full mr-3 border-2 border-zinc-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {post.name || post.username}
                      </p>
                      <p className="text-xs text-zinc-400">@{post.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-zinc-400">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      {t('home.comments', { count: post.reply_count })}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      {t('home.views', { count: post.reads })}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-zinc-400 text-lg mb-2">{t('home.empty_title')}</div>
            <p className="text-zinc-500">{t('home.empty_subtitle')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;