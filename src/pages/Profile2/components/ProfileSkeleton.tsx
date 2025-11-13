import React from 'react';

const ProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 animate-pulse">
      {/* Banner Skeleton */}
      <div className="relative h-64 md:h-80 lg:h-96 bg-zinc-800 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-zinc-800 to-zinc-900"></div>
        
        {/* Profile Header Skeleton */}
        <div className="relative h-full flex items-end pb-6 md:pb-8">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 md:gap-6">
              {/* Avatar Skeleton */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-zinc-700"></div>
                {/* Badge Skeleton */}
                <div className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-700"></div>
                </div>
              </div>

              {/* Profile Info Skeleton */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="h-8 md:h-10 bg-zinc-700 rounded w-48 mx-auto sm:mx-0"></div>
                <div className="h-6 bg-zinc-700 rounded w-32 mx-auto sm:mx-0"></div>
                <div className="h-4 bg-zinc-700 rounded w-40 mx-auto sm:mx-0"></div>
                {/* Social Links Skeleton */}
                <div className="flex gap-3 justify-center sm:justify-start">
                  <div className="w-6 h-6 bg-zinc-700 rounded"></div>
                  <div className="w-6 h-6 bg-zinc-700 rounded"></div>
                  <div className="w-6 h-6 bg-zinc-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Game Mode Toggle Skeleton */}
        <div className="flex justify-center mb-6">
          <div className="h-10 w-40 bg-zinc-800 rounded-lg"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Bio Card Skeleton */}
          <div className="lg:col-span-2 bg-zinc-800/60 rounded-xl border border-zinc-700/50 p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-zinc-700 rounded w-24"></div>
                <div className="h-4 bg-zinc-700 rounded w-full"></div>
                <div className="h-4 bg-zinc-700 rounded w-5/6"></div>
                <div className="h-4 bg-zinc-700 rounded w-4/6"></div>
              </div>
              {/* Favorite Card Skeleton */}
              <div className="flex flex-col items-center">
                <div className="h-4 bg-zinc-700 rounded w-24 mb-2"></div>
                <div className="w-32 h-44 bg-zinc-700 rounded-lg"></div>
              </div>
            </div>
          </div>

          {/* Performance Stats Skeleton */}
          <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/50 p-6">
            <div className="h-6 bg-zinc-700 rounded w-32 mb-4"></div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-zinc-700 rounded w-16"></div>
                <div className="h-8 bg-zinc-700 rounded w-20"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-zinc-700 rounded w-16"></div>
                <div className="h-6 bg-zinc-700 rounded w-24"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-zinc-700 rounded w-20"></div>
                <div className="h-6 bg-zinc-700 rounded w-16"></div>
              </div>
              <div className="pt-4 border-t border-zinc-700">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center space-y-2">
                    <div className="h-8 bg-zinc-700 rounded w-12 mx-auto"></div>
                    <div className="h-3 bg-zinc-700 rounded w-10 mx-auto"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-8 bg-zinc-700 rounded w-12 mx-auto"></div>
                    <div className="h-3 bg-zinc-700 rounded w-10 mx-auto"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-8 bg-zinc-700 rounded w-12 mx-auto"></div>
                    <div className="h-3 bg-zinc-700 rounded w-10 mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decks & Opponents Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Decks Skeleton */}
          <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/50 p-6">
            <div className="h-6 bg-zinc-700 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/30">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-5 bg-zinc-700 rounded w-32"></div>
                    <div className="h-5 bg-zinc-700 rounded w-16"></div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-zinc-700 rounded w-20"></div>
                    <div className="h-4 bg-zinc-700 rounded w-12"></div>
                  </div>
                  <div className="w-full h-2 bg-zinc-700 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Opponents Skeleton */}
          <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/50 p-6">
            <div className="h-6 bg-zinc-700 rounded w-40 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/30">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-5 bg-zinc-700 rounded w-32"></div>
                    <div className="h-5 bg-zinc-700 rounded w-16"></div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-zinc-700 rounded w-20"></div>
                    <div className="h-4 bg-zinc-700 rounded w-12"></div>
                  </div>
                  <div className="w-full h-2 bg-zinc-700 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Match History Skeleton */}
        <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/50 p-6">
          <div className="h-6 bg-zinc-700 rounded w-40 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-zinc-700/30 bg-zinc-900/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 bg-zinc-700 rounded w-16"></div>
                      <div className="h-4 bg-zinc-700 rounded w-12"></div>
                    </div>
                    <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                  </div>
                  <div className="h-4 bg-zinc-700 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Skeleton */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <div className="h-10 w-10 bg-zinc-700 rounded-lg"></div>
            <div className="h-6 bg-zinc-700 rounded w-32"></div>
            <div className="h-10 w-10 bg-zinc-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
