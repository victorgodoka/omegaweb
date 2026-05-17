import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api, type SavedDeck } from '@/utils/Api';
import { AuthManager } from '@/utils/auth';

interface DeckCardProps {
  deck: SavedDeck;
  showActions?: boolean;
  onDelete?: (deckId: number) => void;
}

const DeckCard = ({ deck, showActions = false, onDelete }: DeckCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    const token = AuthManager.getToken();
    if (!token) return;

    setDeleting(true);
    try {
      const response = await api.main.deleteDeck(deck.id.toString(), token);
      if (response.ok) {
        onDelete?.(deck.id);
      }
    } catch (err) {
      console.error('Error deleting deck:', err);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getCoverImage = () => {
    if (deck.cover_id) {
      return `https://ygopro.online/assets/card-arts/${deck.cover_id}.jpg`;
    }
    return '/back.webp';
  };

  return (
    <div className="group flex flex-col h-full bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors">
      {/* Cover Image */}
      <div 
        className="relative aspect-3/4 bg-black cursor-pointer overflow-hidden"
        onClick={() => navigate(`/decks/details/${deck.id}`)}
      >
        <img
          src={getCoverImage()}
          alt={deck.name}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          onError={(e) => {
            e.currentTarget.src = '/back.webp';
          }}
        />
        {deck.private && (
          <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded flex items-center gap-1 text-xs">
            <Icon icon="mdi:lock" className="text-gray-400" />
            <span className="text-gray-400">{t('saved_decks.private')}</span>
          </div>
        )}
      </div>

      {/* Deck Info */}
      <div className="flex flex-col flex-1 p-4">
        <h3 
          className="font-semibold text-base mb-3 truncate cursor-pointer text-gray-200 group-hover:text-white transition-colors"
          onClick={() => navigate(`/decks/details/${deck.id}`)}
        >
          {deck.name}
        </h3>

        {/* Archetypes */}
        {deck.archetypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {deck.archetypes.slice(0, 3).map((archetype, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-zinc-800 text-gray-400 text-xs rounded border border-zinc-700"
              >
                {archetype}
              </span>
            ))}
            {deck.archetypes.length > 3 && (
              <span className="px-2 py-0.5 bg-zinc-800 text-gray-500 text-xs rounded border border-zinc-700">
                +{deck.archetypes.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {deck.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {deck.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-zinc-800 text-gray-500 text-xs rounded border border-zinc-700"
              >
                #{tag}
              </span>
            ))}
            {deck.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-zinc-800 text-gray-500 text-xs rounded border border-zinc-700">
                +{deck.tags.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto space-y-3">
          {/* Likes and Comments */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Icon icon="mdi:heart" className="text-sm" />
              <span>{deck.likes || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon="mdi:comment" className="text-sm" />
              <span>{deck.comment_count || 0}</span>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => navigate(`/decks/edit/${deck.id}`)}
                className="flex-1 px-3 py-2 bg-white hover:bg-gray-100 text-black rounded text-sm font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <Icon icon="mdi:pencil" />
                {t('saved_decks.edit_deck')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded text-sm font-semibold transition-colors"
              >
                <Icon icon="mdi:delete" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-40 p-4">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="mdi:alert-circle" className="text-2xl text-red-400" />
              <h3 className="text-lg font-semibold text-white">{t('saved_decks.delete_deck')}</h3>
            </div>
            <p className="text-gray-400 mb-6">{t('saved_decks.delete_confirm')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded font-semibold transition-colors disabled:opacity-50"
              >
                {t('saved_decks.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:delete" />
                    {t('saved_decks.delete_deck')}
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

export default DeckCard;
