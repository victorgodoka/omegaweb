import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api, type DeckWithFullDeck } from '@/utils/Api';
import { AuthManager } from '@/utils/auth';
import { useAuthContext } from '@/contexts/AuthContext';
import LikesAndComments from './components/LikesAndComments';
import { getAvatarUrl } from '@/utils/DiscordAvatar';
import DeckDisplay from '@/components/DeckDisplay';
import DeckExport from '@/components/DeckExport';
import { useCardsSearch } from '@/contexts/CardsSearchContext';
import type { Card, Decklist } from '@/utils/ApiTypes';
import DeckDetailsSkeleton from './components/DeckDetailsSkeleton';
import DeckBreadcrumbs from './components/DeckBreadcrumbs';

const DeckDetails = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { cards, searchCards, isLoading: cardsLoading } = useCardsSearch();
  const [deck, setDeck] = useState<DeckWithFullDeck | null>(null);
  const [fullDeck, setFullDeck] = useState<{ main: number[]; extra: number[]; side: number[] } | null>(null);
  const [deckLoading, setDeckLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = user?.id && deck?.user_id === user.id;

  useEffect(() => {
    if (!deckId) return;
    fetchDeck();
  }, [deckId]);

  const fetchDeck = async () => {
    if (!deckId) return;
    
    setDeckLoading(true);
    setError(null);
    
    try {
      const token = AuthManager.getToken();
      const response = await api.main.getDeck(deckId, token || undefined);
      
      if (response.ok && response.data.data) {
        const deckInfo = response.data.data;
        console.log(response.data)
        setDeck(deckInfo);
        
        // Get fullDeck from response
        if (deckInfo.fullDeck) {
          const { main, extra, side } = deckInfo.fullDeck;
          setFullDeck(deckInfo.fullDeck);
          searchCards({ id: [...new Set([...main, ...(extra || []), ...side])].join('|') });
        }
      } else {
        setError(response.message || t('saved_decks.deck_not_found'));
      }
    } catch (err) {
      console.error('Error fetching deck:', err);
      setError(t('common.network_error'));
    } finally {
      setDeckLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deck || !deckId) return;
    
    const token = AuthManager.getToken();
    if (!token) return;

    setDeleting(true);
    try {
      const response = await api.main.deleteDeck(deckId, token);
      if (response.ok) {
        navigate('/decks/me');
      } else {
        setError(response.message || t('saved_decks.delete_error'));
      }
    } catch (err) {
      console.error('Error deleting deck:', err);
      setError(t('common.network_error'));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const deckLists = useMemo((): Decklist | null => {
    if (!fullDeck || !cards.length) return null;
    const mainDeckCards: Card[] = [];
    const extraDeckCards: Card[] = [];
    const sideDeckCards: Card[] = fullDeck.side.map(cardId => cards.find(c => c.id === cardId)!);

    fullDeck.main.forEach(cardId => {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;
      if (card.type_tags.includes('Fusion') || 
          card.type_tags.includes('Synchro') || 
          card.type_tags.includes('XYZ') || 
          card.type_tags.includes('Xyz') || 
          card.type_tags.includes('Link')) {
        extraDeckCards.push(card);
      } else {
        mainDeckCards.push(card);
      }
    });

    return {
      archetypes: deck?.archetypes || [],
      mainDeck: mainDeckCards,
      extraDeck: extraDeckCards,
      sideDeck: sideDeckCards,
    };
  }, [fullDeck, cards, deck]);

  // Check if everything is ready to render
  const isLoading = deckLoading || cardsLoading || !deckLists;

  if (isLoading && !error) {
    return <DeckDetailsSkeleton />;
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-24">
          <div className="flex flex-col justify-center items-center py-16">
            <Icon icon="mdi:alert-circle" className="text-6xl text-red-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">
              {error === t('saved_decks.private_deck') ? t('saved_decks.private_deck') : t('saved_decks.deck_not_found')}
            </h3>
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-24 max-w-7xl">
        <DeckBreadcrumbs
          items={[
            { label: t('navigation.decks'), href: '/decks' },
            { label: deck.name },
          ]}
        />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 text-white">
                {deck.name}
              </h1>

              {/* Creator Info */}
              {deck.user && (
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={getAvatarUrl(deck.user_id!, deck.user.avatar!)}
                    alt={deck.user.displayname}
                    className="w-8 h-8 rounded-full border border-zinc-700"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-300">
                      {deck.user.displayname}
                    </span>
                    <span className="text-xs text-gray-500">
                      @{deck.user.username}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>
                  {t("saved_decks.created_at")}:{" "}
                  {new Date(deck.created_at).toLocaleDateString()}
                </span>
                {deck.private && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Icon icon="mdi:lock" />
                    {t("saved_decks.private")}
                  </span>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/decks/edit/${deck.id}`)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md font-semibold transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:pencil" />
                  {t("saved_decks.edit_deck")}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md font-semibold transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:delete" />
                  {t("saved_decks.delete_deck")}
                </button>
              </div>
            )}
          </div>

          {/* Archetypes and Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {deck.archetypes.map((archetype, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-zinc-800 text-gray-300 rounded border border-zinc-700 text-sm"
              >
                {archetype}
              </span>
            ))}
            {deck.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-zinc-800 text-gray-400 rounded border border-zinc-700 text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Deck Lists */}
        {deckLists && (
          <>
            <DeckExport deck={deckLists} code={deck.code} deckName={deck.name} />
            <DeckDisplay deck={deckLists} />
          </>
        )}

        {/* Likes and Comments */}
        <div className="mt-6">
          <LikesAndComments deckId={deck.id} initialLikes={deck.likes || 0} />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-40 p-4">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="mdi:alert-circle" className="text-2xl text-red-400" />
              <h3 className="text-lg font-semibold text-white">
                {t("saved_decks.delete_deck")}
              </h3>
            </div>
            <p className="text-gray-400 mb-6">
              {t("saved_decks.delete_confirm")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-md font-semibold transition-colors disabled:opacity-50"
              >
                {t("saved_decks.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:delete" />
                    {t("saved_decks.delete_deck")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckDetails;
