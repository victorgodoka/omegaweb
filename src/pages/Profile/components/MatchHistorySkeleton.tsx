import React from 'react';

const MatchHistorySkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(10)].map((_, index) => (
        <div key={index} className="bg-zinc-800/80 min-h-38 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-zinc-700/50"></div>
              <div className="h-4 bg-zinc-700/50 rounded w-24"></div>
            </div>
            <div className="h-4 bg-zinc-700/50 rounded w-16"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-700/50 rounded w-3/4"></div>
              <div className="h-3 bg-zinc-800/50 rounded-full w-full">
                <div className="h-full bg-blue-500/30 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-zinc-700/50 flex items-center justify-center">
                <div className="h-4 w-4 bg-zinc-600/50 rounded"></div>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4 bg-zinc-700/50 rounded w-3/4 ml-auto"></div>
              <div className="h-3 bg-zinc-800/50 rounded-full w-full">
                <div className="h-full bg-red-500/30 rounded-full ml-auto" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="h-3 bg-zinc-800/50 rounded w-32"></div>
        </div>
      ))}
    </div>
  );
};

export default MatchHistorySkeleton;
