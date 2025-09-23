import React, { useState, useCallback, lazy, Suspense } from 'react';
import { Icon } from '@iconify/react';
import { useToast } from '@/contexts/ToastContext';
import type { CardData, CardType, CardAttribute, SpellType, TrapType, MonsterType } from './types';

// Lazy load heavy components
const CardPreview = lazy(() => import('./components/CardPreview'));
const FormField = lazy(() => import('./components/FormField'));
const ImageUpload = lazy(() => import('./components/ImageUpload'));

const CardMaker: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [cardData, setCardData] = useState<CardData>({
    name: '',
    type: 'Monster',
    attribute: 'LIGHT',
    level: 1,
    atk: 0,
    def: 0,
    monsterType: 'Warrior',
    spellType: 'Normal',
    trapType: 'Normal',
    description: '',
    artworkUrl: '',
    artworkFile: null,
    pendulumScale: null,
    linkRating: null,
    linkArrows: []
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof CardData, value: any) => {
    setCardData((prev: CardData) => ({ ...prev, [field]: value }));
  }, []);

  // Handle artwork URL change
  const handleArtworkUrlChange = useCallback((url: string) => {
    setCardData((prev: CardData) => ({ 
      ...prev, 
      artworkUrl: url,
      artworkFile: null // Clear file when URL is set
    }));
  }, []);

  // Handle artwork file upload
  const handleArtworkFileChange = useCallback((file: File | null) => {
    setCardData((prev: CardData) => ({ 
      ...prev, 
      artworkFile: file,
      artworkUrl: file ? '' : prev.artworkUrl // Clear URL when file is set
    }));
  }, []);

  // Generate card image (placeholder for now)
  const handleGenerateCard = useCallback(async () => {
    if (!cardData.name.trim()) {
      showError('Card name is required');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate card generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Card generated successfully!');
    } catch (error) {
      showError('Failed to generate card');
    } finally {
      setIsGenerating(false);
    }
  }, [cardData.name, showSuccess, showError]);

  // Reset form
  const handleReset = useCallback(() => {
    setCardData({
      name: '',
      type: 'Monster',
      attribute: 'LIGHT',
      level: 1,
      atk: 0,
      def: 0,
      monsterType: 'Warrior',
      spellType: 'Normal',
      trapType: 'Normal',
      description: '',
      artworkUrl: '',
      artworkFile: null,
      pendulumScale: null,
      linkRating: null,
      linkArrows: []
    });
    showSuccess('Form reset successfully');
  }, [showSuccess]);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 mt-12">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-100 mb-4 flex items-center justify-center gap-3">
            <Icon icon="mdi:cards" className="text-orange-400" />
            Yu-Gi-Oh! Card Maker
          </h1>
          <p className="text-zinc-400 text-lg">
            Create custom Yu-Gi-Oh! cards with live preview
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
              <h2 className="text-xl font-semibold text-zinc-200 mb-6 flex items-center gap-2">
                <Icon icon="mdi:information" className="text-blue-400" />
                Basic Information
              </h2>

              <div className="space-y-4">
                <Suspense fallback={<div className="animate-pulse h-10 bg-zinc-700 rounded"></div>}>
                  <FormField
                    label="Card Name"
                    value={cardData.name}
                    onChange={(value) => handleInputChange('name', value)}
                    placeholder="Enter card name"
                    required
                  />
                </Suspense>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Card Type *
                    </label>
                    <select
                      value={cardData.type}
                      onChange={(e) => handleInputChange('type', e.target.value as CardType)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="Monster">Monster</option>
                      <option value="Spell">Spell</option>
                      <option value="Trap">Trap</option>
                    </select>
                  </div>

                  {cardData.type === 'Monster' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Attribute *
                      </label>
                      <select
                        value={cardData.attribute}
                        onChange={(e) => handleInputChange('attribute', e.target.value as CardAttribute)}
                        className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="LIGHT">LIGHT</option>
                        <option value="DARK">DARK</option>
                        <option value="FIRE">FIRE</option>
                        <option value="WATER">WATER</option>
                        <option value="EARTH">EARTH</option>
                        <option value="WIND">WIND</option>
                        <option value="DIVINE">DIVINE</option>
                      </select>
                    </div>
                  )}

                  {cardData.type === 'Spell' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Spell Type *
                      </label>
                      <select
                        value={cardData.spellType}
                        onChange={(e) => handleInputChange('spellType', e.target.value as SpellType)}
                        className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Quick-Play">Quick-Play</option>
                        <option value="Continuous">Continuous</option>
                        <option value="Ritual">Ritual</option>
                      </select>
                    </div>
                  )}

                  {cardData.type === 'Trap' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Trap Type *
                      </label>
                      <select
                        value={cardData.trapType}
                        onChange={(e) => handleInputChange('trapType', e.target.value as TrapType)}
                        className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Continuous">Continuous</option>
                        <option value="Counter">Counter</option>
                      </select>
                    </div>
                  )}
                </div>

                <Suspense fallback={<div className="animate-pulse h-32 bg-zinc-700 rounded"></div>}>
                  <FormField
                    label="Card Description"
                    value={cardData.description}
                    onChange={(value) => handleInputChange('description', value)}
                    placeholder="Enter card effect/description"
                    type="textarea"
                    rows={4}
                  />
                </Suspense>
              </div>
            </div>

            {/* Monster-specific fields */}
            {cardData.type === 'Monster' && (
              <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                <h2 className="text-xl font-semibold text-zinc-200 mb-6 flex items-center gap-2">
                  <Icon icon="mdi:sword" className="text-red-400" />
                  Monster Stats
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Monster Type
                    </label>
                    <select
                      value={cardData.monsterType}
                      onChange={(e) => handleInputChange('monsterType', e.target.value as MonsterType)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="Warrior">Warrior</option>
                      <option value="Spellcaster">Spellcaster</option>
                      <option value="Dragon">Dragon</option>
                      <option value="Machine">Machine</option>
                      <option value="Beast">Beast</option>
                      <option value="Fiend">Fiend</option>
                      <option value="Fairy">Fairy</option>
                      <option value="Zombie">Zombie</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Level/Rank
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={cardData.level}
                      onChange={(e) => handleInputChange('level', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      ATK
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={cardData.atk}
                      onChange={(e) => handleInputChange('atk', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      DEF
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={cardData.def}
                      onChange={(e) => handleInputChange('def', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Artwork Section */}
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
              <h2 className="text-xl font-semibold text-zinc-200 mb-6 flex items-center gap-2">
                <Icon icon="mdi:image" className="text-purple-400" />
                Card Artwork
              </h2>

              <Suspense fallback={<div className="animate-pulse h-32 bg-zinc-700 rounded"></div>}>
                <ImageUpload
                  artworkUrl={cardData.artworkUrl}
                  artworkFile={cardData.artworkFile}
                  onUrlChange={handleArtworkUrlChange}
                  onFileChange={handleArtworkFileChange}
                />
              </Suspense>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleGenerateCard}
                disabled={isGenerating || !cardData.name.trim()}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:download" />
                    Generate Card
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="px-6 py-3 bg-zinc-700 text-zinc-300 font-semibold rounded-lg hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all duration-300 flex items-center gap-2"
              >
                <Icon icon="mdi:refresh" />
                Reset
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
            <h2 className="text-xl font-semibold text-zinc-200 mb-6 flex items-center gap-2">
              <Icon icon="mdi:eye" className="text-green-400" />
              Card Preview
            </h2>

            <div className="flex justify-center">
              <Suspense fallback={
                <div className="w-80 h-112 bg-zinc-700 rounded-lg animate-pulse flex items-center justify-center">
                  <Icon icon="mdi:loading" className="text-4xl text-zinc-500 animate-spin" />
                </div>
              }>
                <CardPreview cardData={cardData} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardMaker;
