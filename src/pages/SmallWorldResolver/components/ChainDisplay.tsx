import React from 'react';
import { Card, Badge } from 'flowbite-react';
import { Icon } from '@iconify/react';
import type { ChainDisplayProps } from '../types';

const ChainDisplay: React.FC<ChainDisplayProps> = ({
  handCard,
  targetCard,
  validChains
}) => {
  const getStatBadgeColor = (stat: string) => {
    switch (stat) {
      case 'Type': return 'bg-purple-600';
      case 'Attribute': return 'bg-blue-600';
      case 'Level': return 'bg-green-600';
      case 'ATK': return 'bg-red-600';
      case 'DEF': return 'bg-orange-600';
      default: return 'bg-zinc-600';
    }
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700 mb-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-blue-300">Small World Chain Analysis</h2>
        
        {/* Chain Overview */}
        <div className="flex items-center justify-center gap-4 p-4 bg-zinc-700 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-24 bg-zinc-600 rounded mb-2 overflow-hidden">
              <img
                src={handCard.image}
                alt={handCard.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="text-sm font-medium text-white">{handCard.name}</div>
            <div className="text-xs text-zinc-400">Hand Card</div>
          </div>

          <Icon icon="heroicons:arrow-right" className="h-6 w-6 text-zinc-400" />
          
          <div className="text-center">
            <div className="w-16 h-24 bg-zinc-600 rounded mb-2 flex items-center justify-center">
              <span className="text-2xl">?</span>
            </div>
            <div className="text-sm font-medium text-white">Bridge Card</div>
            <div className="text-xs text-zinc-400">From Deck</div>
          </div>

          <Icon icon="heroicons:arrow-right" className="h-6 w-6 text-zinc-400" />

          <div className="text-center">
            <div className="w-16 h-24 bg-zinc-600 rounded mb-2 overflow-hidden">
              <img
                src={targetCard.image}
                alt={targetCard.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="text-sm font-medium text-white">{targetCard.name}</div>
            <div className="text-xs text-zinc-400">Target Card</div>
          </div>
        </div>

        {/* Chain Status */}
        <div className="text-center">
          {validChains.length > 0 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900 border border-green-700 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-300 font-medium">
                {validChains.length} valid chain{validChains.length !== 1 ? 's' : ''} found
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-900 border border-red-700 rounded-lg">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-red-300 font-medium">
                No valid chains found
              </span>
            </div>
          )}
        </div>

        {/* Card Stats Comparison */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-zinc-700 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3">{handCard.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-300">Type:</span>
                <Badge className={getStatBadgeColor('Type')}>{handCard.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Attribute:</span>
                <Badge className={getStatBadgeColor('Attribute')}>{handCard.attribute}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Level:</span>
                <Badge className={getStatBadgeColor('Level')}>{handCard.level}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">ATK:</span>
                <Badge className={getStatBadgeColor('ATK')}>{handCard.atk}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">DEF:</span>
                <Badge className={getStatBadgeColor('DEF')}>{handCard.def}</Badge>
              </div>
            </div>
          </div>

          <div className="bg-zinc-700 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3">{targetCard.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-300">Type:</span>
                <Badge className={getStatBadgeColor('Type')}>{targetCard.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Attribute:</span>
                <Badge className={getStatBadgeColor('Attribute')}>{targetCard.attribute}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Level:</span>
                <Badge className={getStatBadgeColor('Level')}>{targetCard.level}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">ATK:</span>
                <Badge className={getStatBadgeColor('ATK')}>{targetCard.atk}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">DEF:</span>
                <Badge className={getStatBadgeColor('DEF')}>{targetCard.def}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChainDisplay;
