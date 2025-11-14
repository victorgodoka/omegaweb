import React, { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { api } from '../../utils/Api';
import { useCache } from '@/contexts/CacheContext';
import { useTranslation } from 'react-i18next';

const KonamiDecklistConverter: React.FC = () => {
  const { t } = useTranslation();
  const [deckName, setDeckName] = useState('Tournament Deck');
  const [ydkFile, setYdkFile] = useState<File | null>(null);
  const [decklistText, setDecklistText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ydk' | 'text'>('ydk');
  const { cardStats } = useCache();

  // Convert deck data to Konami format
  const convertToKonamiFormat = useCallback((deckData: { main: number[], extra: number[], side: number[] }, cardNameMap?: { [id: number]: string }) => {
    if (!cardStats) {
      console.error('Card stats not loaded');
      return null;
    }

    const konamiDeck = {
      Name: deckName,
      Monsters: [] as { CardDatabaseId: number, Quantity: number }[],
      Spells: [] as { CardDatabaseId: number, Quantity: number }[],
      Traps: [] as { CardDatabaseId: number, Quantity: number }[],
      Side: [] as { CardDatabaseId: number, Quantity: number }[],
      Extra: [] as { CardDatabaseId: number, Quantity: number }[]
    };

    // Fallback function to search by card name
    const findCardByName = (cardName: string) => {
      return cardStats.find(c => 
        c.name.toLowerCase() === cardName.toLowerCase() ||
        c.name.toLowerCase().includes(cardName.toLowerCase()) ||
        cardName.toLowerCase().includes(c.name.toLowerCase())
      );
    };

    // Helper function to process cards from a deck section
    const processCards = (cardIds: number[], targetSection: 'main' | 'side' | 'extra') => {
      // Count card quantities
      const cardCounts: { [id: number]: number } = {};
      cardIds.forEach(id => {
        cardCounts[id] = (cardCounts[id] || 0) + 1;
      });

      // Process each unique card
      Object.entries(cardCounts).forEach(([cardIdStr, quantity]) => {
        const cardId = parseInt(cardIdStr);
        
        // Find card in cardStats by ID
        let card = cardStats.find(c => c.id === cardId);
        
        // If not found by ID, try fallback search by name
        if (!card && cardNameMap && cardNameMap[cardId]) {
          const cardName = cardNameMap[cardId];
          card = findCardByName(cardName);
          if (card) {
            console.log(`Fallback success: Found card "${cardName}" by name search (Original ID: ${cardId}, Found ID: ${card.id})`);
          }
        }
        
        if (!card) {
          const cardName = cardNameMap?.[cardId] || 'Unknown';
          console.warn(`Card with ID ${cardId} (Name: ${cardName}) not found in cardStats even with fallback search`);
          return;
        }

        // Get Konami ID from misc_info
        const konamiId = card.misc_info?.[0]?.konami_id;
        if (!konamiId) {
          console.warn(`Card ${card.name} (ID: ${card.id}) has no Konami ID`);
          return;
        }

        const cardEntry = { CardDatabaseId: konamiId, Quantity: quantity };

        if (targetSection === 'side') {
          konamiDeck.Side.push(cardEntry);
        } else if (targetSection === 'extra') {
          konamiDeck.Extra.push(cardEntry);
        } else {
          // Main deck - categorize by card type
          if (card.frameType === 'spell') {
            konamiDeck.Spells.push(cardEntry);
          } else if (card.frameType === 'trap') {
            konamiDeck.Traps.push(cardEntry);
          } else {
            // Everything else is a monster
            konamiDeck.Monsters.push(cardEntry);
          }
        }

        console.log(`Processed: ${card.name} (YGO ID: ${card.id}, Konami ID: ${konamiId}, Type: ${card.frameType}, Quantity: ${quantity})`);
      });
    };

    // Process each deck section
    console.log('--- Processing Main Deck ---');
    processCards(deckData.main, 'main');
    
    console.log('--- Processing Extra Deck ---');
    processCards(deckData.extra, 'extra');
    
    console.log('--- Processing Side Deck ---');
    processCards(deckData.side, 'side');

    return konamiDeck;
  }, [cardStats, deckName]);

  // Parse YDK file content
  const parseYDKFile = useCallback((content: string) => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const deck: { main: number[], extra: number[], side: number[] } = { main: [], extra: [], side: [] };
    let currentSection: 'main' | 'extra' | 'side' | '' = '';

    for (const line of lines) {
      if (line.startsWith('#') && !line.includes('main') && !line.includes('extra') && !line.includes('side')) {
        continue; // Skip comments and metadata
      }

      if (line === '#main') {
        currentSection = 'main';
        continue;
      } else if (line === '#extra') {
        currentSection = 'extra';
        continue;
      } else if (line === '!side') {
        currentSection = 'side';
        continue;
      }

      // Parse card ID
      const cardId = parseInt(line);
      if (!isNaN(cardId) && (currentSection === 'main' || currentSection === 'extra' || currentSection === 'side')) {
        deck[currentSection].push(cardId);
      }
    }

    return deck;
  }, []);

  // Handle YDK file selection
  const handleYDKFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setYdkFile(file);
    setDecklistText(''); // Reset text input
    setActiveTab('ydk'); // Switch to YDK tab

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const parsedDeck = parseYDKFile(content);
          console.log('Parsed YDK file:', parsedDeck);

          // Convert to Konami format
          const konamiFormat = convertToKonamiFormat(parsedDeck);
          if (konamiFormat) {
            console.log('Konami Format Result:', JSON.stringify(konamiFormat, null, 2));
          }
          
        } catch (error) {
          console.error('Failed to parse YDK file:', error);
        }
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  }, [parseYDKFile, convertToKonamiFormat]);

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
        const parsedDeck = parseYDKFile(fileContent);
        
        // Step 1: Encode the deck to get a deck code
        console.log('Step 1: Encoding YDK deck...');
        const encodeResponse = await api.main.encodeDeck(parsedDeck);
        
        if (encodeResponse.ok && encodeResponse.success && encodeResponse.data?.code) {
          // Step 2: Decode the deck code to get full card information with names
          console.log('Step 2: Decoding to get full card data...');
          const decodeResponse = await api.main.decodeDeck(encodeResponse.data.code);
          
          if (decodeResponse.ok && decodeResponse.success) {
            // Convert API response to our deck format with name mapping
            const deckData = {
              main: [] as number[],
              extra: [] as number[],
              side: [] as number[]
            };

            // Create card name mapping for fallback search
            const cardNameMap: { [id: number]: string } = {};

            // Extract card IDs from API response and build name map
            if (decodeResponse.data.mainDeck) {
              decodeResponse.data.mainDeck.forEach((cardData: any) => {
                cardNameMap[cardData.id] = cardData.name;
                for (let i = 0; i < cardData.qtd; i++) {
                  deckData.main.push(cardData.id);
                }
              });
            }
            if (decodeResponse.data.extraDeck) {
              decodeResponse.data.extraDeck.forEach((cardData: any) => {
                cardNameMap[cardData.id] = cardData.name;
                for (let i = 0; i < cardData.qtd; i++) {
                  deckData.extra.push(cardData.id);
                }
              });
            }
            if (decodeResponse.data.sideDeck) {
              decodeResponse.data.sideDeck.forEach((cardData: any) => {
                cardNameMap[cardData.id] = cardData.name;
                for (let i = 0; i < cardData.qtd; i++) {
                  deckData.side.push(cardData.id);
                }
              });
            }

            console.log('YDK processed with full card data including alternate arts');
            konamiFormat = convertToKonamiFormat(deckData, cardNameMap);
          } else {
            console.error('Failed to decode YDK deck:', decodeResponse.message);
            return;
          }
        } else {
          console.error('Failed to encode YDK deck:', encodeResponse.message);
          return;
        }
        
      } else if (activeTab === 'text' && decklistText.trim()) {
        console.log('Processing deck text input');
        
        const response = await api.main.decodeDeck(decklistText.trim());
        
        if (response.ok && response.success) {
          // Convert API response to our deck format
          const deckData = {
            main: [] as number[],
            extra: [] as number[],
            side: [] as number[]
          };

          // Create card name mapping for fallback search
          const cardNameMap: { [id: number]: string } = {};

          // Extract card IDs from API response and build name map
          if (response.data.mainDeck) {
            response.data.mainDeck.forEach((cardData: any) => {
              cardNameMap[cardData.id] = cardData.name;
              for (let i = 0; i < cardData.qtd; i++) {
                deckData.main.push(cardData.id);
              }
            });
          }
          if (response.data.extraDeck) {
            response.data.extraDeck.forEach((cardData: any) => {
              cardNameMap[cardData.id] = cardData.name;
              for (let i = 0; i < cardData.qtd; i++) {
                deckData.extra.push(cardData.id);
              }
            });
          }
          if (response.data.sideDeck) {
            response.data.sideDeck.forEach((cardData: any) => {
              cardNameMap[cardData.id] = cardData.name;
              for (let i = 0; i < cardData.qtd; i++) {
                deckData.side.push(cardData.id);
              }
            });
          }

          konamiFormat = convertToKonamiFormat(deckData, cardNameMap);
        } else {
          console.error('Text import failed:', response.message || response.data?.message);
          return;
        }
      } else {
        console.warn('No valid input for active tab');
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
    <div className="mt-20 min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header Section */}
      <div className="bg-zinc-900 border-b border-zinc-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              {t('konami_converter.title')}
            </h1>
            <p className="text-zinc-300 text-lg leading-relaxed max-w-3xl mx-auto">
              {t('konami_converter.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800/50 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Icon icon="mdi:file-document-edit" className="mr-2 text-purple-400" />
              {t('konami_converter.section_title')}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">{t('konami_converter.section_subtitle')}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Deck Name Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Icon icon="mdi:tag" className="inline mr-1" />
                {t('konami_converter.deck_name_label')}
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('konami_converter.deck_name_placeholder')}
              />
            </div>

            {/* Input Method Tabs */}
            <div>
              <div className="flex border-b border-zinc-700 mb-6">
                <button
                  onClick={() => setActiveTab('ydk')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'ydk'
                      ? 'border-purple-400 text-purple-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  <Icon icon="mdi:file-upload" className="inline mr-2" />
                  {t('konami_converter.tab_ydk')}
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'text'
                      ? 'border-purple-400 text-purple-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  <Icon icon="mdi:text-box" className="inline mr-2" />
                  {t('konami_converter.tab_text')}
                </button>
              </div>

              {/* YDK File Tab Content */}
              {activeTab === 'ydk' && (
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
                        <Icon icon="mdi:file-upload" className="text-2xl text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {ydkFile ? ydkFile.name : t('konami_converter.ydk_button_default')}
                        </p>
                        <p className="text-zinc-400 text-sm mt-1">
                          {t('konami_converter.ydk_help')}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Text Input Tab Content */}
              {activeTab === 'text' && (
                <div>
                  <textarea
                    value={decklistText}
                    onChange={(e) => handleTextInputChange(e.target.value)}
                    placeholder={t('konami_converter.text_placeholder')}
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
                  (activeTab === 'ydk' && !ydkFile) || 
                  (activeTab === 'text' && !decklistText.trim())
                }
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {isProcessing ? (
                  <>
                    <Icon icon="mdi:loading" className="text-lg animate-spin" />
                    {t('konami_converter.processing')}
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:download" className="text-lg" />
                    {t('konami_converter.button_convert')}
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
