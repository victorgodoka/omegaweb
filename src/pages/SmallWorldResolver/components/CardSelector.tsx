import React, { useState } from 'react';
import { Card, Button, TextInput, Badge } from 'flowbite-react';
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
    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border-zinc-700/70 w-full">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h3>
          <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>
        </div>

        {selectedCard ? (
          <div className="bg-zinc-900/60 rounded-lg p-4 border border-zinc-700">
            <div className="flex items-center gap-4">
              <img
                src={selectedCard.image}
                alt={selectedCard.name}
                className="w-16 h-24 object-cover rounded shadow-sm"
                loading="lazy"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-white truncate" title={selectedCard.name}>{selectedCard.name}</h4>
                <div className="text-xs text-zinc-300 mt-1 flex flex-wrap gap-2">
                  <Badge className="bg-purple-600/80">{selectedCard.type}</Badge>
                  <Badge className="bg-blue-600/80">{selectedCard.attribute}</Badge>
                  <Badge className="bg-green-600/80">Lv.{selectedCard.level}</Badge>
                  <Badge className="bg-red-600/80">ATK {selectedCard.atk}</Badge>
                  <Badge className="bg-orange-600/80">DEF {selectedCard.def}</Badge>
                </div>
              </div>
              <Button
                size="sm"
                color="gray"
                onClick={clearSelection}
                className="bg-zinc-700 hover:bg-zinc-600 border-zinc-600"
              >
                <Icon icon="heroicons:x-mark" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-700 text-left justify-between"
              color="gray"
            >
              <span className="text-zinc-300">{placeholder}</span>
              <Icon icon="heroicons:chevron-down" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl max-h-96 overflow-hidden">
                <div className="p-3 border-b border-zinc-800">
                  <TextInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search cards..."
                    className="bg-zinc-900 border-zinc-700 text-white"
                    autoFocus
                  />
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {filteredCards.length > 0 ? (
                    filteredCards.map(card => (
                      <button
                        key={card.id}
                        onClick={() => handleCardSelect(card)}
                        className="w-full p-3 text-left hover:bg-zinc-900/70 border-b border-zinc-800 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={card.image}
                            alt={card.name}
                            className="w-12 h-16 object-cover rounded"
                            loading="lazy"
                          />
                          <div>
                            <div className="font-medium text-white truncate" title={card.name}>{card.name}</div>
                            <div className="text-[11px] text-zinc-400">
                              {card.type} • {card.attribute} • Lv.{card.level}
                            </div>
                            <div className="text-[11px] text-zinc-500">ATK {card.atk} • DEF {card.def}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-zinc-400">
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
