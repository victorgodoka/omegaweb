import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button, TextInput, Alert, FileInput, Label, ToggleSwitch } from 'flowbite-react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Icon } from '@iconify/react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCache } from '@/contexts/CacheContext';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import type { ProfileCustomizationResponse } from '@/pages/Profile/types';




interface CardOption {
  id: string;
  name: string;
}

const ProfileEdit: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const { cardStats, isLoading: cardsLoading } = useCache();

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

  // Load current profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/duelist?id=${user.id}`);
        if (response.ok) {
          const apiResponse: ProfileCustomizationResponse = await response.json();
          const profileData = apiResponse.data;
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
          
          if (profileData.duelist_favorite && cardStats.length > 0) {
            const card = cardStats.find(c => c.id.toString() === profileData.duelist_favorite);
            if (card) {
              const cardOption = { id: card.id.toString(), name: card.name };
              setFavoriteCard(cardOption);
              setSearchTerm(card.name);
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        // Set empty as original if we can't load
        setOriginalBio('');
      }
    };

    if (user && cardStats.length > 0) {
      loadProfileData();
    }
  }, [user, cardStats]);

  // Initialize Quill editor once
  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

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

    // Listen for text changes
    quill.on('text-change', () => {
      setBio(quill.root.innerHTML);
    });

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [t]);

  // Set initial content when data is loaded
  useEffect(() => {
    if (quillRef.current && isDataLoaded && bio) {
      quillRef.current.clipboard.dangerouslyPasteHTML(bio);
    }
  }, [isDataLoaded]);

  // Update Quill content when bio changes externally (like reset)
  useEffect(() => {
    if (quillRef.current && isDataLoaded) {
      const currentContent = quillRef.current.root.innerHTML;
      const newContent = bio || '';
      
      // Only update if content is actually different and not from Quill itself
      if (currentContent !== newContent) {
        quillRef.current.clipboard.dangerouslyPasteHTML(newContent);
      }
    }
  }, [bio]);

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

  // Card search functionality
  const filteredCards = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return cardStats
      .filter(card => 
        card.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10)
      .map(card => ({
        id: card.id.toString(),
        name: card.name
      }));
  }, [cardStats, searchTerm]);

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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/duelist`, {
        method: 'POST',
        // Don't set Content-Type header - let browser set it with boundary for FormData
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
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

  return (
    <div className="min-h-screen bg-zinc-900 py-8 mt-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('profile_edit.title')}</h1>
          <Alert color="info" className="mb-4">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:information" />
              {t('profile_edit.discord_disclaimer')}
            </div>
          </Alert>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Edit Form */}
          <div className="bg-zinc-800 border-zinc-700 p-4 rounded-lg border h-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username (Read-only) */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="username" className="text-zinc-200 block">
                  {t('profile_edit.username')}
                </Label>
                <TextInput
                  id="username"
                  value={user.username}
                  readOnly
                  disabled  
                  className="bg-zinc-700"
                />
              </div>

              {/* Cover/Banner Image */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="cover" className="text-zinc-200 block">
                  {t('profile_edit.cover_banner')}
                </Label>
                <FileInput
                  id="cover"
                  accept="image/*"
                  onChange={handleCoverUpload}

                />
                {coverPreview && (
                  <div className="mt-2">
                    <img 
                      src={coverPreview} 
                      alt={t('profile_edit.cover_banner')}
                      className="w-full h-32 object-cover rounded-lg border border-zinc-600"
                    />
                    <p className="text-xs text-zinc-400 mt-1">PNG, JPG or GIF (MAX. 5MB)</p>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="bio" className="text-zinc-200 block">
                    {t('profile_edit.bio')}
                  </Label>
                  <button
                    type="button"
                    onClick={() => setBio(originalBio)}
                    disabled={bio === originalBio}
                    className="text-xs text-orange-400 hover:text-orange-300 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('profile_edit.reset')}
                  </button>
                </div>
                <div className="quill-container">
                  <div 
                    ref={editorRef}
                    className="bg-zinc-700 border border-zinc-600 rounded-lg"
                    style={{ minHeight: '120px' }}
                  />
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  {bio.replace(/<[^>]*>/g, '').length}/500
                </div>
              </div>

              {/* Favorite Card */}
              <div className="flex flex-col gap-2 relative">
                <Label htmlFor="favorite-card" className="text-zinc-200 block">
                  {t('profile_edit.favorite_card')}
                </Label>
                <TextInput
                  id="favorite-card"
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
                  className="bg-zinc-700 border-zinc-600 text-white"
                  disabled={cardsLoading}
                />
                
                {/* Dropdown for card search */}
                {showDropdown && filteredCards.length > 0 && (
                  <div className="absolute top-18 z-10 w-full mt-1 bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleCardSelect(card)}
                        className="w-full px-4 py-2 text-left text-white hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none"
                      >
                        {card.name}
                      </button>
                    ))}
                  </div>
                )}

                {favoriteCard && (
                  <div className="mt-2 p-2 bg-zinc-700 rounded border border-zinc-600">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{favoriteCard.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFavoriteCard(null);
                          setSearchTerm('');
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Icon icon="mdi:close" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media */}
              <div className="flex flex-col gap-4">
                <Label className="text-zinc-200 text-lg font-semibold">
                  {t('profile_edit.social_media')}
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Twitch */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="twitch" className="text-zinc-200 flex items-center gap-2">
                      <Icon icon="mdi:twitch" className="text-purple-500" />
                      {t('profile_edit.twitch_username')}
                    </Label>
                    <TextInput
                      id="twitch"
                      value={twitchUsername}
                      onChange={(e) => setTwitchUsername(e.target.value)}
                      placeholder={t('profile_edit.social_media_placeholder')}
                      className="bg-zinc-700"
                    />
                  </div>

                  {/* YouTube */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="youtube" className="text-zinc-200 flex items-center gap-2">
                      <Icon icon="mdi:youtube" className="text-red-500" />
                      {t('profile_edit.youtube_username')}
                    </Label>
                    <TextInput
                      id="youtube"
                      value={youtubeUsername}
                      onChange={(e) => setYoutubeUsername(e.target.value)}
                      placeholder={t('profile_edit.social_media_placeholder')}
                      className="bg-zinc-700"
                    />
                  </div>

                  {/* X (Twitter) */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="twitter" className="text-zinc-200 flex items-center gap-2">
                      <Icon icon="mdi:twitter" className="text-blue-400" />
                      {t('profile_edit.twitter_username')}
                    </Label>
                    <TextInput
                      id="twitter"
                      value={twitterUsername}
                      onChange={(e) => setTwitterUsername(e.target.value)}
                      placeholder={t('profile_edit.social_media_placeholder')}
                      className="bg-zinc-700"
                    />
                  </div>

                  {/* Instagram */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="instagram" className="text-zinc-200 flex items-center gap-2">
                      <Icon icon="mdi:instagram" className="text-pink-500" />
                      {t('profile_edit.instagram_username')}
                    </Label>
                    <TextInput
                      id="instagram"
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value)}
                      placeholder={t('profile_edit.social_media_placeholder')}
                      className="bg-zinc-700"
                    />
                  </div>
                </div>
              </div>

              {/* Hide Match History Toggle */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-zinc-200 block mb-1">
                      {t('profile_edit.hide_match_history')}
                    </Label>
                    <p className="text-xs text-zinc-400">
                      {t('profile_edit.hide_match_history_description')}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={hideMatchHistory}
                    onChange={setHideMatchHistory}
                    className="ml-4"
                  />
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert color="failure">
                  <Icon icon="mdi:alert-circle" className="mr-2" />
                  {error}
                </Alert>
              )}

              {success && (
                <Alert color="success">
                  <Icon icon="mdi:check-circle" className="mr-2" />
                  {success}
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600 flex-1"
                >
                  {isLoading ? (
                    <>
                      <Icon icon="mdi:loading" className="animate-spin mr-2" />
                      {t('profile_edit.saving')}
                    </>
                  ) : (
                    t('profile_edit.save_changes')
                  )}
                </Button>
                <Button
                  type="button"
                  color="gray"
                  onClick={() => navigate(`/profile/${user.id}`)}
                  disabled={isLoading}
                >
                  {t('profile_edit.cancel')}
                </Button>
              </div>
            </form>
          </div>

          {/* Profile Preview */}
          <div className="bg-zinc-800 border-zinc-700 p-4 rounded-lg border h-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {t('profile_edit.preview_profile')}
            </h3>
            
            {/* Cover Image Preview */}
            <div className="relative mb-4">
              <div 
                className="w-full h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg overflow-hidden"
                style={{
                  backgroundImage: coverPreview ? `url(${coverPreview})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!coverPreview && (
                  <div className="flex items-center justify-center h-full text-white/70">
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
                  className="border-4 border-zinc-800"
                />
              </div>
            </div>

            {/* Profile Info Preview */}
            <div className="mt-12 space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-white">
                  {user.displayname || user.username}
                </h4>
                <p className="text-zinc-400 text-sm">@{user.username}</p>
                
                {/* Social Media Links */}
                {(twitchUsername || youtubeUsername || twitterUsername || instagramUsername) && (
                  <div className="flex gap-3 mt-3">
                    {twitchUsername && (
                      <a
                        href={`https://twitch.tv/${twitchUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-500 hover:text-purple-400 transition-colors"
                        title={`Twitch: ${twitchUsername}`}
                      >
                        <Icon icon="mdi:twitch" className="w-5 h-5" />
                      </a>
                    )}
                    {youtubeUsername && (
                      <a
                        href={`https://youtube.com/@${youtubeUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-400 transition-colors"
                        title={`YouTube: ${youtubeUsername}`}
                      >
                        <Icon icon="mdi:youtube" className="w-5 h-5" />
                      </a>
                    )}
                    {twitterUsername && (
                      <a
                        href={`https://x.com/${twitterUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title={`X: ${twitterUsername}`}
                      >
                        <Icon icon="mdi:twitter" className="w-5 h-5" />
                      </a>
                    )}
                    {instagramUsername && (
                      <a
                        href={`https://instagram.com/${instagramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-400 transition-colors"
                        title={`Instagram: ${instagramUsername}`}
                      >
                        <Icon icon="mdi:instagram" className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {bio && (
                <div>
                  <p className="text-zinc-200 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: bio }} />
                </div>
              )}

              {favoriteCard && (
                <div>
                  <h5 className="text-sm font-medium text-zinc-300 mb-1 flex items-center gap-2">
                    <Icon icon="mdi:cards" className="text-orange-500" /> {t('profile_edit.favorite_card')}
                  </h5>
                  <img src={`https://images.ygoprodeck.com/images/cards_cropped/${favoriteCard.id}.jpg`} alt={favoriteCard.name} className="w-full border border-zinc-600 rounded-lg p-1 bg-zinc-700" />
                </div>
              )}

              {!bio && !favoriteCard && (
                <div className="text-center py-8 text-zinc-500">
                  <Icon icon="mdi:account-edit" className="w-12 h-12 mx-auto mb-2 opacity-50" />
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
