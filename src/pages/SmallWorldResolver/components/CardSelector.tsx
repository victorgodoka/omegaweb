import React, { useState } from 'react';
import { Card, Button, TextInput } from 'flowbite-react';
import { Icon } from '@iconify/react';
import type { CardSelectorProps, MonsterCard } from '../types';

const CardSelector: React.FC<CardSelectorProps> = ({
  title,
  subtitle,
  selectedCard,
  onCardSelect,
  availableCards,
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCards = availableCards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardSelect = (card: MonsterCard) => {
    onCardSelect(card);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    onCardSelect(null);
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-300">{title}</h3>
          <p className="text-sm text-zinc-400">{subtitle}</p>
        </div>

        {selectedCard ? (
          <div className="bg-zinc-700 rounded-lg p-4 border border-zinc-600">
            <div className="flex items-center gap-4">
              <img
                src={selectedCard.image}
                alt={selectedCard.name}
                className="w-16 h-24 object-cover rounded"
                loading="lazy"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-white">{selectedCard.name}</h4>
                <div className="text-sm text-zinc-300 space-y-1">
                  <div>Type: {selectedCard.type}</div>
                  <div>Attribute: {selectedCard.attribute}</div>
                  <div>Level: {selectedCard.level}</div>
                  <div>ATK: {selectedCard.atk} / DEF: {selectedCard.def}</div>
                </div>
              </div>
              <Button
                size="sm"
                color="gray"
                onClick={clearSelection}
                className="bg-zinc-600 hover:bg-zinc-500"
              >
                <Icon icon="heroicons:x-mark" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-zinc-700 hover:bg-zinc-600 border-zinc-600 text-left justify-between"
              color="gray"
            >
              <span className="text-zinc-300">{placeholder}</span>
              <Icon icon="heroicons:chevron-down" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-zinc-700 border border-zinc-600 rounded-lg shadow-lg max-h-96 overflow-hidden">
                <div className="p-3 border-b border-zinc-600">
                  <TextInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search cards..."
                    className="bg-zinc-800 border-zinc-600 text-white"
                    autoFocus
                  />
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {filteredCards.length > 0 ? (
                    filteredCards.map(card => (
                      <button
                        key={card.id}
                        onClick={() => handleCardSelect(card)}
                        className="w-full p-3 text-left hover:bg-zinc-600 border-b border-zinc-600 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={card.image}
                            alt={card.name}
                            className="w-12 h-16 object-cover rounded"
                            loading="lazy"
                          />
                          <div>
                            <div className="font-medium text-white">{card.name}</div>
                            <div className="text-xs text-zinc-300">
                              {card.type} | {card.attribute} | Lv.{card.level}
                            </div>
                            <div className="text-xs text-zinc-400">
                              ATK: {card.atk} / DEF: {card.def}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-zinc-400">
                      No cards found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CardSelector;
