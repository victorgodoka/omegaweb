import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api, type SavedDeck } from '@/utils/Api';
import { AuthManager } from '@/utils/auth';
import DeckCard from './components/DeckCard';
import DeckBreadcrumbs from './components/DeckBreadcrumbs';

const UserDecks = () => {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    if (!userId) return;
    fetchDecks();
    fetchUsername();
  }, [userId]);

  const fetchUsername = async () => {
    if (!userId) return;
    try {
      const response = await api.external.duelistsUnite.getPlayer(userId);
      if (response.ok && response.data) {
        setUsername(response.data.username || userId);
      }
    } catch (err) {
      console.error('Error fetching username:', err);
    }
  };

  const fetchDecks = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = AuthManager.getToken();
      const response = await api.main.getUserDecks(userId, token || undefined);
      
      if (response.ok && response.data) {
        setDecks(response.data || []);
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

  return (
    <div className="min-h-screen bg-linear-to-b from-black to-zinc-900">
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <DeckBreadcrumbs
          items={[
            { label: t('navigation.decks'), href: '/decks' },
            { label: username || t('saved_decks.loading') },
          ]}
        />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">
            {username ? t('saved_decks.user_decks', { username }) : t('saved_decks.loading')}
          </h1>
          <p className="text-gray-500">
            {t('saved_decks.public')} {t('saved_decks.decks')}
          </p>
        </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Icon icon="mdi:loading" className="text-4xl animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <Icon icon="mdi:alert-circle" className="text-6xl text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('error')}</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-12">
          <Icon icon="mdi:cards-outline" className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('saved_decks.no_decks')}</h3>
          <p className="text-gray-400">{t('saved_decks.no_decks_subtitle')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} showActions={false} />
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDecks;
