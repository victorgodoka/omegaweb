import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api, type DeckWithFullDeck } from '@/utils/Api';
import type { CategorizedDeck } from '@/utils/ApiTypes';
import { unwrapApiPayload } from '@/utils/unwrapApiPayload';
import { AuthManager } from '@/utils/auth';
import { useAuthContext } from '@/contexts/AuthContext';
import DeckForm from './components/DeckForm';
import DeckBreadcrumbs from './components/DeckBreadcrumbs';

const EditDeck = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [deck, setDeck] = useState<DeckWithFullDeck | null>(null);
  const [validatedData, setValidatedData] = useState<CategorizedDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!AuthManager.isLoggedIn() || !user?.id) {
      navigate('/');
      return;
    }
    if (!deckId) return;
    fetchDeck();
  }, [deckId, user]);

  const fetchDeck = async () => {
    if (!deckId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = AuthManager.getToken();
      const response = await api.main.getDeck(deckId, token || undefined);
      
      if (response.ok && response.data.data) {
        const deckInfo = response.data.data;
        
        // Check if user is owner
        if (deckInfo.user_id !== user?.id) {
          setError(t('profile_edit.access_denied'));
          return;
        }
        
        setDeck(deckInfo);
        
        // Validate deck to get card data
        const validateResponse = await api.main.categorizeDeck([deckInfo.code]);
        console.log('validateResponse:', validateResponse);
        
        // Check response structure - could be response.data.data[0] or response.data[0] or response[0]
        let deckData: CategorizedDeck | null = null;
        if (validateResponse.ok && validateResponse.data) {
          const data = validateResponse.data;
          const unwrapped = unwrapApiPayload<CategorizedDeck[] | CategorizedDeck>(data);
          if (Array.isArray(unwrapped)) {
            deckData = unwrapped[0] ?? null;
          } else if (unwrapped && typeof unwrapped === 'object') {
            deckData = unwrapped;
          } else if (Array.isArray(data)) {
            deckData = data[0] ?? null;
          }
        }
        
        if (deckData) {
          setValidatedData(deckData);
        } else {
          console.error('Failed to validate deck, response:', validateResponse);
          setError(t('saved_decks.deck_validation_error') || 'Failed to validate deck');
        }
      } else {
        setError(response.message || t('saved_decks.deck_not_found'));
      }
    } catch (err) {
      console.error('Error fetching deck:', err);
      setError(t('common.network_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate(`/decks/details/${deckId}`);
  };

  const handleCancel = () => {
    navigate(`/decks/details/${deckId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 py-24">
          <div className="flex flex-col justify-center items-center py-16">
            <Icon icon="mdi:loading" className="text-5xl animate-spin text-gray-600 mb-3" />
            <p className="text-gray-500">{t('saved_decks.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deck || !validatedData) {
    return (
      <div className="min-h-screen bg-linear-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 py-24">
          <div className="flex flex-col justify-center items-center py-16">
            <Icon icon="mdi:alert-circle" className="text-6xl text-red-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">{t('error')}</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-md font-semibold transition-colors"
            >
              {t('common.previous')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-black to-zinc-900">
      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <DeckBreadcrumbs
          items={[
            { label: t('navigation.decks'), href: '/decks' },
            { label: t('saved_decks.my_decks'), href: '/decks/me' },
            { label: deck.name, href: `/decks/details/${deckId}` },
            { label: t('saved_decks.edit_deck') },
          ]}
        />
        
        <DeckForm
          mode="edit"
          deckCode={deck.code}
          validatedData={validatedData}
          existingDeck={deck}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default EditDeck;
