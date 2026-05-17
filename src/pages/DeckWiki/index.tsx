import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api, type ArchetypeInfo } from '@/utils/Api';
import type { DeckWikiResponse, DeckWikiCard } from '@/utils/ApiTypes';
import DeckDisplay from '@/components/DeckDisplay';

const DeckWiki: React.FC = () => {
  const { t } = useTranslation();

  // Archetypes state
  const [availableArchetypes, setAvailableArchetypes] = useState<ArchetypeInfo[]>([]);
  const [loadingArchetypes, setLoadingArchetypes] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selection state
  const [selectedArchetypes, setSelectedArchetypes] = useState<ArchetypeInfo[]>([]);
  const [region, setRegion] = useState<17 | 33>(33);

  // Results state
  const [wikiData, setWikiData] = useState<DeckWikiResponse | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'playing' | 'against' | 'decklist'>('playing');
  const [activeDeckSection, setActiveDeckSection] = useState<'main' | 'side' | 'extra'>('main');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch available archetypes on mount
  useEffect(() => {
    const fetchArchetypes = async () => {
      try {
        setLoadingArchetypes(true);
        const response = await api.main.getDeckInfo();
        if (response.ok && response.data?.archetypes) {
          setAvailableArchetypes(response.data.archetypes);
        }
      } catch (err) {
        console.error('Error fetching archetypes:', err);
      } finally {
        setLoadingArchetypes(false);
      }
    };
    fetchArchetypes();
  }, []);

  // Filter archetypes based on search
  const filteredArchetypes = availableArchetypes.filter(arch =>
    arch.archetype.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle archetype selection (max 3)
  const toggleArchetype = (arch: ArchetypeInfo) => {
    setSelectedArchetypes(prev => {
      const exists = prev.some(a => a.archetype === arch.archetype);
      if (exists) {
        return prev.filter(a => a.archetype !== arch.archetype);
      } else if (prev.length < 3) {
        return [...prev, arch];
      }
      return prev;
    });
  };

  // Remove archetype
  const removeArchetype = (archetype: string) => {
    setSelectedArchetypes(prev => prev.filter(a => a.archetype !== archetype));
  };

  // Handle search
  const handleSearch = async () => {
    if (selectedArchetypes.length === 0) return;

    try {
      setLoadingResults(true);
      setError(null);
      const archetypeNames = selectedArchetypes.map(a => a.archetype);
      const response = await api.main.getMatchupStats(archetypeNames, region);

      if (response.ok && response.data) {
        setWikiData(response.data);
      } else {
        setError(response.message || t('deck_wiki.error_loading'));
      }
    } catch (err) {
      console.error('Error fetching matchup data:', err);
      setError(t('deck_wiki.error_loading'));
    } finally {
      setLoadingResults(false);
    }
  };

  // Get win rate color
  const getWinRateColor = (winRate: number): string => {
    if (winRate >= 60) return 'text-green-400';
    if (winRate >= 50) return 'text-blue-400';
    if (winRate >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Render card with all stats
  const renderCard = (card: DeckWikiCard) => (
    <div key={card.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <img
          src={`https://ygopro.online/assets/card-arts/${card.id}.jpg`}
          alt={card.name}
          className="w-16 h-16 rounded object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-card.png';
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{card.name}</h3>
          <p className="text-xs text-zinc-500">ID: {card.id}</p>
          <div className="mt-1">
            <span className="text-xs font-medium text-zinc-300">
              {card.frequency.toFixed(1)}% {t('deck_wiki.frequency')}
            </span>
            <span className="text-xs text-zinc-600 ml-2">({card.decks.toLocaleString()} decks)</span>
          </div>
        </div>
      </div>

      {/* Copies distribution */}
      <div className="space-y-1 mb-3">
        {[3, 2, 1].map(num => {
          const copyData = card.copies[num as 1 | 2 | 3];
          return (
            <div key={num} className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 w-8">{num}x:</span>
              <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all"
                  style={{ width: `${copyData.percent}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 w-12 text-right">{copyData.percent.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>

      {/* Win rates */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-black rounded p-2">
          <div className="text-xs text-zinc-500 mb-1">{t('deck_wiki.win_rate')}</div>
          <div className={`text-sm font-bold ${getWinRateColor(card.winRate)}`}>
            {card.winRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-black rounded p-2">
          <div className="text-xs text-zinc-500 mb-1">{t('deck_wiki.post_side')}</div>
          <div className={`text-sm font-bold ${getWinRateColor(card.winRatePostSide)}`}>
            {card.winRatePostSide.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-zinc-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon icon="mdi:cards" className="text-3xl text-zinc-400" />
            <h1 className="text-3xl font-bold text-white">
              {t("deck_wiki.title")}
            </h1>
          </div>
          <p className="text-sm text-zinc-500">{t("deck_wiki.subtitle")}</p>
        </div>

        {/* Selection Panel */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 mb-6">
          {/* Selected Archetypes */}
          {selectedArchetypes.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  {t("deck_wiki.selected_archetypes")}
                </h3>
                <span className="text-xs text-zinc-600">
                  {selectedArchetypes.length}/3
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedArchetypes.map((arch) => (
                  <div
                    key={arch.archetype}
                    className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5"
                  >
                    <img
                      src={`https://ygopro.online/assets/card-arts/${arch.ids[0]}.jpg`}
                      alt={arch.archetype}
                      className="w-6 h-6 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/placeholder-card.png";
                      }}
                    />
                    <span className="text-xs font-medium text-white">
                      {arch.archetype}
                    </span>
                    <button
                      onClick={() => removeArchetype(arch.archetype)}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <Icon icon="mdi:close" className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archetype Search Dropdown */}
          <div className="mb-4 relative" ref={dropdownRef}>
            <div className="relative">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={t("deck_wiki.search_archetypes")}
                disabled={selectedArchetypes.length >= 3}
                className="w-full pl-10 pr-4 py-2.5 bg-black border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Dropdown with images */}
            {showDropdown &&
              !loadingArchetypes &&
              filteredArchetypes.length > 0 &&
              selectedArchetypes.length < 3 && (
                <div className="absolute z-20 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md max-h-60 overflow-y-auto scrollbar-thin">
                  {filteredArchetypes
                    .filter(
                      (arch) =>
                        !selectedArchetypes.some(
                          (s) => s.archetype === arch.archetype
                        )
                    )
                    .slice(0, 15)
                    .map((arch) => (
                      <div
                        key={arch.archetype}
                        onClick={() => {
                          toggleArchetype(arch);
                          setSearchTerm("");
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 cursor-pointer transition-colors"
                      >
                        <img
                          src={`https://ygopro.online/assets/card-arts/${arch.ids[0]}.jpg`}
                          alt={arch.archetype}
                          className="w-8 h-8 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder-card.png";
                          }}
                        />
                        <span className="text-xs text-gray-300">
                          {arch.archetype}
                        </span>
                      </div>
                    ))}
                </div>
              )}
          </div>

          {/* Region Toggle & Search Button */}
          <div className="flex items-center gap-3">
            <div className="inline-flex bg-black rounded-md p-0.5 border border-zinc-800">
              <button
                onClick={() => setRegion(33)}
                className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${
                  region === 33
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                TCG
              </button>
              <button
                onClick={() => setRegion(17)}
                className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${
                  region === 17
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Genesys
              </button>
            </div>

            <button
              onClick={handleSearch}
              disabled={selectedArchetypes.length === 0 || loadingResults}
              className="flex-1 px-5 py-2 bg-white text-black text-sm font-semibold rounded-md hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loadingResults ? (
                <>
                  <Icon icon="mdi:loading" className="animate-spin" />
                  {t("deck_wiki.searching")}
                </>
              ) : (
                <>
                  <Icon icon="mdi:magnify" />
                  {t("deck_wiki.search")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-3 mb-6 flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="text-red-400 shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {/* Results */}
        {wikiData && (
          <div className="space-y-4">
            {/* Meta Info & Bo3 Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-xl font-bold text-white">
                  {wikiData.meta.duelsAnalyzed.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500">
                  {t("deck_wiki.duels_analyzed")}
                </div>
              </div>
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-xl font-bold text-white">
                  {wikiData.meta.targetDecks.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500">
                  {t("deck_wiki.target_decks")}
                </div>
              </div>
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-xl font-bold text-white">
                  {wikiData.meta.opponentDecks.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500">
                  {t("deck_wiki.opponent_decks")}
                </div>
              </div>
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-xl font-bold text-white">
                  {wikiData.bo3.wentToGame2.percent.toFixed(1)}%
                </div>
                <div className="text-xs text-zinc-500">
                  {t("deck_wiki.went_to_g2")}
                </div>
              </div>
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
                <div className="text-xl font-bold text-white">
                  {wikiData.bo3.wentToGame3.percent.toFixed(1)}%
                </div>
                <div className="text-xs text-zinc-500">
                  {t("deck_wiki.went_to_g3")}
                </div>
              </div>
            </div>

            {/* Main Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800">
              <button
                onClick={() => setActiveTab("playing")}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === "playing"
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t("deck_wiki.playing")}
                {activeTab === "playing" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("against")}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === "against"
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t("deck_wiki.against")}
                {activeTab === "against" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("decklist")}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === "decklist"
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t("deck_wiki.decklist")}
                {activeTab === "decklist" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab !== "decklist" && (
              <>
                {/* Deck Section Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveDeckSection("main")}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      activeDeckSection === "main"
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {t("deck_wiki.main_deck")}
                  </button>
                  <button
                    onClick={() => setActiveDeckSection("side")}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      activeDeckSection === "side"
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {t("deck_wiki.side_deck")}
                  </button>
                  <button
                    onClick={() => setActiveDeckSection("extra")}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      activeDeckSection === "extra"
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {t("deck_wiki.extra_deck")}
                  </button>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {wikiData[activeTab][activeDeckSection].map((card) =>
                    renderCard(card)
                  )}
                </div>

                {wikiData[activeTab][activeDeckSection].length === 0 && (
                  <div className="text-center py-12 text-zinc-500 text-sm">
                    {t("deck_wiki.no_cards")}
                  </div>
                )}
              </>
            )}

            {/* Decklist Tab */}
            {activeTab === "decklist" && <DeckDisplay deck={wikiData.decklist} />}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:clock-outline" />
                <span>
                  {new Date(wikiData.meta.updatedAt).toLocaleString()}
                </span>
                {wikiData.cached && (
                  <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">
                    {t("deck_wiki.cached")}
                  </span>
                )}
              </div>
              <div>
                <span>
                  {wikiData.meta.archetype} • {wikiData.meta.processingMs}ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!wikiData && !loadingResults && !error && (
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-12 text-center">
            <Icon
              icon="mdi:cards"
              className="text-5xl text-zinc-600 mx-auto mb-4"
            />
            <h3 className="text-base font-semibold text-zinc-300 mb-2">
              {t("deck_wiki.empty_title")}
            </h3>
            <p className="text-xs text-zinc-500">
              {t("deck_wiki.empty_subtitle")}
            </p>
          </div>
        )}

        {/* Loading Results */}
        {loadingResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {new Array(5).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 rounded-lg border border-zinc-800 p-3"
                >
                  <div className="h-6 w-16 bg-zinc-800 rounded animate-pulse mb-2" />
                  <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {new Array(12).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 h-64 animate-pulse"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckWiki;
