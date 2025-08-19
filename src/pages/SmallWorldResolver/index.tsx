import React, { useState, useCallback, useMemo } from 'react';
import { Card, Button, Alert, Badge } from 'flowbite-react';
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
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Small World Resolver
              </h1>
              <p className="text-zinc-400 mt-1 text-sm">
                Find bridge cards that connect a hand monster to a target monster through exactly one matching stat each.
              </p>
            </div>
            {deckCards.length > 0 && (
              <Badge color="success" className="bg-green-900/40 border border-green-700 text-green-300">
                {deckCards.length} monsters loaded
              </Badge>
            )}
          </div>
        </div>

        {/* Deck Loader */}
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border-zinc-700/70 backdrop-blur-xl mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon icon="solar:documents-bold-duotone" className="h-5 w-5 text-blue-300" />
              <h2 className="text-lg font-semibold text-zinc-200">Load your deck</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <textarea
                value={deckCode}
                onChange={(e) => setDeckCode(e.target.value)}
                placeholder="Paste your deck code here (DUELIST.UNITE or YDK code)..."
                className="flex-1 bg-zinc-900/70 border-zinc-700 text-white rounded-lg p-3 min-h-[110px] resize-y focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                disabled={loading}
              />
              <div className="flex gap-2">
                <Button
                  onClick={loadDeck}
                  disabled={loading || !deckCode.trim()}
                  className="bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-500/30"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Icon icon="heroicons:magnifying-glass" className="h-4 w-4" />
                      Load Deck
                    </div>
                  )}
                </Button>
                {deckCards.length > 0 && (
                  <Button
                    color="gray"
                    onClick={() => { setDeckCards([]); setHandCard(null); setTargetCard(null); setValidChains([]); setIsDeckValid(false); }}
                    className="bg-zinc-700 hover:bg-zinc-600 border-zinc-600"
                  >
                    <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-1" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {!isDeckValid && deckCode && !loading && (
              <Alert color="failure" icon={() => <Icon icon="heroicons:exclamation-triangle" className="h-5 w-5" />}>
                Failed to load deck. Please check your deck code.
              </Alert>
            )}
          </div>
        </Card>

        {/* Main Grid */}
        {deckCards.length > 0 ? (
          <div className="space-y-6 space-x-6">
            {/* Left: Selectors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
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

            {/* Right: Results (sticky) */}
            <div className="lg:col-span-6">
              <div className="lg:sticky lg:top-6 space-y-6">
                {handCard && targetCard ? (
                  <>
                    <ChainDisplay
                      handCard={handCard}
                      targetCard={targetCard}
                      validChains={validChains}
                    />
                    <BridgeResults
                      chains={validChains}
                      handCard={handCard}
                      targetCard={targetCard}
                    />
                  </>
                ) : (
                  <Card className="bg-zinc-900/60 border-zinc-800">
                    <div className="py-10 text-center">
                      <div className="text-5xl mb-3">🔍</div>
                      <div className="text-zinc-300 font-medium mb-1">Select two cards to begin</div>
                      <div className="text-zinc-500 text-sm">Pick a hand monster and a target monster to see possible bridges.</div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Card className="bg-zinc-900/60 border-zinc-800">
            <div className="py-10 text-center">
              <div className="text-5xl mb-3">🗂️</div>
              <div className="text-zinc-300 font-medium mb-1">Load a deck to get started</div>
              <div className="text-zinc-500 text-sm">Paste a deck code above and click Load Deck.</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SmallWorldResolver;
