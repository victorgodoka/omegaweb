import React from 'react';

const ProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-zinc-900 text-zinc-100">
    <div className="h-98 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/20 to-pink-600/30"></div>

      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-20 right-20 w-16 h-16 bg-purple-400/20 rounded-full blur-lg animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
    </div>
    <div className="container mx-auto px-4 -mt-20 relative z-10">
      {/* Header Skeleton */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 mb-8 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar Skeleton */}
            <div className="w-24 h-24 bg-zinc-700 rounded-full animate-pulse"></div>

            <div className="flex-1 text-center md:text-left">
              {/* Name Skeleton */}
              <div className="h-8 bg-zinc-700 rounded animate-pulse mb-2 w-48 mx-auto md:mx-0"></div>
              <div className="h-6 bg-zinc-700 rounded animate-pulse mb-4 w-32 mx-auto md:mx-0"></div>

              {/* Stats Pills Skeleton */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                <div className="h-8 bg-zinc-700 rounded-full animate-pulse w-24"></div>
                <div className="h-8 bg-zinc-700 rounded-full animate-pulse w-16"></div>
                <div className="h-8 bg-zinc-700 rounded-full animate-pulse w-16"></div>
              </div>

              <div className="h-4 bg-zinc-700 rounded animate-pulse w-40 mx-auto md:mx-0"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[.75fr_1fr] gap-8 mb-8">
        {/* Left Column Skeleton */}
        <div className="space-y-8">
          {/* Performance Overview Skeleton */}
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
            <div className="h-6 bg-zinc-700 rounded animate-pulse mb-4 w-32"></div>
            <div className="h-4 bg-zinc-700 rounded animate-pulse mb-2"></div>
            <div className="h-8 bg-zinc-700 rounded animate-pulse"></div>
          </div>

          {/* Favorite Decks Skeleton */}
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
            <div className="h-6 bg-zinc-700 rounded animate-pulse mb-4 w-32"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-700/30 rounded border border-zinc-600/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-zinc-600 rounded animate-pulse"></div>
                    <div className="h-4 bg-zinc-600 rounded animate-pulse w-24"></div>
                  </div>
                  <div className="h-4 bg-zinc-600 rounded animate-pulse w-16"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Rival Decks Skeleton */}
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
            <div className="h-6 bg-zinc-700 rounded animate-pulse mb-4 w-32"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-700/30 rounded border border-zinc-600/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-zinc-600 rounded animate-pulse"></div>
                    <div className="h-4 bg-zinc-600 rounded animate-pulse w-24"></div>
                  </div>
                  <div className="h-4 bg-zinc-600 rounded animate-pulse w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Match History Skeleton */}
        <div>
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
            <div className="h-6 bg-zinc-700 rounded animate-pulse mb-4 w-32"></div>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="p-4 bg-zinc-700/30 rounded border border-zinc-600/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-zinc-600 rounded-full animate-pulse"></div>
                      <div className="h-4 bg-zinc-600 rounded animate-pulse w-24"></div>
                    </div>
                    <div className="h-6 bg-zinc-600 rounded animate-pulse w-16"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-zinc-600 rounded animate-pulse w-32"></div>
                    <div className="h-4 bg-zinc-600 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileSkeleton;
