import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api } from '@/utils/Api';
import { AuthManager } from '@/utils/auth';
import { useCardsSearch } from '@/contexts/CardsSearchContext';
import type { Card, CategorizedDeck } from "@/utils/ApiTypes";

interface DeckFormProps {
  mode: "create" | "edit";
  deckCode: string;
  validatedData: CategorizedDeck | null;
  existingDeck?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const DeckForm = ({ mode, deckCode, validatedData, existingDeck, onSuccess, onCancel }: DeckFormProps) => {
  const { t } = useTranslation();
  const { cards, searchCards } = useCardsSearch();
  const [name, setName] = useState('');
  const [coverId, setCoverId] = useState<number | null>(null);
  const [archetypes, setArchetypes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archetypeInput, setArchetypeInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [coverSearch, setCoverSearch] = useState('');
  const [showCoverDropdown, setShowCoverDropdown] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [availableArchetypes, setAvailableArchetypes] = useState<string[]>([]);
  const [showArchetypeDropdown, setShowArchetypeDropdown] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const archetypeDropdownRef = useRef<HTMLDivElement>(null);

  // Filter available cards based on deck's unique cards
  const availableCards = useMemo(() => {
    if (!validatedData?.uniqueCards || !cards.length) return [];
    
    return cards.filter(card => 
      validatedData.uniqueCards.includes(card.id)
    );
  }, [validatedData, cards]);

  // Filter cards for autocomplete
  const filteredCards = useMemo(() => {
    if (!coverSearch.trim()) return availableCards;
    
    const search = coverSearch.toLowerCase();
    return availableCards.filter(card => 
      card.name_en.toLowerCase().includes(search) ||
      card.id.toString().includes(search)
    );
  }, [coverSearch, availableCards]);

  // Fetch cards data when validatedData changes
  useEffect(() => {
    if (validatedData?.uniqueCards?.length) {
      searchCards({
        method: "POST",
        id: validatedData.uniqueCards,
      });
    }
  }, [validatedData?.uniqueCards]);

  // Initialize form fields when data is available
  useEffect(() => {
    if (!validatedData) return;

    if (mode === 'create') {
      setName(validatedData.primaryArchetype || '');
      setArchetypes(validatedData.archetypes?.map((a: any) => a.name) || []);
    } else if (mode === 'edit' && existingDeck) {
      setName(existingDeck.name);
      setCoverId(existingDeck.cover_id);
      setArchetypes(existingDeck.archetypes || []);
      setTags(existingDeck.tags || []);
      setIsPrivate(existingDeck.private);
    }
  }, [mode, validatedData, existingDeck]);

  // Set cover search name when cards are loaded
  useEffect(() => {
    if (mode === 'edit' && existingDeck?.cover_id && cards.length) {
      const card = cards.find(c => c.id === existingDeck.cover_id);
      if (card) setCoverSearch(card.name_en);
    }
  }, [mode, existingDeck?.cover_id, cards.length]);

  // Fetch available tags and archetypes on mount
  useEffect(() => {
    const fetchData = async () => {
      const response = await api.main.getDeckInfo();
      if (response.ok && response.data) {
        setAvailableTags(response.data.tags);
        setAvailableArchetypes(response.data.archetypes.map(a => a.archetype));
      }
    };
    fetchData();
  }, []);

  // Filter tags for autocomplete
  const filteredTags = useMemo(() => {
    if (!tagInput.trim()) return availableTags.filter(t => !tags.includes(t));
    
    const search = tagInput.toLowerCase();
    return availableTags.filter(tag => 
      tag.toLowerCase().includes(search) && !tags.includes(tag)
    );
  }, [tagInput, availableTags, tags]);

  // Filter archetypes for autocomplete
  const filteredArchetypes = useMemo(() => {
    if (!archetypeInput.trim()) return availableArchetypes.filter(a => !archetypes.includes(a));
    
    const search = archetypeInput.toLowerCase();
    return availableArchetypes.filter(archetype => 
      archetype.toLowerCase().includes(search) && !archetypes.includes(archetype)
    );
  }, [archetypeInput, availableArchetypes, archetypes]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
      if (archetypeDropdownRef.current && !archetypeDropdownRef.current.contains(event.target as Node)) {
        setShowArchetypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only allow adding valid archetypes from the list
  const handleAddArchetype = () => {
    const input = archetypeInput.trim();
    if (!input || archetypes.includes(input)) return;
    
    // Must be a valid archetype from the list (case-insensitive match)
    const validArchetype = availableArchetypes.find(
      a => a.toLowerCase() === input.toLowerCase()
    );
    
    if (validArchetype) {
      setArchetypes([...archetypes, validArchetype]);
      setArchetypeInput('');
      setShowArchetypeDropdown(false);
    }
  };

  const handleSelectArchetype = (archetype: string) => {
    if (!archetypes.includes(archetype)) {
      setArchetypes([...archetypes, archetype]);
    }
    setArchetypeInput('');
    setShowArchetypeDropdown(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setShowTagDropdown(false);
    }
  };

  const handleSelectTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
    setShowTagDropdown(false);
  };

  const handleRemoveArchetype = (archetype: string) => {
    setArchetypes(archetypes.filter(a => a !== archetype));
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const validateCoverId = () => {
    if (!coverId) return true;
    if (!validatedData?.uniqueCards) return false;
    return validatedData.uniqueCards.includes(coverId);
  };

  const handleSelectCard = (card: Card) => {
    setCoverId(card.id);
    setCoverSearch(card.name_en);
    setShowCoverDropdown(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('saved_decks.deck_name') + ' is required');
      return;
    }

    if (coverId && !validateCoverId()) {
      setError(t('saved_decks.cover_validation_error'));
      return;
    }

    const token = AuthManager.getToken();
    if (!token) {
      setError(t('saved_decks.login_required'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const deckData = {
        code: deckCode,
        name: name.trim(),
        cover_id: coverId || undefined,
        archetypes: archetypes.length > 0 ? archetypes : undefined,
        tags: tags.length > 0 ? tags : undefined,
        private: isPrivate,
      };

      let response;
      if (mode === 'create') {
        response = await api.main.createDeck(deckData, token);
      } else {
        response = await api.main.updateDeck(existingDeck.id.toString(), deckData, token);
      }

      if (response.ok) {
        // Refresh tags cache if new tags were added
        if (tags.length > 0) {
          api.main.getDeckInfo();
        }
        onSuccess();
      } else {
        setError(response.message || t('saved_decks.create_error'));
      }
    } catch (err) {
      console.error('Error saving deck:', err);
      setError(t('common.network_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-6 text-white">
        {mode === 'create' ? t('saved_decks.create_deck') : t('saved_decks.edit_deck')}
      </h2>

          {/* Deck Code (readonly) */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-400">
              {t('pdf_generator.deck_code')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={deckCode}
                readOnly
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-md text-gray-500 cursor-not-allowed"
              />
              <div className="absolute top-2 right-2 bg-zinc-800 px-2 py-1 rounded text-xs text-gray-500">
                {t('saved_decks.code_readonly')}
              </div>
            </div>
          </div>

          {/* Deck Name */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-400">
              {t('saved_decks.deck_name')} <span className="text-red-400">*</span>
              <span className="text-gray-500 text-xs ml-2">({name.length}/24)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                if (e.target.value.length <= 24) {
                  setName(e.target.value);
                }
              }}
              placeholder={t('saved_decks.deck_name_placeholder')}
              maxLength={24}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white placeholder-gray-600 transition-colors"
            />
          </div>

          {/* Cover Card */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-400">
              {t('saved_decks.cover_card')}
            </label>
            <div className="flex gap-3 items-start">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={coverSearch}
                  onChange={(e) => {
                    setCoverSearch(e.target.value);
                    setShowCoverDropdown(true);
                  }}
                  onFocus={() => setShowCoverDropdown(true)}
                  placeholder={t('saved_decks.cover_card_placeholder')}
                  className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white placeholder-gray-600 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('saved_decks.select_cover_from_deck')}
                </p>
                
                {/* Autocomplete Dropdown */}
                {showCoverDropdown && filteredCards.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md max-h-60 overflow-y-auto">
                    {filteredCards.slice(0, 10).map((card) => (
                      <div
                        key={card.id}
                        onClick={() => handleSelectCard(card)}
                        className="px-4 py-2 hover:bg-zinc-800 cursor-pointer flex items-center gap-3 transition-colors"
                      >
                        <img
                          src={`https://ygopro.online/assets/card-images/common/${card.id}.jpg`}
                          alt={card.name_en}
                          className="w-8 h-11 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/back.webp';
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-sm text-white">{card.name_en}</div>
                          <div className="text-xs text-gray-500">ID: {card.id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {coverId && (
                <div className="w-20 h-28 bg-black rounded-md overflow-hidden border border-zinc-800">
                  <img
                    src={`https://ygopro.online/assets/card-images/common/${coverId}.jpg`}
                    alt="Cover"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/back.webp';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Archetypes */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-400">
              {t('saved_decks.archetypes')}
            </label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 relative" ref={archetypeDropdownRef}>
                <input
                  type="text"
                  value={archetypeInput}
                  onChange={(e) => {
                    setArchetypeInput(e.target.value);
                    setShowArchetypeDropdown(true);
                  }}
                  onFocus={() => setShowArchetypeDropdown(true)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddArchetype()}
                  placeholder={t('saved_decks.add_archetype')}
                  className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white placeholder-gray-600 transition-colors"
                />
                
                {/* Archetypes Autocomplete Dropdown */}
                {showArchetypeDropdown && filteredArchetypes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md max-h-48 overflow-y-auto">
                    {filteredArchetypes.slice(0, 10).map((archetype) => (
                      <div
                        key={archetype}
                        onClick={() => handleSelectArchetype(archetype)}
                        className="px-4 py-2 hover:bg-zinc-800 cursor-pointer text-gray-300 transition-colors"
                      >
                        {archetype}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddArchetype}
                disabled={!archetypeInput.trim() || !availableArchetypes.some(a => a.toLowerCase() === archetypeInput.trim().toLowerCase())}
                className="px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-gray-600 rounded-md transition-colors"
              >
                <Icon icon="mdi:plus" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {archetypes.map((archetype, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-zinc-800 text-gray-300 rounded border border-zinc-700 flex items-center gap-2 text-sm"
                >
                  {archetype}
                  <button
                    onClick={() => handleRemoveArchetype(archetype)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <Icon icon="mdi:close" className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('saved_decks.select_from_list')}</p>
          </div>

          {/* Tags */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-400">
              {t('saved_decks.tags')}
            </label>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 relative" ref={tagDropdownRef}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagDropdown(true);
                  }}
                  onFocus={() => setShowTagDropdown(true)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder={t('saved_decks.add_tag')}
                  className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white placeholder-gray-600 transition-colors"
                />
                
                {/* Tags Autocomplete Dropdown */}
                {showTagDropdown && filteredTags.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md max-h-48 overflow-y-auto">
                    {filteredTags.slice(0, 10).map((tag) => (
                      <div
                        key={tag}
                        onClick={() => handleSelectTag(tag)}
                        className="px-4 py-2 hover:bg-zinc-800 cursor-pointer text-gray-300 transition-colors"
                      >
                        #{tag}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md transition-colors"
              >
                <Icon icon="mdi:plus" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-zinc-800 text-gray-400 rounded border border-zinc-700 flex items-center gap-2 text-sm"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <Icon icon="mdi:close" className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('saved_decks.enter_to_add')}</p>
          </div>

          {/* Private Toggle */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-5 h-5 rounded bg-black border-zinc-800 text-white focus:ring-2 focus:ring-zinc-700"
              />
              <div>
                <span className="font-semibold text-gray-300">{t('saved_decks.private')}</span>
                <p className="text-sm text-gray-500">{t('saved_decks.private_description')}</p>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-950/50 border border-red-900/50 rounded-md text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-md font-semibold transition-colors disabled:opacity-50"
            >
              {t('saved_decks.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              className="flex-1 px-6 py-3 bg-white hover:bg-gray-100 disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-gray-600 rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Icon icon="mdi:loading" className="animate-spin" />
                  {t('saved_decks.saving')}
                </>
              ) : (
                t('saved_decks.save')
              )}
        </button>
      </div>
    </div>
  );
};

export default DeckForm;
