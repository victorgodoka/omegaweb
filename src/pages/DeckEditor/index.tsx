import React, { useMemo, useState, useEffect } from 'react';
import { useCache } from '../../contexts/CacheContext';
import CardDisplay from './components/CardDisplay';
import DeckGrid from './components/DeckGrid';
import CardLibrary from './components/CardLibrary';
import DeckStats from './components/DeckStats';
import DeckEditorSkeleton from './components/DeckEditorSkeleton';
import DeckBuilderInfoModal from './components/DeckBuilderInfoModal';
import { useDeck } from './hooks/useDeck';
import { useCardSelection } from './hooks/useCardSelection';
import type { Card, YGOAPI } from './types';

const DeckEditor: React.FC = () => {
  const { cardStats, isLoading, error } = useCache();
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Use custom hooks for deck and card selection logic
  const {
    deck,
    deckStats,
    addCardToDeck,
    removeCardFromDeck,
    changeBanlist,
  } = useDeck();

  // Check if modal should be shown on component mount
  useEffect(() => {
    const hiddenUntil = localStorage.getItem('deckbuilder_modal_hidden_until');
    if (hiddenUntil) {
      const hiddenDate = new Date(hiddenUntil);
      const now = new Date();
      if (now < hiddenDate) {
        return; // Don't show modal, still within hidden period
      }
    }
    
    // Show modal on first visit or after hidden period expires
    setShowInfoModal(true);
  }, []);
  
  const {
    selectedCard,
    handleCardHover,
    handleCardClick
  } = useCardSelection();

  // Convert YGOAPI to Card type
  const cardLibrary = useMemo(() => {
    console.log(cardStats);
    return cardStats.map((card: YGOAPI) => ({
      id: card.id,
      name: card.name,
      desc: card.desc,
      card_images: card.card_images,
      type: card.type,
      humanReadableCardType: card.humanReadableCardType,
      frameType: card.frameType,
      race: card.race,
      attribute: card.attribute,
      level: card.level,
      scale: card.scale,
      linkval: card.linkval,
      atk: card.atk,
      def: card.def,
      card_prices: card.card_prices,
      banlist_info: card.banlist_info
    })) as Card[];
  }, [cardStats]);

  if (isLoading) {
    return <DeckEditorSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400 text-xl">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-8 mt-12 flex flex-col">
      <div className="mx-auto w-full flex flex-col h-full">
        <div className="mb-4 flex-shrink-0">
          <DeckStats
            banlist={deck.banlist}
            totalCards={deckStats.totalCards}
            cardTypes={deckStats.cardTypes}
            mainDeck={deck.mainDeck}
            extraDeck={deck.extraDeck}  
            sideDeck={deck.sideDeck}
            onBanlistChange={changeBanlist}
          />
        </div>

        {/* Main Layout - 3 Columns */}
        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
          <div className="col-span-3 flex flex-col">
            <CardDisplay
              card={selectedCard}
            />
          </div>

          <div className="col-span-6 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto pr-4">
              <DeckGrid
                mainDeck={deck.mainDeck}
                extraDeck={deck.extraDeck}
                sideDeck={deck.sideDeck}
                onCardClick={handleCardClick}
                onCardHover={handleCardHover}
                onCardRemove={removeCardFromDeck}
                currentBanlist={deck.banlist}
              />
            </div>
          </div>

          {/* Right Column - Card Library Only */}
          <div className="col-span-3 flex flex-col">
            <CardLibrary
              cards={cardLibrary}
              onCardClick={handleCardClick}
              onCardHover={handleCardHover}
              onCardAdd={addCardToDeck}
              currentBanlist={deck.banlist}
            />
          </div>
        </div>
      </div>

      {/* Info Modal */}
      <DeckBuilderInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </div>
  );
};

export default DeckEditor;
