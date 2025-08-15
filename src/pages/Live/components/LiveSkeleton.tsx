import React from 'react';

const LiveSkeleton: React.FC = () => {
  return (
    <div className="mt-8 w-full h-full mx-auto p-4 space-y-4 relative xl:max-w-[1280px] xl:mx-auto animate-pulse">
      {/* Header Section Skeleton */}
      <div className="px-8 md:px-0">
        <div className="py-8 border-b border-gray-600/35 flex flex-col items-center justify-center space-y-4">
          {/* Tournament Title Skeleton */}
          <div className="h-10 bg-zinc-700 rounded-lg w-80"></div>
          
          {/* Date Skeleton */}
          <div className="h-5 bg-zinc-700 rounded w-64"></div>
          
          {/* Avatar Group Skeleton */}
          <div className="flex space-x-2 my-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-10 h-10 bg-zinc-700 rounded-full"></div>
            ))}
            <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-zinc-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        {/* Tab Headers Skeleton */}
        <div className="flex space-x-8 border-b border-gray-600/35">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 bg-zinc-700 rounded w-20 mb-4"></div>
          ))}
        </div>

        {/* Tab Content Skeleton */}
        <div className="space-y-6">
          {/* Tournament Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-800 rounded-lg p-4 space-y-3">
                <div className="h-5 bg-zinc-700 rounded w-3/4"></div>
                <div className="h-8 bg-zinc-700 rounded w-full"></div>
              </div>
            ))}
          </div>

          {/* Leaderboard Table Skeleton */}
          <div className="bg-zinc-800 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-zinc-700 p-4">
              <div className="grid grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-5 bg-zinc-600 rounded"></div>
                ))}
              </div>
            </div>
            
            {/* Table Rows */}
            {[...Array(8)].map((_, rowIndex) => (
              <div key={rowIndex} className="border-b border-zinc-700 p-4">
                <div className="grid grid-cols-6 gap-4 items-center">
                  {/* Rank */}
                  <div className="h-6 bg-zinc-700 rounded w-8"></div>
                  
                  {/* Player Avatar + Name */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-zinc-700 rounded-full"></div>
                    <div className="h-5 bg-zinc-700 rounded w-24"></div>
                  </div>
                  
                  {/* Stats */}
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-5 bg-zinc-700 rounded w-12"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Brackets Section Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-zinc-700 rounded w-32"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-zinc-700 rounded w-20"></div>
                    <div className="h-4 bg-zinc-700 rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-zinc-700 rounded-full"></div>
                      <div className="h-4 bg-zinc-700 rounded w-24"></div>
                      <div className="h-4 bg-zinc-700 rounded w-8"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-zinc-700 rounded-full"></div>
                      <div className="h-4 bg-zinc-700 rounded w-24"></div>
                      <div className="h-4 bg-zinc-700 rounded w-8"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decklists Section Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-zinc-700 rounded w-40"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-zinc-700 rounded w-20"></div>
                      <div className="h-3 bg-zinc-700 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, cardIndex) => (
                      <div key={cardIndex} className="flex items-center space-x-2">
                        <div className="w-8 h-12 bg-zinc-700 rounded"></div>
                        <div className="space-y-1 flex-1">
                          <div className="h-3 bg-zinc-700 rounded w-full"></div>
                          <div className="h-3 bg-zinc-700 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSkeleton;
