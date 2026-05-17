import React from 'react';

interface ProgressIndicatorProps {
  progress: number;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-400">Form Progress</span>
        <span className="text-sm text-zinc-400">{progress}%</span>
      </div>
      <div className="w-full bg-zinc-700 rounded-full h-2">
        <div
          className="bg-linear-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress === 100 && (
        <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
          <span>✓</span> Ready to generate PDF
        </p>
      )}
    </div>
  );
};

export default ProgressIndicator;
