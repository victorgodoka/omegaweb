import React, { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { api } from '../../utils/Api';
import { useTranslation } from 'react-i18next';
import type { Card } from '@/utils/ApiTypes';
import { useCardsSearch } from '@/contexts/CardsSearchContext';
import { isExtraDeckCard, isWhatType } from '@/utils/Functions';
import { useToast } from '@/contexts/ToastContext';

interface ConvertedData {
  id: number;
  name: string;
  konami_id: number;
  zone: "Monsters" | "Spells" | "Traps" | "Side" | "Extra";
  qtd: number;
}

interface YDKDeck {
  main: number[];
  extra: number[];
  side: number[];
}

interface ParsedYDKDeck {
  deck: YDKDeck;
  uniqueIds: number[];
}

const KonamiDecklistConverter: React.FC = () => {
  const { t } = useTranslation();
  const [deckName, setDeckName] = useState('Tournament Deck');
  const [ydkFile, setYdkFile] = useState<File | null>(null);
  const [decklistText, setDecklistText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ydk' | 'text'>('ydk');
  const { cards, searchCards, isLoading } = useCardsSearch();
  const { showWarning } = useToast();

  const convertData = (
    arr: number[],
    uniqueCardsData: Card[],
    side?: boolean
  ): ConvertedData[] => {
    const cardCounts = arr.reduce((acc, cardId) => {
      acc[cardId] = (acc[cardId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Convert to TournamentDeckData format
    return Object.entries(cardCounts).map(([cardId, qtd]) => {
      const card = uniqueCardsData.find(
        (c) => c.canonicalId === parseInt(cardId) || c.id === parseInt(cardId)
      );

      if (!card || !card.konami_id) {
        showWarning(`Card with the ID: ${cardId} was not found. Make sure your deck is up to date or that you're not using any Beta or Unreleased cards.`);
        throw new Error(`Card ${cardId} not found`);
      };

      return {
        id: parseInt(cardId),
        name: card.name_en,
        konami_id: card.konami_id,
        zone: side
          ? "Side"
          : isExtraDeckCard(card)
            ? "Extra"
            : isWhatType(card, "Spell")
              ? "Spells"
              : isWhatType(card, "Trap")
                ? "Traps"
                : "Monsters",
        qtd,
      };
    });
  };

  // Convert deck data to Konami format
  const convertToKonamiFormat = useCallback(
    (cards: ConvertedData[]) => {
      const konamiDeck = {
        Name: deckName,
        Monsters: [] as { CardDatabaseId: number; Quantity: number }[],
        Spells: [] as { CardDatabaseId: number; Quantity: number }[],
        Traps: [] as { CardDatabaseId: number; Quantity: number }[],
        Side: [] as { CardDatabaseId: number; Quantity: number }[],
        Extra: [] as { CardDatabaseId: number; Quantity: number }[],
      };

      cards.forEach(card => {
        const { konami_id: CardDatabaseId, qtd: Quantity, zone } = card;
        konamiDeck[zone].push({ CardDatabaseId, Quantity });
      });

      return konamiDeck;
    },
    [cards]
  );

  // Parse YDK file content
  const parseYDKFile = useCallback((content: string): ParsedYDKDeck => {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    const deck: { main: number[]; extra: number[]; side: number[] } = {
      main: [],
      extra: [],
      side: [],
    };
    let currentSection: "main" | "extra" | "side" | "" = "";
    const uniqueIds = [];
    for (const line of lines) {
      if (
        line.startsWith("#") &&
        !line.includes("main") &&
        !line.includes("extra") &&
        !line.includes("side")
      ) {
        continue; // Skip comments and metadata
      }

      if (line === "#main" || line === "#main & extra") {
        currentSection = "main";
        continue;
      } else if (line === "#extra") {
        currentSection = "extra";
        continue;
      } else if (line === "!side") {
        currentSection = "side";
        continue;
      }

      // Parse card ID
      const cardId = parseInt(line);
      if (
        !isNaN(cardId) &&
        (currentSection === "main" ||
          currentSection === "extra" ||
          currentSection === "side")
      ) {
        deck[currentSection].push(cardId);
        uniqueIds.push(cardId);
      }
    }

    return { deck, uniqueIds };
  }, []);

  // Handle YDK file selection
  const handleYDKFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setYdkFile(file);
    setDecklistText(''); // Reset text input
    setActiveTab('ydk'); // Switch to YDK tab
    event.target.value = '';
  }, []);

  // Handle text input changes
  const handleTextInputChange = useCallback((value: string) => {
    setDecklistText(value);
    if (value.trim()) {
      setYdkFile(null); // Reset YDK file
      setActiveTab('text'); // Switch to text tab
    } else {
      setActiveTab('ydk'); // Switch to YDK tab
    }
  }, []);


  // Normalize deck name for filename
  const normalizeDeckName = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim() || 'deck'; // Fallback to 'deck' if empty
  }, []);

  // Handle download - only considers active tab
  const handleDownload = useCallback(async () => {
    console.log('Processing deck for Konami JSON conversion...');
    console.log('Deck name:', deckName);
    console.log('Active tab:', activeTab);

    setIsProcessing(true);
    let konamiFormat = null;

    try {
      if (activeTab === 'ydk' && ydkFile) {
        console.log('Processing YDK file:', ydkFile.name);

        // Re-read and process the YDK file
        const reader = new FileReader();
        const fileContent = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
              resolve(content);
            } else {
              reject(new Error('Failed to read file content'));
            }
          };
          reader.onerror = () => reject(new Error('File read error'));
          reader.readAsText(ydkFile);
        });

        // Parse YDK file to get card IDs
        const { deck: { main, side, extra }, uniqueIds } = parseYDKFile(fileContent);
        const cardLib = await searchCards({
          method: 'POST',
          id: uniqueIds
        })
        console.log(main, side, extra);
        if (cardLib && cardLib.length) {
          const convertedMain = convertData([...main, ...extra], cardLib);
          const convertedSide = convertData(side, cardLib, true);

          konamiFormat = convertToKonamiFormat([
            ...convertedMain,
            ...convertedSide,
          ]);

          console.log(konamiFormat);
        }

      } else if (activeTab === 'text' && decklistText.trim()) {
        console.log('Processing deck text input');
        const response = await api.main.decodeDeck(decklistText.trim(), true);
        if (response.ok && response.data && response.data.uniqueCardsData) {
          const {
            fullDeck: { main, side },
            uniqueCardsData,
          } = response.data;

          const convertedMain = convertData(main, uniqueCardsData);
          const convertedSide = convertData(side, uniqueCardsData, true);

          const konamiFormat = convertToKonamiFormat([
            ...convertedMain,
            ...convertedSide,
          ]);

          console.log(konamiFormat);
        }
      } else {
        console.warn('No valid input for active tab');
        setIsProcessing(false);
        return;
      }

      // Download the JSON file if conversion was successful
      if (konamiFormat) {
        const normalizedName = normalizeDeckName(deckName);
        const jsonContent = JSON.stringify(konamiFormat, null, 2);

        // Create and download file
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${normalizedName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Konami JSON file "${normalizedName}.json" downloaded successfully!`);
      } else {
        console.error('Failed to convert deck to Konami format');
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [deckName, activeTab, ydkFile, decklistText, parseYDKFile, convertToKonamiFormat, normalizeDeckName]);

  return (
    <div className="mt-20">
      {/* Header Section */}
      <div className="border-b border-zinc-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              {t("konami_converter.title")}
            </h1>
            <p className="text-zinc-300 text-lg leading-relaxed max-w-3xl mx-auto">
              {t("konami_converter.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800/50 bg-linear-to-r from-zinc-800/50 to-zinc-700/30">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Icon
                icon="mdi:file-document-edit"
                className="mr-2 text-purple-400"
              />
              {t("konami_converter.section_title")}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {t("konami_converter.section_subtitle")}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Deck Name Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Icon icon="mdi:tag" className="inline mr-1" />
                {t("konami_converter.deck_name_label")}
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t("konami_converter.deck_name_placeholder")}
              />
            </div>

            {/* Input Method Tabs */}
            <div>
              <div className="flex border-b border-zinc-700 mb-6">
                <button
                  onClick={() => setActiveTab("ydk")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "ydk"
                    ? "border-purple-400 text-purple-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-300"
                    }`}
                >
                  <Icon icon="mdi:file-upload" className="inline mr-2" />
                  {t("konami_converter.tab_ydk")}
                </button>
                <button
                  onClick={() => setActiveTab("text")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "text"
                    ? "border-purple-400 text-purple-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-300"
                    }`}
                >
                  <Icon icon="mdi:text-box" className="inline mr-2" />
                  {t("konami_converter.tab_text")}
                </button>
              </div>

              {/* YDK File Tab Content */}
              {activeTab === "ydk" && (
                <div>
                  <div className="border-2 border-dashed border-zinc-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                    <input
                      type="file"
                      accept=".ydk"
                      onChange={handleYDKFileUpload}
                      className="hidden"
                      id="ydk-file-input"
                    />
                    <label
                      htmlFor="ydk-file-input"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <Icon
                          icon="mdi:file-upload"
                          className="text-2xl text-white"
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {ydkFile
                            ? ydkFile.name
                            : t("konami_converter.ydk_button_default")}
                        </p>
                        <p className="text-zinc-400 text-sm mt-1">
                          {t("konami_converter.ydk_help")}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Text Input Tab Content */}
              {activeTab === "text" && (
                <div>
                  <textarea
                    value={decklistText}
                    onChange={(e) => handleTextInputChange(e.target.value)}
                    placeholder={t("konami_converter.text_placeholder")}
                    className="w-full h-20 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent scrollbar-thin"
                  />
                </div>
              )}
            </div>

            {/* Convert & Download Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleDownload}
                disabled={
                  isProcessing ||
                  (activeTab === "ydk" && !ydkFile) ||
                  (activeTab === "text" && !decklistText.trim())
                }
                className="px-8 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {isProcessing || isLoading ? (
                  <>
                    <Icon icon="mdi:loading" className="text-lg animate-spin" />
                    {t("konami_converter.processing")}
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:download" className="text-lg" />
                    {t("konami_converter.button_convert")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KonamiDecklistConverter;
