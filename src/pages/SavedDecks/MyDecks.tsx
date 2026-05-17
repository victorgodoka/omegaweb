import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api } from '@/utils/Api';
import { AuthManager } from '@/utils/auth';
import { useAuthContext } from '@/contexts/AuthContext';
import DeckCard from './components/DeckCard';
import DeckForm from './components/DeckForm';
import DeckBreadcrumbs from './components/DeckBreadcrumbs';
import type { CategorizedDeck } from '@/utils/ApiTypes';

interface SavedDeck {
  id: number;
  user_id: string;
  code: string;
  name: string;
  cover_id: number | null;
  archetypes: string[];
  tags: string[];
  private: boolean;
  likes: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

const MyDecks = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deckCode, setDeckCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [validatedData, setValidatedData] = useState<CategorizedDeck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!AuthManager.isLoggedIn() || !user?.id) {
      navigate('/');
      return;
    }
    fetchDecks();
  }, [user]);

  const fetchDecks = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = AuthManager.getToken();
      const response = await api.main.getUserDecks(user.id, token || undefined);
      
      if (response.ok && response.data.data) {
        const decksList = response.data.data || [];
        setDecks(decksList);
      } else {
        setError(response.message || t('saved_decks.create_error'));
      }
    } catch (err) {
      console.error('Error fetching decks:', err);
      setError(t('common.network_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!deckCode.trim()) return;
    
    setValidating(true);
    setError(null);
    
    try {
      // API expects an array of deck codes
      const response = await api.main.categorizeDeckGET(deckCode);
      
      // fetchApi spreads array responses, so we access via index
      if (response.ok && response.data) {
        setValidatedData((response.data));
        setShowAddForm(true);
      } else {
        setError(t('saved_decks.validation_error'));
      }
    } catch (err) {
      console.error('Error validating deck:', err);
      setError(t('common.network_error'));
    } finally {
      setValidating(false);
    }
  };

  const handleDeckCreated = () => {
    setShowAddForm(false);
    setDeckCode('');
    setValidatedData(null);
    fetchDecks();
  };

  const handleDeckDeleted = (deckId: number) => {
    setDecks(decks.filter(d => d.id !== deckId));
  };

  if (!AuthManager.isLoggedIn()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Icon icon="mdi:lock" className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('saved_decks.login_required')}</h2>
        </div>
      </div>
    );
  }

  if (showAddForm && validatedData) {
    return (
      <div className="min-h-screen bg-linear-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 py-24 max-w-4xl">
          <DeckBreadcrumbs
            items={[
              { label: t('navigation.decks'), href: '/decks' },
              { label: t('saved_decks.my_decks'), href: '/decks/me' },
              { label: t('saved_decks.create_deck') },
            ]}
          />
          
          <DeckForm
            mode="create"
            deckCode={deckCode}
            validatedData={validatedData}
            onSuccess={handleDeckCreated}
            onCancel={() => {
              setShowAddForm(false);
              setDeckCode('');
              setValidatedData(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-black to-zinc-900">
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <DeckBreadcrumbs
          items={[
            { label: t('navigation.decks'), href: '/decks' },
            { label: t('saved_decks.my_decks') },
          ]}
        />
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <Icon icon="mdi:cards" className="text-3xl text-gray-400" />
            <h1 className="text-3xl font-bold text-white">
              {t("saved_decks.my_decks")}
            </h1>
          </div>
          <p className="text-gray-500 ml-14">
            {t("saved_decks.no_decks_subtitle")}
          </p>
        </div>

        {/* Add Deck Section */}
        <div className="mb-10 bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <Icon icon="mdi:plus" className="text-xl text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-300">
              {t("saved_decks.add_deck")}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={deckCode}
                onChange={(e) => setDeckCode(e.target.value)}
                placeholder={t("saved_decks.deck_code_placeholder")}
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white placeholder-gray-600 transition-colors"
              />
            </div>
            <button
              onClick={handleValidate}
              disabled={!deckCode.trim() || validating}
              className="px-6 py-3 bg-white hover:bg-gray-100 disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-gray-600 rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {validating ? (
                <>
                  <Icon icon="mdi:loading" className="animate-spin" />
                  {t("saved_decks.validating")}
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" />
                  {t("saved_decks.validate")}
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-950/50 border border-red-900/50 rounded-md text-red-300 flex items-start gap-2 text-sm">
              <Icon icon="mdi:alert-circle" className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Decks List */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-16">
            <Icon
              icon="mdi:loading"
              className="text-5xl animate-spin text-gray-600 mb-3"
            />
            <p className="text-gray-500">{t("saved_decks.loading")}</p>
          </div>
        ) : decks.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-16">
            <Icon
              icon="mdi:cards-outline"
              className="text-6xl text-gray-700 mb-4"
            />
            <h3 className="text-xl font-semibold mb-2 text-gray-400">
              {t("saved_decks.no_decks")}
            </h3>
            <p className="text-gray-600">
              {t("saved_decks.no_decks_subtitle")}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-lg font-semibold text-gray-400">
                {decks.length} Deck{decks.length === 1 ? "" : "s"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {decks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  showActions
                  onDelete={handleDeckDeleted}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDecks;
