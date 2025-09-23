import React from 'react';

const CardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg border border-purple-500/30 overflow-hidden">
        <div className="w-full h-24 bg-purple-800/50"></div>
      </div>
      <div className="mt-1 h-4 bg-purple-800/30 rounded"></div>
    </div>
  );
};

const DeckEditorSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-10 bg-purple-800/30 rounded w-64 mx-auto mb-2"></div>
          <div className="h-4 bg-purple-800/30 rounded w-96 mx-auto"></div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Column - Card Display */}
          <div className="col-span-3">
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30 p-8 h-full">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-purple-800/30 rounded"></div>
                <div className="h-32 bg-purple-800/30 rounded"></div>
                <div className="h-48 bg-purple-800/30 rounded"></div>
              </div>
            </div>
          </div>

          {/* Center Column - Deck Grids */}
          <div className="col-span-6 space-y-6">
            {/* Main Deck */}
            <div>
              <div className="h-6 bg-purple-800/30 rounded mb-3"></div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 40 }, (_, i) => (
                  <CardSkeleton key={`main-${i}`} />
                ))}
              </div>
            </div>

            {/* Extra Deck */}
            <div>
              <div className="h-6 bg-purple-800/30 rounded mb-3"></div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 15 }, (_, i) => (
                  <CardSkeleton key={`extra-${i}`} />
                ))}
              </div>
            </div>

            {/* Side Deck */}
            <div>
              <div className="h-6 bg-purple-800/30 rounded mb-3"></div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 15 }, (_, i) => (
                  <CardSkeleton key={`side-${i}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Card Library and Deck Stats */}
          <div className="col-span-3 flex flex-col gap-6">
            {/* Deck Stats */}
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/30 p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-purple-800/30 rounded"></div>
                <div className="h-10 bg-purple-800/30 rounded"></div>
                <div className="h-20 bg-purple-800/30 rounded"></div>
                <div className="h-16 bg-purple-800/30 rounded"></div>
              </div>
            </div>

            {/* Card Library */}
            <div className="flex-1">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-purple-800/30 rounded"></div>
                <div className="h-10 bg-purple-800/30 rounded"></div>
                <div className="h-4 bg-purple-800/30 rounded"></div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 16 }, (_, i) => (
                    <CardSkeleton key={`library-${i}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckEditorSkeleton;
