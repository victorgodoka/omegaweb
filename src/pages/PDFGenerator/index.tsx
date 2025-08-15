import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { fetchApi } from '@/utils/Api';
import { useToast } from '@/contexts/ToastContext';
import type { FormData, FormErrors, ConvertData } from './types';

// Lazy load heavy components
const FormField = lazy(() => import('./components/FormField'));
const DeckList = lazy(() => import('@/components/DeckList'));

const PDFGenerator: React.FC = () => {
  const { t } = useTranslation();
  const { showSuccess, showError, showInfo } = useToast();

  const [formData, setFormData] = useState<FormData>({
    deck: '',
    name: '',
    lastName: '',
    cardGameID: '',
    month: '',
    day: '',
    year: new Date().getFullYear().toString(),
    country: '',
    event: ''
  });
  
  // Separate state for the date input to avoid conflicts
  const [eventDate, setEventDate] = useState<string>('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDeckValidating, setIsDeckValidating] = useState(false);
  const [isDeckValid, setIsDeckValid] = useState(false);
  const [deckData, setDeckData] = useState<DeckLists | null>(null);

  // Validation function
  const validateForm = useCallback((data: FormData): FormErrors => {
    const validationErrors: FormErrors = {};

    // Required field validation (excluding individual date fields)
    const requiredFields = [
      { field: 'deck', name: 'Deck code' },
      { field: 'name', name: 'First name' },
      { field: 'lastName', name: 'Last name' },
      { field: 'cardGameID', name: 'Card Game ID' },
      { field: 'country', name: 'Country' },
      { field: 'event', name: 'Event name' }
    ];

    requiredFields.forEach(({ field, name }) => {
      if (!data[field] || data[field].trim() === '') {
        validationErrors[field] = `${name} is required`;
      }
    });

    // Event date validation (using eventDate state)
    if (!eventDate || eventDate.trim() === '') {
      validationErrors.eventDate = 'Event date is required';
    } else {
      // Validate date format and range
      const dateObj = new Date(eventDate);
      const year = dateObj.getFullYear();
      
      if (isNaN(dateObj.getTime())) {
        validationErrors.eventDate = 'Invalid date format';
      } else if (year < 2020 || year > 2030) {
        validationErrors.eventDate = 'Year must be between 2020 and 2030';
      }
    }

    // Deck code format validation (basic check)
    if (data.deck && data.deck.length < 10) {
      validationErrors.deck = 'Deck code appears to be too short';
    }

    return validationErrors;
  }, [eventDate]);

  // Convert ConvertData to DeckLists format
  const convertToDeckLists = useCallback((convertData: ConvertData): DeckLists => {
    return {
      code: formData.deck,
      id: 'temp-id',
      set: [], // Will be populated from archetype data if needed
      mainDeck: convertData.mainDeck.map(card => ({
        id: card.id,
        name: card.name || `Card ${card.id}`,
        qtd: card.qtd
      })),
      extraDeck: convertData.extraDeck.map(card => ({
        id: card.id,
        name: card.name || `Card ${card.id}`,
        qtd: card.qtd
      })),
      sideDeck: convertData.sideDeck.map(card => ({
        id: card.id,
        name: card.name || `Card ${card.id}`,
        qtd: card.qtd
      })),
      passwords: {
        mainDeck: convertData.mainDeck.map(card => card.id),
        sideDeck: convertData.sideDeck.map(card => card.id)
      }
    };
  }, [formData.deck]);

  // Deck validation function
  const validateDeckCode = useCallback(async (deckCode: string) => {
    if (!deckCode.trim()) {
      showError('Deck code is required');
      setIsDeckValid(false);
      setDeckData(null);
      return;
    }

    setIsDeckValidating(true);
    showInfo('Validating deck...');

    try {
      const encodedCode = encodeURIComponent(deckCode.trim());
      const response = await fetchApi(`convert?code=${encodedCode}`);

      if (response.ok && response.data) {
        if (response.success) {
          setIsDeckValid(true);
          // Convert to DeckLists format for the DeckList component
          const deckListsData = convertToDeckLists(response.data);
          setDeckData(deckListsData);
          showSuccess(`Deck validated successfully! Loaded ${deckListsData.mainDeck.length} main deck, ${deckListsData.extraDeck.length} extra deck, and ${deckListsData.sideDeck.length} side deck cards.`);
        } else {
          setIsDeckValid(false);
          setDeckData(null);
          showError('Invalid deck code. Please check and try again.');
        }
      } else {
        setIsDeckValid(false);
        setDeckData(null);
        showError('Deck validation failed. Please try again later.');
      }
    } catch (error) {
      setIsDeckValid(false);
      setDeckData(null);
      showError(error instanceof Error ? error.message : 'Failed to validate deck code. Please try again.');
    } finally {
      setIsDeckValidating(false);
    }
  }, [showSuccess, showError, showInfo, convertToDeckLists]);

  // Real-time validation
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Clear error for this field if it now has a value
    if (value.trim() && errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }

    // Special handling for deck code - validate when changed
    if (field === 'deck') {
      // Reset deck validation state when deck code changes
      if (isDeckValid) {
        setIsDeckValid(false);
        setDeckData(null);
      }
    }
  }, [formData, errors, isDeckValid]);

  // Calculate form completion progress
  const getFormProgress = useCallback(() => {
    // Check required fields: deck, name, lastName, cardGameID, country, event, and eventDate
    const requiredFields = [
      formData.deck,
      formData.name, 
      formData.lastName,
      formData.cardGameID,
      formData.country,
      formData.event,
      eventDate // Include the separate eventDate state
    ];
    
    const totalFields = requiredFields.length;
    const completedFields = requiredFields.filter(value => value && value.trim() !== '').length;
    return Math.round((completedFields / totalFields) * 100);
  }, [formData, eventDate]);

  // Generate PDF and handle response
  const generatePDF = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return null;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Ensure date fields are populated from eventDate
      const apiData = { ...formData };
      if (eventDate) {
        const [year, month, day] = eventDate.split('-');
        apiData.year = year;
        apiData.month = month;
        apiData.day = day;
      }

      // Build query parameters
      const params = new URLSearchParams(apiData);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pdf/generate?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.');
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    const blob = await generatePDF();
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `decklist_${formData.name}_${formData.lastName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess(`PDF downloaded successfully as decklist_${formData.name}_${formData.lastName}.pdf`);
    }
  };

  // Handle PDF view in new tab
  const handleViewPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    const blob = await generatePDF();
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      showSuccess('PDF opened in new tab for viewing');
    }
  };

  const progress = getFormProgress();

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 mt-12">
      <div className="container mx-auto px-4 py-8">
        {/* Success messages now shown via toast notifications */}

        {/* General Error */}
        {errors.general && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <Icon icon="mdi:alert-circle" className="text-red-400 text-xl" />
              <span className="text-red-300">{errors.general}</span>
            </div>
          </div>
        )}

        <div className="flex gap-4 flex-wrap">
          {/* Form */}
          <form className="max-w-lg mx-auto space-y-8">
            {/* Deck Information Section - First Priority */}
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
              <h2 className="text-xl font-semibold text-zinc-200 mb-6 flex items-center gap-2">
                <Icon icon="mdi:cards" className="text-orange-400" />
                {t('pdf_generator.deck_information')}
              </h2>

              <div className="space-y-4">
                <Suspense fallback={<div className="animate-pulse"><div className="h-4 bg-zinc-700 rounded w-1/4 mb-2"></div><div className="h-10 bg-zinc-700 rounded"></div></div>}>
                  <FormField
                    label={t('pdf_generator.deck_code')}
                    value={formData.deck}
                    onChange={(value) => handleInputChange('deck', value)}
                    error={errors.deck}
                    placeholder={t('pdf_generator.deck_code_placeholder')}
                    type="text"
                    required
                  />
                </Suspense>

                {/* Validation Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => validateDeckCode(formData.deck)}
                    disabled={!formData.deck.trim() || isDeckValidating}
                    className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                  >
                    {isDeckValidating ? (
                      <>
                        <Icon icon="mdi:loading" className="animate-spin" />
                        {t('pdf_generator.validating')}
                      </>
                    ) : (
                      <>
                        <Icon icon="mdi:check-circle" />
                        {t('pdf_generator.validate_deck_code')}
                      </>
                    )}
                  </button>
                </div>

                {/* Deck validation errors now shown via toast notifications */}

                {/* Deck Validation Success */}
                {isDeckValid && (
                  <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
                    <Icon icon="mdi:check-circle" className="text-green-400 text-xl" />
                    <span className="text-green-300">{t('pdf_generator.deck_validation_success')}</span>
                  </div>
                )}

                <p className="text-zinc-500 text-xs">
                  {t('pdf_generator.deck_code_help')}
                </p>
              </div>
            </div>

            {/* Player Information Section - Locked until deck is valid */}
            <div className={`bg-zinc-800 rounded-lg border border-zinc-700 p-6 transition-opacity duration-300 ${!isDeckValid ? 'opacity-50 pointer-events-none' : ''
              }`}>
              <h2 className="text-xl font-semibold text-zinc-200 mb-6 flex items-center gap-2">
                <Icon icon="mdi:account" className="text-blue-400" />
                {t('pdf_generator.player_information')}
                {!isDeckValid && <Icon icon="mdi:lock" className="text-zinc-500 ml-2" />}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label={t('pdf_generator.first_name')}
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  error={errors.name}
                  placeholder={t('pdf_generator.first_name_placeholder')}
                  required
                />

                <FormField
                  label={t('pdf_generator.last_name')}
                  value={formData.lastName}
                  onChange={(value) => handleInputChange('lastName', value)}
                  error={errors.lastName}
                  placeholder={t('pdf_generator.last_name_placeholder')}
                  required
                />

                <FormField
                  label={t('pdf_generator.card_game_id')}
                  value={formData.cardGameID}
                  onChange={(value) => handleInputChange('cardGameID', value)}
                  error={errors.cardGameID}
                  placeholder={t('pdf_generator.card_game_id_placeholder')}
                  required
                />

                <FormField
                  label={t('pdf_generator.country')}
                  value={formData.country}
                  onChange={(value) => handleInputChange('country', value)}
                  error={errors.country}
                  placeholder={t('pdf_generator.country_placeholder')}
                  required
                />
              </div>
            </div>

            {/* Event Information Section - Locked until deck is valid */}
            <div className={`bg-zinc-800 rounded-lg border border-zinc-700 p-6 transition-opacity duration-300 ${!isDeckValid ? 'opacity-50 pointer-events-none' : ''
              }`}>
              <h2 className="text-xl font-semibold text-zinc-200 mb-6 flex items-center gap-2">
                <Icon icon="mdi:calendar" className="text-green-400" />
                {t('pdf_generator.event_information')}
                {!isDeckValid && <Icon icon="mdi:lock" className="text-zinc-500 ml-2" />}
              </h2>

              <div className="space-y-4">
                <FormField
                  label={t('pdf_generator.event_name')}
                  value={formData.event}
                  onChange={(value) => handleInputChange('event', value)}
                  error={errors.event}
                  placeholder={t('pdf_generator.event_name_placeholder')}
                  required
                />

                <FormField
                  label={t('pdf_generator.event_date')}
                  value={eventDate}
                  onChange={(value) => {
                    setEventDate(value);
                    if (value) {
                      const [year, month, day] = value.split('-');
                      handleInputChange('year', year || '');
                      handleInputChange('month', month || '');
                      handleInputChange('day', day || '');
                    } else {
                      handleInputChange('year', '');
                      handleInputChange('month', '');
                      handleInputChange('day', '');
                    }
                  }}
                  error={errors.eventDate}
                  placeholder="YYYY-MM-DD"
                  type="date"
                  required
                />
              </div>
            </div>

            {/* PDF Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isLoading || progress < 100 || !isDeckValid}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin" />
                    Generating...
                  </>
                ) : !isDeckValid ? (
                  <>
                    <Icon icon="mdi:lock" />
                    Validate Deck First
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:download" />
                    Download PDF
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleViewPDF}
                disabled={isLoading || progress < 100 || !isDeckValid}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin" />
                    Generating...
                  </>
                ) : !isDeckValid ? (
                  <>
                    <Icon icon="mdi:lock" />
                    Validate Deck First
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:eye" />
                    View PDF
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Deck List Display */}
          {isDeckValid && deckData && (
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 flex-1">
              <h2 className="text-xl font-semibold text-zinc-200 mb-6 flex items-center gap-2">
                <Icon icon="mdi:view-list" className="text-green-400" />
                {t('pdf_generator.deck_preview')}
              </h2>
              <DeckList deck={deckData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFGenerator;
