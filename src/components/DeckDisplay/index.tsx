import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { tcgHref } from '@/utils/Functions';
import type { Card, Decklist } from '@/utils/ApiTypes';
import { sortCards } from '@/utils/CardSorter';

interface DeckDisplayProps {
  deck: Decklist;
  className?: string;
}

const DeckDisplay: React.FC<DeckDisplayProps> = ({ deck, className = '' }) => {
  const { t, i18n } = useTranslation();
  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual');
  const getNameByLang = (card: Card) => i18n.language === 'pt' ? card.name_pt : card.name_en;
  // console.log('deck', deck);
  const renderCardVisual = (card: Card, index: number) => (
    <a
      key={`${card.id}-${getNameByLang(card)}-${index}`}
      href={tcgHref(getNameByLang(card) || '')}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block"
      title={getNameByLang(card) || ''}
    >
      <div className="aspect-150/219 relative overflow-hidden rounded-lg border border-zinc-700 hover:border-amber-400/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-400/20">
        <img
          src={`https://ygopro.online/assets/card-images/common/${card.id}.jpg`}
          alt={getNameByLang(card) || ''}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      </div>
    </a>
  );

  const renderCardText = (card: Card) => (
    <a
      key={`${card.id}-${getNameByLang(card)}`}
      href={tcgHref(getNameByLang(card) || '')}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-700/30 hover:border-amber-400/50 hover:bg-zinc-800/50 transition-all group"
    >
      <span className="text-zinc-200 text-sm group-hover:text-amber-400 transition-colors">
        {getNameByLang(card) || ''}
      </span>
      <div className="flex items-center gap-2">
        <Icon 
          icon="mdi:open-in-new" 
          className="text-zinc-500 group-hover:text-amber-400 transition-colors" 
        />
      </div>
    </a>
  );

  const renderDeckSection = (
    cards: Card[],
    title: string,
    icon: string,
    color: string
  ) => {
    if (!cards || cards.length === 0) return null;
    cards = sortCards(cards);
    const totalCards = cards.length;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Icon icon={icon} className={`text-xl ${color}`} />
            <span className="text-zinc-200">{title}</span>
            <span className="text-sm text-zinc-500">({totalCards})</span>
          </h3>
        </div>
        
        {viewMode === 'visual' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {cards.map(renderCardVisual)}
          </div>
        )}
        {viewMode === 'text' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {cards.map(renderCardText)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6 ${className}`}
    >
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon icon="mdi:cards" className="text-2xl text-blue-400" />
          <h2 className="text-xl font-semibold text-zinc-100">
            {t("deck_display.title", { defaultValue: "Deck" })}
          </h2>
        </div>

        <div className="inline-flex bg-zinc-900/50 rounded-lg p-1 border border-zinc-700/50">
          <button
            onClick={() => setViewMode("visual")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              viewMode === "visual"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
            }`}
            title={t("deck_display.visual_mode", { defaultValue: "Visual" })}
          >
            <Icon icon="mdi:image" className="text-lg" />
            <span className="hidden sm:inline">
              {t("deck_display.visual", { defaultValue: "Visual" })}
            </span>
          </button>
          <button
            onClick={() => setViewMode("text")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              viewMode === "text"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
            }`}
            title={t("deck_display.text_mode", { defaultValue: "Text" })}
          >
            <Icon icon="mdi:format-list-bulleted" className="text-lg" />
            <span className="hidden sm:inline">
              {t("deck_display.text", { defaultValue: "Text" })}
            </span>
          </button>
        </div>
      </div>

      {/* Deck Sections */}
      <div>
        {renderDeckSection(
          deck.mainDeck,
          t("deck_display.main_deck", { defaultValue: "Main Deck" }),
          "mdi:cards",
          "text-blue-400"
        )}

        {renderDeckSection(
          deck.extraDeck,
          t("deck_display.extra_deck", { defaultValue: "Extra Deck" }),
          "mdi:cards-variant",
          "text-purple-400"
        )}

        {renderDeckSection(
          deck.sideDeck,
          t("deck_display.side_deck", { defaultValue: "Side Deck" }),
          "mdi:cards-outline",
          "text-amber-400"
        )}
      </div>

      {/* Archetypes */}
      {deck.archetypes && deck.archetypes.length > 0 && (
        <div className="mt-6 pt-6 border-t border-zinc-700/50">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
            <Icon icon="mdi:tag-multiple" className="text-base" />
            {t("deck_display.archetypes", { defaultValue: "Archetypes" })}
          </h3>
          <div className="flex flex-wrap gap-2">
            {deck.archetypes.map((archetype, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-zinc-900/50 border border-zinc-700 rounded-full text-xs text-zinc-300"
              >
                {archetype}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckDisplay;
