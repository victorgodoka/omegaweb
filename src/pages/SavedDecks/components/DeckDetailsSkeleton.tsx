const DeckDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-black to-zinc-900">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* Title */}
              <div className="h-9 bg-zinc-800/50 rounded-lg w-2/3 mb-3 animate-pulse" />

              {/* Creator Info */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800/50 animate-pulse" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-zinc-800/50 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-zinc-800/50 rounded w-24 animate-pulse" />
                </div>
              </div>

              {/* Date */}
              <div className="h-4 bg-zinc-800/50 rounded w-48 animate-pulse" />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-7 bg-zinc-800/50 rounded w-24 animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Export Section Skeleton */}
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-zinc-700/50 rounded animate-pulse" />
            <div className="h-6 bg-zinc-700/50 rounded w-32 animate-pulse" />
          </div>

          {/* Code Input */}
          <div className="mb-6">
            <div className="h-4 bg-zinc-700/50 rounded w-24 mb-2 animate-pulse" />
            <div className="h-12 bg-zinc-900/50 rounded-lg w-full animate-pulse" />
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-zinc-900/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Deck Display Skeleton */}
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-zinc-700/50 rounded animate-pulse" />
              <div className="h-6 bg-zinc-700/50 rounded w-24 animate-pulse" />
            </div>
            <div className="flex gap-1 bg-zinc-900/50 rounded-lg p-1">
              <div className="h-10 w-24 bg-zinc-700/50 rounded-md animate-pulse" />
              <div className="h-10 w-24 bg-zinc-700/50 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Main Deck Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 bg-zinc-700/50 rounded w-40 animate-pulse" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-150/219 bg-zinc-900/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Extra Deck Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 bg-zinc-700/50 rounded w-40 animate-pulse" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-150/219 bg-zinc-900/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Side Deck Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 bg-zinc-700/50 rounded w-40 animate-pulse" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-150/219 bg-zinc-900/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Archetypes */}
          <div className="mt-6 pt-6 border-t border-zinc-700/50">
            <div className="h-5 bg-zinc-700/50 rounded w-32 mb-3 animate-pulse" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-7 bg-zinc-900/50 rounded-full w-24 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Likes and Comments Skeleton */}
        <div className="mt-6">
          <div className="bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6">
            <div className="flex gap-4 mb-6">
              <div className="h-10 bg-zinc-700/50 rounded-lg w-32 animate-pulse" />
              <div className="h-10 bg-zinc-700/50 rounded-lg w-32 animate-pulse" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-700/50 animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-700/50 rounded w-32 mb-2 animate-pulse" />
                    <div className="h-16 bg-zinc-700/50 rounded animate-pulse" />
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

export default DeckDetailsSkeleton;
