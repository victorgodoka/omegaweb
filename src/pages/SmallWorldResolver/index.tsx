import React, { useState, useCallback, useMemo } from 'react';
import { Card, Button, Alert } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { api } from '@/utils/Api';
import { useToast } from '@/contexts/ToastContext';
import { useCache } from '@/contexts/CacheContext';
import CardSelector from './components/CardSelector';
import BridgeResults from './components/BridgeResults';
import ChainDisplay from './components/ChainDisplay';
import type { MonsterCard, SmallWorldChain, SmallWorldStats } from './types';
import type { ConvertData, Cards } from '../PDFGenerator/types';

const SmallWorldResolver: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const { cardStats } = useCache();
  const [deckCode, setDeckCode] = useState('');
  const [deckCards, setDeckCards] = useState<MonsterCard[]>([]);
  const [handCard, setHandCard] = useState<MonsterCard | null>(null);
  const [targetCard, setTargetCard] = useState<MonsterCard | null>(null);
  const [validChains, setValidChains] = useState<SmallWorldChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeckValid, setIsDeckValid] = useState(false);

  // Load deck from code using the same approach as HypergeometricCalculator
  const loadDeck = useCallback(async () => {
    if (!deckCode.trim()) {
      showError('Please enter a deck code');
      setIsDeckValid(false);
      return;
    }

    setLoading(true);
    
    try {
      const encodedCode = encodeURIComponent(deckCode.trim());
      const response = await api.main.get(`convert?code=${encodedCode}`);

      if (response.ok && response.data && response.success) {
        const convertedData = response.data as ConvertData;
        setIsDeckValid(true);
        
        // Use cached card data from CacheContext
        const allCards = cardStats;
        
        // Convert main deck cards to monster cards
        const monsters: MonsterCard[] = [];
        convertedData.mainDeck.forEach((card: Cards) => {
          // Find full card data from cache
          const fullCard = allCards.find((c: YGOAPI) => c.id === card.id);
          if (fullCard && fullCard.humanReadableCardType.includes('Monster')) {
            for (let i = 0; i < card.qtd; i++) {
              monsters.push({
                id: fullCard.id,
                name: fullCard.name,
                type: fullCard.race || '',
                attribute: fullCard.attribute || '',
                level: fullCard.level || 0,
                atk: fullCard.atk || 0,
                def: fullCard.def || 0,
                image: fullCard.card_images?.[0]?.image_url_small || '',
              });
            }
          }
        });
        
        setDeckCards(monsters);
        
        // Reset selections
        setHandCard(null);
        setTargetCard(null);
        setValidChains([]);
        
        showSuccess(`Loaded ${monsters.length} monster cards from your deck`);
      } else {
        showError('Invalid deck code or failed to load deck');
        setIsDeckValid(false);
        setDeckCards([]);
      }
    } catch (error) {
      showError('Error loading deck code');
      setIsDeckValid(false);
      setDeckCards([]);
    } finally {
      setLoading(false);
    }
  }, [deckCode, showError, showSuccess, cardStats]);

  // Check if two cards share exactly one stat
  const shareExactlyOneStat = useCallback((card1: SmallWorldStats, card2: SmallWorldStats): boolean => {
    const matches = [
      card1.type === card2.type,
      card1.attribute === card2.attribute,
      card1.level === card2.level,
      card1.atk === card2.atk,
      card1.def === card2.def,
    ].filter(Boolean).length;

    return matches === 1;
  }, []);

  // Get the shared stat between two cards
  const getSharedStat = useCallback((card1: SmallWorldStats, card2: SmallWorldStats): string => {
    if (card1.type === card2.type) return 'Type';
    if (card1.attribute === card2.attribute) return 'Attribute';
    if (card1.level === card2.level) return 'Level';
    if (card1.atk === card2.atk) return 'ATK';
    if (card1.def === card2.def) return 'DEF';
    return '';
  }, []);

  // Find valid Small World chains
  const findValidChains = useCallback(() => {
    if (!handCard || !targetCard) {
      setValidChains([]);
      return;
    }

    const chains: SmallWorldChain[] = [];

    // Find bridge cards that connect hand card to target card
    deckCards.forEach(bridgeCard => {
      // Bridge card must be different from hand and target cards
      if (bridgeCard.id === handCard.id || bridgeCard.id === targetCard.id) {
        return;
      }

      // Check if bridge card shares exactly one stat with hand card
      const handToBridge = shareExactlyOneStat(handCard, bridgeCard);
      
      // Check if bridge card shares exactly one stat with target card
      const bridgeToTarget = shareExactlyOneStat(bridgeCard, targetCard);

      if (handToBridge && bridgeToTarget) {
        // Find which stat connects hand to bridge
        const handBridgeConnection = getSharedStat(handCard, bridgeCard);
        
        // Find which stat connects bridge to target
        const bridgeTargetConnection = getSharedStat(bridgeCard, targetCard);

        chains.push({
          handCard,
          bridgeCard,
          targetCard,
          handToBridgeConnection: handBridgeConnection,
          bridgeToTargetConnection: bridgeTargetConnection,
          isValid: true,
        });
      }
    });

    setValidChains(chains);
  }, [handCard, targetCard, deckCards, shareExactlyOneStat, getSharedStat]);

  // Update chains when cards change
  React.useEffect(() => {
    findValidChains();
  }, [findValidChains]);

  const availableCards = useMemo(() => {
    return deckCards.filter(card => 
      card.id !== handCard?.id && card.id !== targetCard?.id
    );
  }, [deckCards, handCard, targetCard]);

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Usage Instructions */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
          <h4 className="font-semibold text-zinc-300 mb-2">How to Use Small World:</h4>
          <ol className="text-sm text-zinc-200 space-y-1 list-decimal list-inside">
            <li>Reveal {handCard?.name} from your hand</li>
            <li>Choose one of the bridge cards above from your deck</li>
            <li>Banish {handCard?.name} from your hand face-down</li>
            <li>Add {targetCard?.name} from your deck to your hand</li>
            <li>Banish the bridge card from your deck face-down</li>
          </ol>
        </div>

        {/* Deck Loading Section */}
        <Card className="bg-zinc-800 border-zinc-700 mb-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-300">Load Your Deck</h2>
            <div className="flex gap-4">
              <textarea
                value={deckCode}
                onChange={(e) => setDeckCode(e.target.value)}
                placeholder="Paste your deck code here..."
                className="flex-1 bg-zinc-700 border-zinc-600 text-white rounded-lg p-3 min-h-[100px] resize-none"
                disabled={loading}
              />
              <Button
                onClick={loadDeck}
                disabled={loading || !deckCode.trim()}
                className="bg-zinc-600 hover:bg-zinc-700 self-start"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:magnifying-glass" className="h-4 w-4" />
                    Load Deck
                  </div>
                )}
              </Button>
            </div>
            
            {!isDeckValid && deckCode && !loading && (
              <Alert color="failure" icon={() => <Icon icon="heroicons:exclamation-triangle" className="h-5 w-5" />}>
                Failed to load deck. Please check your deck code.
              </Alert>
            )}

            {deckCards.length > 0 && (
              <div className="text-sm text-zinc-400">
                Loaded {deckCards.length} monster cards from your deck
              </div>
            )}
          </div>
        </Card>

        {deckCards.length > 0 && (
          <>
            {/* Card Selection */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <CardSelector
                title="Card in Hand"
                subtitle="Select the monster you want to reveal from your hand"
                selectedCard={handCard}
                onCardSelect={setHandCard}
                availableCards={availableCards}
                placeholder="Choose card from hand..."
              />
              
              <CardSelector
                title="Target Card"
                subtitle="Select the monster you want to search from your deck"
                selectedCard={targetCard}
                onCardSelect={setTargetCard}
                availableCards={availableCards}
                placeholder="Choose target card..."
              />
            </div>

            {/* Chain Display */}
            {handCard && targetCard && (
              <ChainDisplay
                handCard={handCard}
                targetCard={targetCard}
                validChains={validChains}
              />
            )}

            {/* Results */}
            {handCard && targetCard && (
              <BridgeResults
                chains={validChains}
                handCard={handCard}
                targetCard={targetCard}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SmallWorldResolver;
