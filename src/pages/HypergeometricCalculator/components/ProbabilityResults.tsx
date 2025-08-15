import React from 'react';
import { Icon } from '@iconify/react';
import type { ProbabilityResultsProps } from '../types';

const ProbabilityResults: React.FC<ProbabilityResultsProps> = ({
  results,
  handSize
}) => {
  // Format percentage with 2 decimal places, rounded down
  const formatPercentage = (probability: number): string => {
    const percentage = probability * 100;
    const roundedDown = Math.floor(percentage * 100) / 100; // Round down to 2 decimal places
    return roundedDown.toFixed(2) + '%';
  };

  // Get color class based on probability
  const getProbabilityColor = (probability: number): string => {
    const percentage = probability * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  // Get background color for probability bars
  const getProbabilityBgColor = (probability: number): string => {
    const percentage = probability * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <Icon icon="mdi:chart-line" className="text-4xl mb-2 mx-auto" />
        <p>No results to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result, index) => (
          <div key={index} className="bg-zinc-700 rounded-lg p-4 border border-zinc-600">
            {/* Group Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-200">{result.groupName}</h3>
              <span className="text-sm text-zinc-400">
                {result.totalCopies} copies in deck
              </span>
            </div>

            {/* Main Probabilities */}
            <div className="mb-4 space-y-3">
              {/* In Desired Range */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-300 font-medium">
                    {result.minDesiredCount === result.maxDesiredCount
                      ? `Exactly ${result.minDesiredCount}`
                      : `${result.minDesiredCount}-${result.maxDesiredCount}`} card{result.maxDesiredCount !== 1 ? 's' : ''} in {handSize} cards:
                  </span>
                  <span className={`font-bold text-lg ${getProbabilityColor(result.inDesiredRange)}`}>
                    {formatPercentage(result.inDesiredRange)}
                  </span>
                </div>

                {/* Probability Bar */}
                <div className="w-full bg-zinc-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getProbabilityBgColor(result.inDesiredRange)}`}
                    style={{ width: `${Math.min(result.inDesiredRange * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* At Least Minimum Count (only show if different from range) */}
              {result.minDesiredCount !== result.maxDesiredCount && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-300 font-medium">
                      At least {result.minDesiredCount} card{result.minDesiredCount !== 1 ? 's' : ''} in {handSize} cards:
                    </span>
                    <span className={`font-bold text-lg ${getProbabilityColor(result.atLeastMin)}`}>
                      {formatPercentage(result.atLeastMin)}
                    </span>
                  </div>

                  {/* Probability Bar */}
                  <div className="w-full bg-zinc-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProbabilityBgColor(result.atLeastMin)}`}
                      style={{ width: `${Math.min(result.atLeastMin * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Odds */}
            <div className="mb-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="mdi:flash" className="text-yellow-400" />
                <span className="text-zinc-300 font-medium">Quick Odds</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Destiny Draw (1):</span>
                  {result.minDesiredCount >= 2 ? (
                    <span className="text-zinc-500">—</span>
                  ) : (
                    <span className={`font-semibold ${getProbabilityColor(result.destinyDraw)}`}>{formatPercentage(result.destinyDraw)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Greed Draw (2):</span>
                  <span className={`font-semibold ${getProbabilityColor(result.greedDraw)}`}>{formatPercentage(result.greedDraw)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Prosperity 3:</span>
                  {result.minDesiredCount >= 2 ? (
                    <span className="text-zinc-500">—</span>
                  ) : (
                    <span className={`font-semibold ${getProbabilityColor(result.prosperity3)}`}>{formatPercentage(result.prosperity3)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Prosperity 6:</span>
                  {result.minDesiredCount >= 2 ? (
                    <span className="text-zinc-500">—</span>
                  ) : (
                    <span className={`font-semibold ${getProbabilityColor(result.prosperity6)}`}>{formatPercentage(result.prosperity6)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-zinc-400">Desires (banish 10, draw 2):</span>
                  <span className={`font-semibold ${getProbabilityColor(result.desiresDraw)}`}>{formatPercentage(result.desiresDraw)}</span>
                </div>
              </div>
            </div>

            {/* With Searchers (if applicable) */}
            {result.withSearchers !== undefined && (
              <div className="mb-4 p-3 bg-zinc-800 rounded-lg border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="mdi:magnify" className="text-orange-400" />
                  <span className="text-zinc-300 font-medium">With searchers:</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400 text-sm">
                    At least {result.minDesiredCount} (including searchers)
                  </span>
                  <span className={`font-bold text-lg ${getProbabilityColor(result.withSearchers)}`}>
                    {formatPercentage(result.withSearchers)}
                  </span>
                </div>

                {/* Searcher Probability Bar */}
                <div className="w-full bg-zinc-600 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500 bg-orange-500"
                    style={{ width: `${Math.min(result.withSearchers * 100, 100)}%` }}
                  />
                </div>

                {/* Improvement indicator */}
                {result.withSearchers > result.atLeastMin && (
                  <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                    <Icon icon="mdi:trending-up" />
                    +{formatPercentage(result.withSearchers - result.atLeastMin)} improvement
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProbabilityResults;
