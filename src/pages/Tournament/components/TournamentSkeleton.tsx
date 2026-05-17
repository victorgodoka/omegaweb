const TournamentSkeleton = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="h-8 bg-zinc-800 rounded-md w-64"></div>
              <div className="h-5 bg-zinc-800/70 rounded-md w-48"></div>
            </div>

            {/* Players Skeleton */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="h-4 bg-zinc-800/70 rounded-md w-24"></div>
              <div className="flex -space-x-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2">
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-zinc-800 rounded-md w-32"></div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <div className="space-y-4">
            {/* Details Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30 space-y-3"
                >
                  <div className="h-3 bg-zinc-800 rounded w-20"></div>
                  <div className="h-6 bg-zinc-800/70 rounded w-full"></div>
                  <div className="h-4 bg-zinc-800/50 rounded w-3/4"></div>
                </div>
              ))}
            </div>

            {/* Additional Content Lines */}
            <div className="space-y-3 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-800/30 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentSkeleton;
