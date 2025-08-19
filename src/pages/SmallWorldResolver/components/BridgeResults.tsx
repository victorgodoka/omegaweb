import React, { useMemo } from 'react';
import { Card, Badge } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { useCache } from '@/contexts/CacheContext';
import type { SmallWorldChain, MonsterCard } from '../types';

interface BridgeResultsProps {
  chains: SmallWorldChain[];
  handCard: MonsterCard;
  targetCard: MonsterCard;
}

const BridgeResults: React.FC<BridgeResultsProps> = ({
  chains,
  handCard,
  targetCard
}) => {
  const { cardStats } = useCache();

  // Generate bridge card suggestions when no valid chains found
  const bridgeSuggestions = useMemo(() => {
    if (chains.length > 0 || !handCard || !targetCard) return [];

    const suggestions: MonsterCard[] = [];
    const handStats = { type: handCard.type, attribute: handCard.attribute, level: handCard.level, atk: handCard.atk, def: handCard.def };
    const targetStats = { type: targetCard.type, attribute: targetCard.attribute, level: targetCard.level, atk: targetCard.atk, def: targetCard.def };

    // Find cards that could bridge hand and target
    cardStats.forEach((card: YGOAPI) => {
      if (card.humanReadableCardType.includes('Monster')) {
        const cardStats = { 
          type: card.race || '', 
          attribute: card.attribute || '', 
          level: card.level || 0, 
          atk: card.atk || 0, 
          def: card.def || 0 
        };

        // Check if this card shares exactly one stat with hand card
        const handMatches = [
          handStats.type === cardStats.type,
          handStats.attribute === cardStats.attribute,
          handStats.level === cardStats.level,
          handStats.atk === cardStats.atk,
          handStats.def === cardStats.def,
        ].filter(Boolean).length;

        // Check if this card shares exactly one stat with target card
        const targetMatches = [
          targetStats.type === cardStats.type,
          targetStats.attribute === cardStats.attribute,
          targetStats.level === cardStats.level,
          targetStats.atk === cardStats.atk,
          targetStats.def === cardStats.def,
        ].filter(Boolean).length;

        // Valid bridge card: shares exactly one stat with each
        if (handMatches === 1 && targetMatches === 1) {
          suggestions.push({
            id: card.id,
            name: card.name,
            type: card.race || '',
            attribute: card.attribute || '',
            level: card.level || 0,
            atk: card.atk || 0,
            def: card.def || 0,
            image: card.card_images?.[0]?.image_url_small || '',
          });
        }
      }
    });

    // Limit to top 10 suggestions
    return suggestions.slice(0, 10);
  }, [chains.length, handCard, targetCard, cardStats]);
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

  if (chains.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border-zinc-700/70">
          <div className="text-center py-10">
            <div className="text-6xl mb-3">😔</div>
            <h3 className="text-xl font-semibold text-red-300 mb-2">No Valid Chains Found</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              There are no cards in your deck that can serve as a bridge between{' '}
              <span className="text-white font-medium">{handCard.name}</span> and{' '}
              <span className="text-white font-medium">{targetCard.name}</span>.
            </p>
          </div>
        </Card>

        {bridgeSuggestions.length > 0 && (
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border-zinc-700/70">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon icon="heroicons:light-bulb" className="h-6 w-6 text-yellow-300" />
                <h3 className="text-lg font-semibold text-zinc-100">
                  Suggested Bridge Cards ({bridgeSuggestions.length})
                </h3>
              </div>
              
              <p className="text-zinc-400 text-sm">
                These cards from the card database could work as bridges. Consider adding them to your deck:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bridgeSuggestions.map((card) => (
                  <div
                    key={card.id}
                    className="bg-zinc-900/60 rounded-lg p-4 border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-16 h-22 object-cover rounded flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm mb-2 truncate" title={card.name}>
                          {card.name}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Type:</span>
                            <span className="text-zinc-200">{card.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Attr:</span>
                            <span className="text-zinc-200">{card.attribute}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Level:</span>
                            <span className="text-zinc-200">{card.level}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">ATK:</span>
                            <span className="text-zinc-200">{card.atk}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">DEF:</span>
                            <span className="text-zinc-200">{card.def}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-900/40 border border-yellow-700 rounded-lg p-4">
                <div className="text-yellow-300 text-sm">
                  <Icon icon="heroicons:information-circle" className="h-4 w-4 inline mr-1" />
                  <strong>Tip:</strong> Each suggested card shares exactly one stat with both your hand card and target card, making them valid Small World bridges.
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border-zinc-700/70">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Icon icon="heroicons:check-circle" className="h-6 w-6 text-green-400" />
          <h2 className="text-lg font-semibold text-zinc-100">
            Valid Bridge Cards ({chains.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chains.map((chain, index) => (
            <div
              key={`${chain.bridgeCard.id}-${index}`}
              className="bg-zinc-900/60 rounded-lg p-4 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              {/* Chain Visualization */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Hand Card */}
                  <div className="text-center">
                    <div className="w-12 h-16 bg-zinc-800 rounded overflow-hidden mb-1">
                      <img
                        src={chain.handCard.image}
                        alt={chain.handCard.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400">Hand</div>
                  </div>

                  {/* Connection 1 */}
                  <div className="flex flex-col items-center">
                    <Badge className={`${getStatBadgeColor(chain.handToBridgeConnection)} mb-1`}>
                      {chain.handToBridgeConnection}
                    </Badge>
                    <Icon icon="heroicons:arrow-right" className="h-4 w-4 text-zinc-400" />
                  </div>

                  {/* Bridge Card */}
                  <div className="text-center">
                    <div className="w-12 h-16 bg-zinc-800 rounded overflow-hidden mb-1">
                      <img
                        src={chain.bridgeCard.image}
                        alt={chain.bridgeCard.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400">Bridge</div>
                  </div>

                  {/* Connection 2 */}
                  <div className="flex flex-col items-center">
                    <Badge className={`${getStatBadgeColor(chain.bridgeToTargetConnection)} mb-1`}>
                      {chain.bridgeToTargetConnection}
                    </Badge>
                    <Icon icon="heroicons:arrow-right" className="h-4 w-4 text-zinc-400" />
                  </div>

                  {/* Target Card */}
                  <div className="text-center">
                    <div className="w-12 h-16 bg-zinc-800 rounded overflow-hidden mb-1">
                      <img
                        src={chain.targetCard.image}
                        alt={chain.targetCard.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400">Target</div>
                  </div>
                </div>
              </div>

              {/* Bridge Card Details */}
              <div className="bg-zinc-950/40 rounded-lg p-4 border border-zinc-900">
                <div className="flex items-start gap-4">
                  <img
                    src={chain.bridgeCard.image}
                    alt={chain.bridgeCard.name}
                    className="w-20 h-28 object-cover rounded"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-white mb-2 truncate" title={chain.bridgeCard.name}>
                      {chain.bridgeCard.name}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-300">Type:</span>
                          <span className="text-white">{chain.bridgeCard.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-300">Attribute:</span>
                          <span className="text-white">{chain.bridgeCard.attribute}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-300">Level:</span>
                          <span className="text-white">{chain.bridgeCard.level}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-300">ATK:</span>
                          <span className="text-white">{chain.bridgeCard.atk}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-300">DEF:</span>
                          <span className="text-white">{chain.bridgeCard.def}</span>
                        </div>
                      </div>
                    </div>

                    {/* Connection Summary */}
                    <div className="mt-3 p-3 bg-zinc-900/70 rounded border border-zinc-800">
                      <div className="text-xs text-zinc-400 mb-1">Chain Summary:</div>
                      <div className="text-sm text-zinc-200">
                        Shares <Badge className={`${getStatBadgeColor(chain.handToBridgeConnection)} mx-1`}>
                          {chain.handToBridgeConnection}
                        </Badge> 
                        with {handCard.name}, and <Badge className={`${getStatBadgeColor(chain.bridgeToTargetConnection)} mx-1`}>
                          {chain.bridgeToTargetConnection}
                        </Badge> 
                        with {targetCard.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Usage Instructions */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <h4 className="font-semibold text-zinc-200 mb-2">How to Use Small World:</h4>
          <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
            <li>Reveal {handCard.name} from your hand</li>
            <li>Choose one of the bridge cards above from your deck</li>
            <li>Banish {handCard.name} from your hand face-down</li>
            <li>Add {targetCard.name} from your deck to your hand</li>
            <li>Banish the bridge card from your deck face-down</li>
          </ol>
        </div>
      </div>
    </Card>
  );
};

export default BridgeResults;
