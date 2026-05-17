import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@/ui/ToggleSwitch';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Icon } from '@iconify/react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCardsSearch } from '@/contexts/CardsSearchContext';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { api } from '@/utils/Api';
import { unwrapApiPayload } from '@/utils/unwrapApiPayload';
import type { ProfileCustomizationData } from '@/pages/Profile/types';

interface CardOption {
  id: string;
  name: string;
}

const ProfileEdit: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const { cards, isLoading: cardsLoading, searchCards } = useCardsSearch();

  // State management
  const [bio, setBio] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [favoriteCard, setFavoriteCard] = useState<CardOption | null>(null);
  const [hideMatchHistory, setHideMatchHistory] = useState(false);
  const [twitchUsername, setTwitchUsername] = useState('');
  const [youtubeUsername, setYoutubeUsername] = useState('');
  const [twitterUsername, setTwitterUsername] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const quillRef = useRef<Quill | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingFavoriteCardId, setLoadingFavoriteCardId] = useState<string | null>(null);

  // Load current profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      try {
        const response = await api.external.duelistsUnite.getPlayerCustomization(user.id);
        
        if (response.ok && response.data) {
          const profileData = unwrapApiPayload<ProfileCustomizationData>(response.data);
          if (!profileData) return;
          
          const currentBio = profileData.duelist_bio || '';
          setBio(currentBio);
          setOriginalBio(currentBio);
          setIsDataLoaded(true);
          setCoverPreview(profileData.duelist_banner_url || '');
          
          // Set hide match history if exists in profile data (API returns 0 or 1)
          setHideMatchHistory(profileData.hide_history === 1);
          
          // Set social media usernames if they exist
          setTwitchUsername(profileData.socialTwitch || '');
          setYoutubeUsername(profileData.socialYoutube || '');
          setTwitterUsername(profileData.socialX || '');
          setInstagramUsername(profileData.socialInstagram || '');
          
          // Load favorite card if exists
          if (profileData.duelist_favorite) {
            // Search for the card by ID
            const cardId = profileData.duelist_favorite.toString();
            setLoadingFavoriteCardId(cardId);
            await searchCards({ id: cardId });
            // searchCards updates the cards state in the context
            // We'll handle the result in a separate effect that watches cards state
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        // Set empty as original if we can't load
        setOriginalBio('');
      }
    };

    if (user) {
      loadProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Initialize Quill once when profile data is ready (do not depend on `bio` — avoids recreating the editor on every keystroke)
  useEffect(() => {
    if (!editorRef.current || quillRef.current || !isDataLoaded) return;

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link'],
          ['clean']
        ]
      },
      placeholder: t('profile_edit.bio_placeholder'),
    });

    quillRef.current = quill;

    if (bio) {
      quill.clipboard.dangerouslyPasteHTML(bio);
    }

    quill.on('text-change', () => {
      setBio(quill.root.innerHTML);
    });

    return () => {
      quill.off('text-change');
      quillRef.current = null;
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    };
  }, [t, isDataLoaded]); // eslint-disable-line react-hooks/exhaustive-deps -- initial `bio` only; Quill owns updates

  // Sync editor when bio changes outside Quill (e.g. reset)
  useEffect(() => {
    if (!quillRef.current || !isDataLoaded) return;
    const currentContent = quillRef.current.root.innerHTML;
    const newContent = bio || '';
    if (currentContent !== newContent) {
      quillRef.current.clipboard.dangerouslyPasteHTML(newContent);
    }
  }, [bio, isDataLoaded]);

  // Handle favorite card loading when cards state updates
  useEffect(() => {
    if (loadingFavoriteCardId && cards.length > 0 && !cardsLoading) {
      const card = cards[0];
      if (card && card.id.toString() === loadingFavoriteCardId && card.name_en) {
        const cardOption = { id: card.id.toString(), name: card.name_en };
        setFavoriteCard(cardOption);
        setSearchTerm(card.name_en);
        setLoadingFavoriteCardId(null);
      }
    }
  }, [cards, cardsLoading, loadingFavoriteCardId]);

  // Check authentication and authorization
  useEffect(() => {
    if (!user) {
      setError(t('profile_edit.login_required'));
      navigate('/');
      return;
    }
    
    if (id && id !== user.id) {
      setError(t('profile_edit.access_denied'));
      navigate('/');
      return;
    }
  }, [user, id, navigate, t]);

  // Card search functionality - use API search results
  const filteredCards = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return cards
      .slice(0, 10)
      .filter(card => card.name_en !== null)
      .map(card => ({
        id: card.id.toString(),
        name: card.name_en as string
      }));
  }, [cards, searchTerm]);

  // Trigger search when searchTerm changes (with debounce)
  useEffect(() => {
    if (searchTerm && searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchCards({ q: searchTerm, pageSize: 10 });
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Handle cover image upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError(t('profile_edit.upload_error'));
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle card selection
  const handleCardSelect = (card: CardOption) => {
    setFavoriteCard(card);
    setSearchTerm(card.name);
    setShowDropdown(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Use FormData to handle file uploads
      const formData = new FormData();
      formData.append('id', user.id);
      formData.append('duelistBio', bio);
      formData.append('duelistFavorite', favoriteCard?.id || '');
      formData.append('socialX', twitterUsername || '');
      formData.append('socialInstagram', instagramUsername || '');
      formData.append('socialYoutube', youtubeUsername || '');
      formData.append('socialTwitch', twitchUsername || '');
      formData.append('hideHistory', hideMatchHistory ? '1' : '0');
      
      // Add cover image if selected
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      const response = await api.external.duelistsUnite.updatePlayerCustomization(formData);

      if (!response.ok || !response.success) {
        throw new Error(response.message || 'Failed to update profile');
      }

      setSuccess(t('profile_edit.save_success'));
      setTimeout(() => {
        navigate(`/profile/${user.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(t('profile_edit.save_error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  // Show skeleton loader while data is loading
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-linear-to-t to-black from-zinc-900 py-20">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-9 w-48 bg-zinc-800 rounded animate-pulse mb-3"></div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/4"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Skeleton */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse"></div>
                  <div className="h-11 bg-zinc-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Preview Skeleton */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse mb-6"></div>
              <div className="h-32 bg-zinc-800 rounded-lg animate-pulse mb-4"></div>
              <div className="space-y-3 mt-12">
                <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse"></div>
                <div className="h-20 bg-zinc-800 rounded animate-pulse mt-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-t to-black from-zinc-900 py-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">{t('profile_edit.title')}</h1>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon icon="mdi:information-outline" className="text-gray-400 text-xl mt-0.5 shrink-0" />
              <p className="text-gray-400 text-sm">{t('profile_edit.discord_disclaimer')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Edit Form */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username (Read-only) */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-300">
                  {t('profile_edit.username')}
                </label>
                <input
                  id="username"
                  type="text"
                  value={user.username}
                  readOnly
                  disabled
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>

              {/* Cover/Banner Image */}
              <div className="space-y-2">
                <label htmlFor="cover" className="text-sm font-medium text-gray-300">
                  {t('profile_edit.cover_banner')}
                </label>
                <input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-white file:text-black file:cursor-pointer hover:file:opacity-80"
                />
                {coverPreview && (
                  <div className="mt-2 space-y-1">
                    <img 
                      src={coverPreview} 
                      alt={t('profile_edit.cover_banner')}
                      className="w-full h-32 object-cover rounded-lg border border-zinc-800"
                    />
                    <p className="text-xs text-gray-500">{t('profile_edit.cover_banner_hint')}</p>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="bio" className="text-sm font-medium text-gray-300">
                    {t('profile_edit.bio')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setBio(originalBio)}
                    disabled={bio === originalBio}
                    className="text-xs text-white hover:opacity-80 disabled:text-gray-600 disabled:cursor-not-allowed transition-opacity"
                  >
                    {t('profile_edit.reset')}
                  </button>
                </div>
                <div className="quill-container">
                  <div 
                    ref={editorRef}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg"
                    style={{ minHeight: '120px' }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {bio.replace(/<[^>]*>/g, '').length}/500
                </div>
              </div>

              {/* Favorite Card */}
              <div className="space-y-2 relative">
                <label htmlFor="favorite-card" className="text-sm font-medium text-gray-300">
                  {t('profile_edit.favorite_card')}
                </label>
                <input
                  id="favorite-card"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) {
                      setFavoriteCard(null);
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={t('profile_edit.search_card_placeholder')}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-gray-500"
                  disabled={cardsLoading}
                />
                
                {/* Dropdown for card search */}
                {showDropdown && searchTerm.length >= 2 && (
                  <div className="absolute top-full z-40 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg max-h-60 overflow-y-auto shadow-xl">
                    {cardsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Icon icon="mdi:loading" className="animate-spin text-2xl text-gray-400" />
                        <span className="ml-2 text-sm text-gray-400">{t('profile_edit.searching_cards')}</span>
                      </div>
                    ) : filteredCards.length > 0 ? (
                      filteredCards.map((card) => (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleCardSelect(card)}
                          className="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-0 flex items-center gap-3"
                        >
                          <img
                            src={`https://ygopro.online/assets/card-arts/${card.id}.jpg`}
                            alt={card.name || 'Card'}
                            className="w-10 h-14 object-cover rounded border border-zinc-700 shrink-0"
                            loading="lazy"
                          />
                          <span className="text-gray-300 text-sm">{card.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        {t('profile_edit.no_cards_found')}
                      </div>
                    )}
                  </div>
                )}

                {favoriteCard && (
                  <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{favoriteCard.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFavoriteCard(null);
                          setSearchTerm('');
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Icon icon="mdi:close" className="text-lg" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  {t('profile_edit.social_media')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Twitch */}
                  <div className="space-y-2">
                    <label htmlFor="twitch" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Icon icon="mdi:twitch" className="text-gray-400" />
                      {t('profile_edit.twitch_username')}
                    </label>
                    <input
                      id="twitch"
                      type="text"
                      value={twitchUsername}
                      onChange={(e) => setTwitchUsername(e.target.value)}
                      placeholder={t('profile_edit.social_media_placeholder')}
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* YouTube */}
                  <div className="space-y-2">
                    <label htmlFor="youtube" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Icon icon="mdi:youtube" className="text-gray-400" />
                      {t('profile_edit.youtube_username')}
                    </label>
                    <input
                      id="youtube"
                      type="text"
                      value={youtubeUsername}
                      onChange={(e) => setYoutubeUsername(e.target.value)}
                      placeholder={t('profile_edit.social_media_placeholder')}
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* X (Twitter) */}
                  <div className="space-y-2">
                    <label htmlFor="twitter" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Icon icon="mdi:twitter" className="text-gray-400" />
                      {t('profile_edit.twitter_username')}
                    </label>
                    <input
                      id="twitter"
                      type="text"
                      value={twitterUsername}
                      onChange={(e) => setTwitterUsername(e.target.value)}
                      placeholder={t('profile_edit.social_media_placeholder')}
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* Instagram */}
                  <div className="space-y-2">
                    <label htmlFor="instagram" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Icon icon="mdi:instagram" className="text-gray-400" />
                      {t('profile_edit.instagram_username')}
                    </label>
                    <input
                      id="instagram"
                      type="text"
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value)}
                      placeholder={t('profile_edit.social_media_placeholder')}
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Hide Match History Toggle */}
              <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white mb-1">
                      {t('profile_edit.hide_match_history')}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {t('profile_edit.hide_match_history_description')}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={hideMatchHistory}
                    onChange={setHideMatchHistory}
                  />
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-3">
                  <Icon icon="mdi:alert-circle" className="text-red-400 text-xl shrink-0 mt-0.5" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg flex items-start gap-3">
                  <Icon icon="mdi:check-circle" className="text-green-400 text-xl shrink-0 mt-0.5" />
                  <span className="text-green-300 text-sm">{success}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-white text-black font-medium rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Icon icon="mdi:loading" className="animate-spin text-lg" />
                      {t('profile_edit.saving')}
                    </>
                  ) : (
                    t('profile_edit.save_changes')
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${user.id}`)}
                  disabled={isLoading}
                  className="px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('profile_edit.cancel')}
                </button>
              </div>
            </form>
          </div>

          {/* Profile Preview */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              {t('profile_edit.preview_profile')}
            </h3>
            
            {/* Cover Image Preview */}
            <div className="relative mb-4">
              <div 
                className="w-full h-32 bg-zinc-800 rounded-lg overflow-hidden"
                style={{
                  backgroundImage: coverPreview ? `url(${coverPreview})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!coverPreview && (
                  <div className="flex items-center justify-center h-full text-gray-600">
                    <Icon icon="mdi:image" className="w-8 h-8" />
                  </div>
                )}
              </div>
              
              {/* Avatar positioned over cover */}
              <div className="absolute -bottom-8 left-4">
                <PlayerAvatar
                  id={user.id}
                  avatar={user.avatar}
                  displayname={user.displayname}
                  username={user.username}
                  size="lg"
                  bordered
                  className="border-4 border-zinc-900"
                />
              </div>
            </div>

            {/* Profile Info Preview */}
            <div className="mt-12 space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-white">
                  {user.displayname || user.username}
                </h4>
                <p className="text-gray-400 text-sm">@{user.username}</p>
                
                {/* Social Media Links */}
                {(twitchUsername || youtubeUsername || twitterUsername || instagramUsername) && (
                  <div className="flex gap-3 mt-3">
                    {twitchUsername && (
                      <a
                        href={`https://twitch.tv/${twitchUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                        title={t('profile_edit.twitch_tooltip', { username: twitchUsername })}
                      >
                        <Icon icon="mdi:twitch" className="w-5 h-5" />
                      </a>
                    )}
                    {youtubeUsername && (
                      <a
                        href={`https://youtube.com/@${youtubeUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                        title={t('profile_edit.youtube_tooltip', { username: youtubeUsername })}
                      >
                        <Icon icon="mdi:youtube" className="w-5 h-5" />
                      </a>
                    )}
                    {twitterUsername && (
                      <a
                        href={`https://x.com/${twitterUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                        title={t('profile_edit.twitter_tooltip', { username: twitterUsername })}
                      >
                        <Icon icon="mdi:twitter" className="w-5 h-5" />
                      </a>
                    )}
                    {instagramUsername && (
                      <a
                        href={`https://instagram.com/${instagramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                        title={t('profile_edit.instagram_tooltip', { username: instagramUsername })}
                      >
                        <Icon icon="mdi:instagram" className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {bio && (
                <div>
                  <p className="text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: bio }} />
                </div>
              )}

              {favoriteCard && (
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Icon icon="mdi:cards" className="text-gray-400" /> {t('profile_edit.favorite_card')}
                  </h5>
                  <img src={`https://ygopro.online/assets/card-arts/${favoriteCard.id}.jpg`} alt={favoriteCard.name} className="w-full border border-zinc-800 rounded-lg p-1 bg-zinc-800" />
                </div>
              )}

              {!bio && !favoriteCard && (
                <div className="text-center py-12 text-gray-600">
                  <Icon icon="mdi:account-edit" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {t('profile_edit.bio_placeholder')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default ProfileEdit;
