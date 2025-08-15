import React, { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { Icon } from '@iconify/react';
import { api } from '@/utils/Api';
import { AuthManager } from '@/utils/auth';
import { useToast } from '@/contexts/ToastContext';
import type { ConvertData, Cards } from '../PDFGenerator/types';
import type { CardGroup, CalculatorState, ProbabilityResult } from './types';

// Lazy load heavy components
const CardSelector = lazy(() => import('./components/CardSelector'));
const ProbabilityResults = lazy(() => import('./components/ProbabilityResults'));
const HypergeometricModal = lazy(() => import('./components/HypergeometricModal'));

const HypergeometricCalculator: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [state, setState] = useState<CalculatorState>({
    deckCode: '',
    handSize: 5,
    deckData: null,
    isLoading: false,
    isDeckValid: false,
    targetCards: [],
    results: null,
    shareableId: null,
    isSharing: false,
    autoCalculate: false
  });

  // Convert ConvertData to a flat card list for easier manipulation
  const allCards = useMemo(() => {
    if (!state.deckData) return [];

    const cards: (Cards & { location: 'main' | 'extra' | 'side' })[] = [
      ...state.deckData.mainDeck.map((card: Cards) => ({ ...card, location: 'main' as const })),
      ...state.deckData.extraDeck.map((card: Cards) => ({ ...card, location: 'extra' as const })),
      ...state.deckData.sideDeck.map((card: Cards) => ({ ...card, location: 'side' as const }))
    ];

    return cards;
  }, [state.deckData]);

  // Get main deck cards only (for probability calculations)
  const mainDeckCards = useMemo(() => {
    return allCards.filter(card => card.location === 'main');
  }, [allCards]);

  // Calculate total deck size
  const deckSize = useMemo(() => {
    return mainDeckCards.reduce((total, card) => total + card.qtd, 0);
  }, [mainDeckCards]);

  // Validate deck code and fetch deck data
  const validateDeckCode = useCallback(async (deckCode: string) => {
    if (!deckCode.trim()) {
      showError('Deck code is required');
      setState((prev: CalculatorState) => ({
        ...prev,
        isDeckValid: false,
        deckData: null
      }));
      return;
    }

    setState((prev: CalculatorState) => ({ ...prev, isLoading: true, deckValidationError: '' }));

    try {
      const encodedCode = encodeURIComponent(deckCode.trim());
      const response = await api.main.get(`convert?code=${encodedCode}`);

      if (response.ok && response.data && response.success) {
        setState((prev: CalculatorState) => ({
          ...prev,
          isDeckValid: true,
          deckData: response.data as ConvertData,
          isLoading: false,
          targetCards: [],
          results: null
        }));
      } else {
        showError('Invalid deck code or failed to load deck');
        setState((prev: CalculatorState) => ({
          ...prev,
          isDeckValid: false,
          deckData: null,
          isLoading: false
        }));
      }
    } catch (error) {
      showError('Error validating deck code');
      setState((prev: CalculatorState) => ({
        ...prev,
        isDeckValid: false,
        deckData: null,
        isLoading: false
      }));
    }
  }, []);

  // Hypergeometric probability calculation
  const calculateHypergeometric = useCallback((
    populationSize: number,
    successStatesInPopulation: number,
    sampleSize: number,
    observedSuccesses: number
  ): number => {
    // Calculate combination (n choose k)
    const combination = (n: number, k: number): number => {
      if (k > n || k < 0) return 0;
      if (k === 0 || k === n) return 1;

      let result = 1;
      for (let i = 0; i < Math.min(k, n - k); i++) {
        result = result * (n - i) / (i + 1);
      }
      return Math.round(result);
    };

    const numerator = combination(successStatesInPopulation, observedSuccesses) *
      combination(populationSize - successStatesInPopulation, sampleSize - observedSuccesses);
    const denominator = combination(populationSize, sampleSize);

    return denominator === 0 ? 0 : numerator / denominator;
  }, []);

  // Create shareable link
  const createShareableLink = useCallback(async () => {
    if (!state.isDeckValid || state.targetCards.length === 0) {
      showWarning('Please load a deck and add target groups before sharing');
      return;
    }

    setState(prev => ({ ...prev, isSharing: true }));

    try {
      const shareData = {
        deckCode: state.deckCode,
        handSize: state.handSize,
        targetCards: state.targetCards
      };

      const response = await api.main.post('calculator/save', shareData, {
        headers: AuthManager.getAuthHeader()
      });

      if (response.ok && response.data) {
        if (response.success && response.data.shareableId) {
          setState(prev => ({ 
            ...prev, 
            shareableId: response.data.shareableId,
            isSharing: false 
          }));
          showSuccess('Shareable link created!');
        } else {
          showError(response.message || 'Failed to create shareable link');
          setState(prev => ({ 
            ...prev, 
            isSharing: false 
          }));
        }
      } else {
        showError(response.message || 'Failed to create shareable link');
        setState(prev => ({ 
          ...prev, 
          isSharing: false 
        }));
      }
    } catch (error) {
      showError('Network error. Please try again.');
      setState(prev => ({ 
        ...prev, 
        isSharing: false 
      }));
    }
  }, [state.isDeckValid, state.deckCode, state.handSize, state.targetCards, showSuccess, showError]);

  // Copy share link to clipboard
  const copyShareLink = useCallback(async () => {
    if (!state.shareableId) return;
    
    const shareUrl = `${window.location.origin}/#/calculator?share=${state.shareableId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSuccess('Link copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSuccess('Link copied to clipboard!');
    }
  }, [state.shareableId, showSuccess]);

  // Load shared configuration
  const loadSharedConfiguration = useCallback(async (shareableId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await api.main.get(`calculator/shared/${shareableId}`);
      
      if (response.ok && response.data) {
        const { deckCode, handSize, targetCards } = response.data;
        
        // Load the deck first
        const deckResponse = await api.main.get(`convert?code=${encodeURIComponent(deckCode)}`);
        
        if (deckResponse.ok && deckResponse.data) {
          setState(prev => ({
            ...prev,
            deckCode,
            handSize,
            targetCards,
            deckData: deckResponse.data,
            isDeckValid: true,
            isLoading: false,
            results: null,
            autoCalculate: true
          }));
        } else {
          showError('Failed to load shared deck');
          setState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      } else {
        showError('Shared configuration not found');
        setState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    } catch (error) {
      showError('Network error while loading shared configuration');
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, []);

  // Check for shared configuration on component mount
  useEffect(() => {
    // Handle both hash-based routing and regular query parameters
    let searchParams = '';
    
    // Check if we have hash-based routing with query parameters
    const hash = window.location.hash;
    if (hash.includes('?')) {
      searchParams = hash.split('?')[1];
    } else {
      // Fallback to regular query parameters
      searchParams = window.location.search.substring(1);
    }
    
    const urlParams = new URLSearchParams(searchParams);
    const shareId = urlParams.get('share');
    
    if (shareId) {
      loadSharedConfiguration(shareId);
    }
  }, [loadSharedConfiguration]);

  

  // Check if modal should be shown automatically
  const shouldShowModal = useCallback(() => {
    const hiddenUntil = localStorage.getItem('hypergeometric_modal_hidden_until');
    if (!hiddenUntil) return true;
    
    const hiddenDate = new Date(hiddenUntil);
    const now = new Date();
    return now > hiddenDate;
  }, []);

  // Show modal automatically for new users (only when no deck is loaded)
  useEffect(() => {
    if (!state.isDeckValid && shouldShowModal()) {
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 1000); // Show after 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [state.isDeckValid, shouldShowModal]);

  // Handle modal open
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Calculate probabilities for target cards
  const calculateProbabilities = useCallback(() => {
    if (!state.isDeckValid || !state.deckData || state.targetCards.length === 0) {
      return;
    }

    const results: ProbabilityResult[] = [];

    // Shared combination helper
    const combination = (a: number, b: number): number => {
      if (b > a || b < 0) return 0;
      if (b === 0 || b === a) return 1;
      let res = 1;
      for (let i = 0; i < Math.min(b, a - b); i++) {
        res = (res * (a - i)) / (i + 1);
      }
      return Math.round(res);
    };

    // Probability of at least one success in s draws from a deck of size n with k successes
    const probAtLeastOne = (n: number, k: number, s: number): number => {
      if (n <= 0 || k <= 0 || s <= 0) return 0;
      const sample = Math.min(s, n);
      const denom = combination(n, sample);
      const numer = combination(n - k, sample);
      return denom === 0 ? 0 : 1 - numer / denom;
    };

    // Total-draw odds: at least one in the first (h + s) cards from deck of size n with k successes
    const totalDrawOdds = (n: number, k: number, h: number, s: number): number => {
      const draws = h + s;
      if (n <= 0 || k <= 0 || draws <= 0) return 0;
      const denom = combination(n, draws);
      const numer = combination(n - k, draws);
      return denom === 0 ? 0 : 1 - numer / denom;
    };

    // Prosperity odds using complement rule from the image:
    // P = 1 - P(no target in first h) * P(no target in m | no target in first h)
    const prosperityOdds = (n: number, k: number, h: number, m: number): number => {
      if (n <= 0 || k <= 0 || h < 0 || m <= 0 || h > n) return 0;
      // P(no in first h) = C(n-k, h) / C(n, h)
      const denomH = combination(n, h);
      const numerH = combination(n - k, h);
      const pNoInH = denomH === 0 ? 0 : numerH / denomH;
      // Given no in first h, still k successes left in remaining n-h cards
      // P(no in next m | no in first h) = C((n-h)-k, m) / C(n-h, m)
      const denomM = combination(n - h, m);
      const numerM = combination(n - h - k, m);
      const pNoInM = denomM === 0 ? 0 : numerM / denomM;
      return 1 - pNoInH * pNoInM;
    };

    // Conditional Desires odds: no target in opening hand, banish 10 from remaining, then draw 2
    const conditionalDesires = (n: number, k: number, h: number): number => {
      const banish = 10;
      const draws = 2;
      if (n <= 0 || h < 0 || h > n) return 0;
      // No target in opening hand
      const denomOpen = combination(n, h);
      const numerOpen = combination(n - k, h);
      const pNoInHand = denomOpen === 0 ? 0 : numerOpen / denomOpen;
      const n1 = n - h;
      if (n1 <= 0) return 0;
      const totalWays = combination(n1, Math.min(banish, n1));
      if (totalWays === 0) return 0;
      const maxBanish = Math.min(banish, n1);
      const maxR = Math.min(maxBanish, k);
      let sum = 0;
      for (let r = 0; r <= maxR; r++) {
        const ways = combination(k, r) * combination(n1 - k, maxBanish - r);
        const probThisR = ways / totalWays;
        const kRemain = k - r;
        const nRemain = n1 - maxBanish;
        const pAtLeastOne = probAtLeastOne(nRemain, kRemain, draws);
        sum += probThisR * pAtLeastOne;
      }
      return pNoInHand * sum;
    };

    state.targetCards.forEach((group: CardGroup) => {
      // Count total copies of target cards in this group (using instance IDs)
      const targetCopies = group.cards.length; // Each instance ID represents one copy
      
      if (targetCopies === 0) return;

      // Calculate probabilities for target cards only (without searchers)
      const targetProbabilities: { copies: number; probability: number }[] = [];
      for (let copies = 0; copies <= Math.min(targetCopies, state.handSize); copies++) {
        const prob = calculateHypergeometric(deckSize, targetCopies, state.handSize, copies);
        targetProbabilities.push({ copies, probability: prob });
      }

      // Calculate probability of drawing within the desired range (min to max) - targets only
      const inDesiredRange = targetProbabilities
        .filter(p => p.copies >= group.minDesiredCount && p.copies <= group.maxDesiredCount)
        .reduce((sum, p) => sum + p.probability, 0);

      // Calculate probability of drawing at least the minimum - targets only
      const atLeastMin = targetProbabilities
        .filter(p => p.copies >= group.minDesiredCount)
        .reduce((sum, p) => sum + p.probability, 0);

      // Calculate with searchers using proper hypergeometric logic
      let withSearchers = atLeastMin;
      let searcherProbabilities: { copies: number; probability: number }[] = [];
      
      if (group.searcherCards.length > 0) {
        const searcherCopies = group.searcherCards.length;
        
        // Create combined success pool: targets + searchers
        const totalSuccessPool = targetCopies + searcherCopies;
        
        // Calculate probabilities for the combined pool
        for (let copies = 0; copies <= Math.min(totalSuccessPool, state.handSize); copies++) {
          const prob = calculateHypergeometric(deckSize, totalSuccessPool, state.handSize, copies);
          searcherProbabilities.push({ copies, probability: prob });
        }
        
        // Probability of drawing at least the minimum from combined pool
        withSearchers = searcherProbabilities
          .filter(p => p.copies >= group.minDesiredCount)
          .reduce((sum, p) => sum + p.probability, 0);
      }

      // Quick odds calculations (targets only), conditional on opening hand already drawn
      const n = deckSize;
      const h = state.handSize;
      const needsTwoOrMore = group.minDesiredCount >= 2;
      // Destiny and Greed follow the "treat as one draw of h+s" identity
      const destinyDraw = needsTwoOrMore ? 0 : totalDrawOdds(n, targetCopies, h, 1);
      const greedDraw = totalDrawOdds(n, targetCopies, h, 2);
      const prosperity3 = needsTwoOrMore ? 0 : prosperityOdds(n, targetCopies, h, 3);
      const prosperity6 = needsTwoOrMore ? 0 : prosperityOdds(n, targetCopies, h, 6);
      const desiresDraw = conditionalDesires(n, targetCopies, h);

      results.push({
        groupName: group.name,
        totalCopies: targetCopies,
        minDesiredCount: group.minDesiredCount,
        maxDesiredCount: group.maxDesiredCount,
        probabilities: targetProbabilities, // Show target-only breakdown in detailed view
        inDesiredRange,
        atLeastMin,
        withSearchers: group.searcherCards.length > 0 ? withSearchers : undefined,
        destinyDraw,
        greedDraw,
        prosperity3,
        prosperity6,
        desiresDraw
      });
    });

    setState((prev: CalculatorState) => ({ ...prev, results }));
  }, [state.isDeckValid, state.deckData, state.targetCards, state.handSize, mainDeckCards, deckSize, calculateHypergeometric]);

  // Auto-calculate once shared configuration is loaded
  useEffect(() => {
    if (
      state.autoCalculate &&
      state.isDeckValid &&
      state.deckData &&
      state.targetCards.length > 0
    ) {
      calculateProbabilities();
      setState(prev => ({ ...prev, autoCalculate: false }));
    }
  }, [state.autoCalculate, state.isDeckValid, state.deckData, state.targetCards, calculateProbabilities]);

  // Handle deck code input
  const handleDeckCodeChange = useCallback((value: string) => {
    setState((prev: CalculatorState) => ({ ...prev, deckCode: value }));
  }, []);

  // Handle hand size change
  const handleHandSizeChange = useCallback((value: number) => {
    setState((prev: CalculatorState) => ({ 
      ...prev, 
      handSize: value,
      results: null // Clear results when hand size changes
    }));
  }, []);

  // Add target card group
  const addTargetGroup = useCallback((group: CardGroup) => {
    setState((prev: CalculatorState) => ({
      ...prev,
      targetCards: [...prev.targetCards, group],
      results: null // Clear results when adding a group
    }));
  }, []);

  // Remove target card group
  const removeTargetGroup = useCallback((index: number) => {
    setState((prev: CalculatorState) => ({
      ...prev,
      targetCards: prev.targetCards.filter((_: CardGroup, i: number) => i !== index),
      results: null // Clear results when removing a group
    }));
  }, []);

  // Update target group
  const updateTargetGroup = useCallback((index: number, group: CardGroup) => {
    setState((prev: CalculatorState) => ({
      ...prev,
      targetCards: prev.targetCards.map((g, i) => i === index ? group : g),
      results: null // Clear results when updating a group
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 py-24 px-12">
      <div className="grid grid-cols-1 gap-6">
        {/* Left Column - Deck Input & Settings */}
        <div className="gap-6 flex">
          {/* Deck Code Input */}
          <div className="bg-zinc-800 flex-1 rounded-lg border border-zinc-700 p-6">
            <h2 className="text-xl font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Icon icon="mdi:code-braces" className="text-blue-400" />
              Deck Code
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between gap-4">
                <input
                value={state.deckCode}
                onChange={(e) => handleDeckCodeChange(e.target.value)}
                placeholder="Paste your deck code here..."
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />


              <button
                onClick={() => validateDeckCode(state.deckCode)}
                disabled={state.isLoading || !state.deckCode.trim()}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {state.isLoading ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin" />
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:check-circle" />
                  </>
                )}
              </button>
              </div>

              {state.isDeckValid && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Icon icon="mdi:check-circle" />
                  Deck loaded successfully ({deckSize} cards in main deck)
                </div>
              )}
            </div>
          </div>

          {/* Hand Size Setting */}
          {state.isDeckValid && (
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
              <h2 className="text-xl font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                <Icon icon="mdi:hand" className="text-orange-400" />
                Sample Size
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Cards to draw
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={state.handSize}
                    onChange={(e) => handleHandSizeChange(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Middle Column - Card Selection */}
        <div className="">
          {state.isDeckValid && (
            <Suspense fallback={<div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 animate-pulse h-64"><div className="h-4 bg-zinc-700 rounded w-1/4 mb-4"></div><div className="space-y-2"><div className="h-3 bg-zinc-700 rounded"></div><div className="h-3 bg-zinc-700 rounded w-5/6"></div></div></div>}>
              <CardSelector
                cards={mainDeckCards}
                targetCards={state.targetCards}
                onAddTargetGroup={addTargetGroup}
                onRemoveTargetGroup={removeTargetGroup}
                onUpdateTargetGroup={updateTargetGroup}
              />
            </Suspense>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="">
          {state.isDeckValid && (
            <div className="space-y-6">
              <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
                    <Icon icon="mdi:chart-line" className="text-green-400" />
                    Probability Results
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={calculateProbabilities}
                      disabled={state.targetCards.length === 0}
                      className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Icon icon="mdi:calculator" />
                      Calculate
                    </button>
                    
                    {/* Share Button */}
                    <button
                      onClick={createShareableLink}
                      disabled={!state.isDeckValid || state.targetCards.length === 0 || state.isSharing}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      title="Create shareable link (requires login)"
                    >
                      {state.isSharing ? (
                        <Icon icon="mdi:loading" className="animate-spin" />
                      ) : (
                        <Icon icon="mdi:share-variant" />
                      )}
                      Share
                    </button>
                  </div>
                </div>

                {state.results && (
                  <Suspense fallback={<div className="bg-zinc-700/30 rounded-lg p-4 animate-pulse h-32"><div className="h-4 bg-zinc-600 rounded w-1/3 mb-2"></div><div className="h-3 bg-zinc-600 rounded w-full mb-1"></div><div className="h-3 bg-zinc-600 rounded w-2/3"></div></div>}>
                    <ProbabilityResults
                      results={state.results}
                      handSize={state.handSize}
                    />
                  </Suspense>
                )}

                {state.targetCards.length === 0 && (
                  <div className="text-center py-8 text-zinc-400">
                    <Icon icon="mdi:target" className="text-4xl mb-2 mx-auto" />
                    <p>Add target cards to calculate probabilities</p>
                  </div>
                )}
                

                
                {/* Share Success */}
                {state.shareableId && (
                  <div className="mt-4 p-4 bg-green-900/50 border border-green-500/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                        <Icon icon="mdi:check-circle" />
                        Shareable link created!
                      </p>
                      <button
                        onClick={copyShareLink}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <Icon icon="mdi:content-copy" />
                        Copy Link
                      </button>
                    </div>
                    <p className="text-green-300 text-xs break-all">
                      {`${window.location.origin}/calculator?share=${state.shareableId}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button - Help */}
      <div className="fixed bottom-6 left-6 z-40">
        <div className="group relative">
          <button
            onClick={handleOpenModal}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110"
            aria-label="Learn about hypergeometric distribution"
          >
            <Icon icon="mdi:help-circle" className="text-2xl" />
          </button>
          
          {/* Tooltip */}
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-zinc-800 text-zinc-200 text-sm px-3 py-2 rounded-lg shadow-lg border border-zinc-700 whitespace-nowrap">
              Learn about hypergeometric distribution
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-zinc-800 border-l border-b border-zinc-700 rotate-45"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Hypergeometric Distribution Modal */}
      <Suspense fallback={null}>
        <HypergeometricModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </Suspense>
    </div>
  );
};

export default HypergeometricCalculator;
