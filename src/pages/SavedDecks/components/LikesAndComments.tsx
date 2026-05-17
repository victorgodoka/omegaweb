import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router';
import { api, type Comment } from '@/utils/Api';
import { AuthManager } from '@/utils/auth';
import { useAuthContext } from '@/contexts/AuthContext';
import { PlayerAvatar } from '@/components/PlayerAvatar';

interface LikesAndCommentsProps {
  deckId: number;
  initialLikes: number;
}

const LikesAndComments = ({ deckId, initialLikes }: LikesAndCommentsProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);

  const formatCommentDate = useMemo(() => {
    return (dateString: string) => {
      const date = new Date(dateString);
      const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';
      
      return date.toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: i18n.language === 'en'
      });
    };
  }, [i18n.language]);

  useEffect(() => {
    fetchData();
  }, [deckId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch comments
      const commentsResponse = await api.main.getComments(deckId.toString());
      if (commentsResponse.ok && commentsResponse.data.data) {
        setComments(commentsResponse.data.data);
      }

      // Fetch like status if user is logged in
      if (user?.id) {
        const token = AuthManager.getToken();
        if (token) {
          const likeResponse = await api.main.getLikeStatus(deckId.toString(), token);
          if (likeResponse.ok && likeResponse.data) {
            setLiked(likeResponse.data.liked);
            setLikes(likeResponse.data.totalLikes || initialLikes);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user?.id || user.id === '0') {
      setError(t('saved_decks.login_to_like'));
      return;
    }

    // Try getting token from AuthManager first
    let token = AuthManager.getToken();
    
    // If no token but user is logged in, try verifying session
    if (!token && user.id !== '0') {
      try {
        const verification = await AuthManager.verifyToken();
        if (verification.success) {
          token = AuthManager.getToken();
        } else {
          console.error('Token verification failed:', verification.message);
          setError(t('auth.session_expired'));
          return;
        }
      } catch (err) {
        console.error('Error during token verification:', err);
        setError(t('auth.session_error'));
        return;
      }
    }

    if (!token) {
      console.error('No token available after verification attempt');
      setError(t('saved_decks.login_to_like'));
      return;
    }

    setLiking(true);
    setError(null);

    try {
      const response = liked
        ? await api.main.unlikeDeck(deckId.toString(), token)
        : await api.main.likeDeck(deckId.toString(), token);

      if (response.ok && response.data) {
        setLiked(response.data.liked);
        setLikes(response.data.likes ?? likes);
      } else {
        console.error('API error:', response.message);
        setError(response.message || t('common.network_error'));
      }
    } catch (err) {
      console.error('Like/unlike error:', err);
      setError(t('common.network_error'));
    } finally {
      setLiking(false);
    }
  };

  const handlePostComment = async () => {
    if (!user?.id) {
      setError(t('saved_decks.login_to_comment'));
      return;
    }

    if (!newComment.trim()) {
      setError(t('saved_decks.comment_required'));
      return;
    }

    if (newComment.length > 500) {
      setError(t('saved_decks.comment_too_long'));
      return;
    }

    const token = AuthManager.getToken();
    if (!token) return;

    setPosting(true);
    setError(null);

    try {
      const response = await api.main.addComment(deckId.toString(), newComment, token);
      if (response.ok && response.data) {
        setNewComment('');
        // Reload comments to get complete user data
        const commentsResponse = await api.main.getComments(deckId.toString());
        if (commentsResponse.ok && commentsResponse.data) {
          setComments(commentsResponse.data);
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(t('common.network_error'));
    } finally {
      setPosting(false);
    }
  };

  const handlePostReply = async (parentId: number) => {
    if (!user?.id) {
      setError(t('saved_decks.login_to_comment'));
      return;
    }

    if (!replyText.trim()) {
      setError(t('saved_decks.comment_required'));
      return;
    }

    if (replyText.length > 500) {
      setError(t('saved_decks.comment_too_long'));
      return;
    }

    const token = AuthManager.getToken();
    if (!token) return;

    setPosting(true);
    setError(null);

    try {
      const response = await api.main.addComment(deckId.toString(), replyText, token, parentId);
      if (response.ok && response.data) {
        setReplyText('');
        setReplyingToId(null);
        
        // Find the root comment to expand
        const parentComment = comments?.find(c => c.id === parentId);
        const rootCommentId = parentComment?.parent_id || parentId;
        
        // Auto-expand replies when a new reply is added
        setExpandedReplies(prev => new Set(prev).add(rootCommentId));
        
        // Reload comments to get complete user data
        const commentsResponse = await api.main.getComments(deckId.toString());
        if (commentsResponse.ok && commentsResponse.data) {
          setComments(commentsResponse.data);
        }
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      setError(t('common.network_error'));
    } finally {
      setPosting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editingCommentText.trim()) {
      setError(t('saved_decks.comment_required'));
      return;
    }

    if (editingCommentText.length > 500) {
      setError(t('saved_decks.comment_too_long'));
      return;
    }

    const token = AuthManager.getToken();
    if (!token) return;

    try {
      const response = await api.main.updateComment(
        deckId.toString(),
        commentId.toString(),
        editingCommentText,
        token
      );

      if (response.ok) {
        setEditingCommentId(null);
        setEditingCommentText('');
        setError(null);
        // Reload comments to get complete user data
        const commentsResponse = await api.main.getComments(deckId.toString());
        if (commentsResponse.ok && commentsResponse.data) {
          setComments(commentsResponse.data);
        }
      }
    } catch (err) {
      console.error('Error editing comment:', err);
      setError(t('common.network_error'));
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    const token = AuthManager.getToken();
    if (!token) return;

    try {
      const response = await api.main.deleteComment(
        deckId.toString(),
        commentId.toString(),
        token
      );

      if (response.ok) {
        setComments((comments || []).filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const toggleReplies = (commentId: number) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Separate root comments and replies
  const rootComments = useMemo(() => {
    return (comments || []).filter(c => !c.parent_id);
  }, [comments]);

  // Get direct replies only (not nested)
  const getDirectReplies = (parentId: number): Comment[] => {
    return (comments || []).filter(c => c.parent_id === parentId);
  };

  // Count all replies recursively
  const countAllReplies = (parentId: number): number => {
    const directReplies = getDirectReplies(parentId);
    let count = directReplies.length;
    
    directReplies.forEach(reply => {
      count += countAllReplies(reply.id);
    });
    
    return count;
  };

  return (
    <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
      {/* Likes Section */}
      <div className="mb-6 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={!user?.id || liking}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors ${
              liked
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-zinc-800 hover:bg-zinc-700 text-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Icon
              icon={liked ? "mdi:heart" : "mdi:heart-outline"}
              className="text-xl"
            />
            <span>
              {liking
                ? t('saved_decks.validating')
                : liked
                  ? t("saved_decks.unlike")
                  : t("saved_decks.like")}
            </span>
          </button>
          <span className="text-gray-400">
            {likes} {t("saved_decks.like")}
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-300">
          {t("saved_decks.comments")} ({rootComments?.length || 0})
        </h3>

        {/* Add Comment */}
        {user?.id ? (
          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("saved_decks.comment_placeholder")}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white placeholder-gray-600 resize-none transition-colors"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {newComment.length}/500
              </span>
              <button
                onClick={handlePostComment}
                disabled={posting || !newComment.trim()}
                className="px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-gray-600 rounded-md font-semibold transition-colors flex items-center gap-2"
              >
                {posting ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin" />
                    {t("saved_decks.saving")}
                  </>
                ) : (
                  t("saved_decks.post_comment")
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-zinc-800/50 rounded-md text-center text-gray-400 text-sm">
            {t("saved_decks.login_to_comment")}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 rounded-md text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Icon
              icon="mdi:loading"
              className="text-3xl animate-spin text-gray-600"
            />
          </div>
        ) : !comments || comments.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              icon="mdi:comment-outline"
              className="text-4xl text-gray-700 mb-2"
            />
            <p className="text-gray-500 text-sm">
              {t("saved_decks.no_comments")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rootComments.map((comment) => {
              const displayName =
                comment.user?.displayname ||
                comment.user?.username ||
                "Unknown User";
              const directReplies = getDirectReplies(comment.id);
              const totalRepliesCount = countAllReplies(comment.id);
              const isExpanded = expandedReplies.has(comment.id);

              return (
                <div key={comment.id} className="bg-zinc-800/50 rounded-md p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {comment.user ? (
                        <PlayerAvatar
                          id={comment.user_id}
                          avatar={comment.user.avatar}
                          displayname={comment.user.displayname}
                          username={comment.user.username}
                          size="sm"
                          rounded
                        />
                      ) : (
                        <Icon
                          icon="mdi:account-circle"
                          className="text-2xl text-gray-500"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              navigate(`/profile/${comment.user_id}`)
                            }
                            className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                          >
                            {displayName}
                          </button>
                          {comment.user && (
                            <button
                              onClick={() =>
                                navigate(`/profile/${comment.user_id}`)
                              }
                              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                            >
                              @{comment.user.username}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatCommentDate(comment.created_at)}
                        </p>
                      </div>
                    </div>
                    {user?.id === comment.user_id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingCommentText(comment.comment);
                          }}
                          className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          <Icon icon="mdi:pencil" className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Icon icon="mdi:delete" className="text-sm" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === comment.id ? (
                    <div>
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        maxLength={500}
                        rows={3}
                        className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-md focus:outline-none focus:border-zinc-600 text-white text-sm resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          className="px-3 py-1 bg-white hover:bg-gray-100 text-black rounded text-xs font-semibold transition-colors"
                        >
                          {t("saved_decks.save")}
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText("");
                          }}
                          className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded text-xs font-semibold transition-colors"
                        >
                          {t("saved_decks.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300">{comment.comment}</p>
                  )}

                  {/* Reply button */}
                  {user?.id && (
                    <button
                      onClick={() => setReplyingToId(comment.id)}
                      className="mt-2 text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Icon icon="mdi:reply" className="text-sm" />
                      {t("saved_decks.reply")}
                    </button>
                  )}

                  {/* Reply form */}
                  {replyingToId === comment.id && (
                    <div className="mt-3 pl-8 border-l-2 border-zinc-700">
                      <div className="mb-2 text-xs text-gray-400">
                        {t("saved_decks.replying_to", { username: comment.user?.username || "user" })}
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t("saved_decks.comment_placeholder")}
                        maxLength={500}
                        rows={2}
                        className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white text-sm placeholder-gray-600 resize-none transition-colors"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {replyText.length}/500
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyText("");
                            }}
                            className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded text-xs font-semibold transition-colors"
                          >
                            {t("saved_decks.cancel")}
                          </button>
                          <button
                            onClick={() => handlePostReply(comment.id)}
                            disabled={posting || !replyText.trim()}
                            className="px-3 py-1 bg-white hover:bg-gray-100 disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-gray-600 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            {posting ? (
                              <>
                                <Icon icon="mdi:loading" className="animate-spin text-xs" />
                                {t("saved_decks.saving")}
                              </>
                            ) : (
                              t("saved_decks.post_comment")
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show/Hide replies button */}
                  {totalRepliesCount > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="mt-3 text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Icon 
                        icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} 
                        className="text-sm" 
                      />
                      {isExpanded 
                        ? t("saved_decks.hide_replies")
                        : t("saved_decks.replies", { count: totalRepliesCount })
                      }
                    </button>
                  )}

                  {/* Replies list */}
                  {isExpanded && directReplies.length > 0 && (
                    <div className="mt-3 pl-8 space-y-3 border-l-2 border-zinc-700">
                      {directReplies.map((reply: Comment) => {
                        const replyDisplayName =
                          reply.user?.displayname ||
                          reply.user?.username ||
                          "Unknown User";

                        return (
                          <div key={reply.id} className="bg-zinc-900/50 rounded-md p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {reply.user ? (
                                  <PlayerAvatar
                                    id={reply.user_id}
                                    avatar={reply.user.avatar}
                                    displayname={reply.user.displayname}
                                    username={reply.user.username}
                                    size="sm"
                                    rounded
                                  />
                                ) : (
                                  <Icon
                                    icon="mdi:account-circle"
                                    className="text-xl text-gray-500"
                                  />
                                )}
                                <div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        navigate(`/profile/${reply.user_id}`)
                                      }
                                      className="text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                                    >
                                      {replyDisplayName}
                                    </button>
                                    {reply.user && (
                                      <button
                                        onClick={() =>
                                          navigate(`/profile/${reply.user_id}`)
                                        }
                                        className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                                      >
                                        @{reply.user.username}
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {formatCommentDate(reply.created_at)}
                                  </p>
                                </div>
                              </div>
                              {user?.id === reply.user_id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(reply.id);
                                      setEditingCommentText(reply.comment);
                                    }}
                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                  >
                                    <Icon icon="mdi:pencil" className="text-xs" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                                  >
                                    <Icon icon="mdi:delete" className="text-xs" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {editingCommentId === reply.id ? (
                              <div>
                                <textarea
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  maxLength={500}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-md focus:outline-none focus:border-zinc-600 text-white text-xs resize-none"
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleEditComment(reply.id)}
                                    className="px-2 py-1 bg-white hover:bg-gray-100 text-black rounded text-xs font-semibold transition-colors"
                                  >
                                    {t("saved_decks.save")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditingCommentText("");
                                    }}
                                    className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded text-xs font-semibold transition-colors"
                                  >
                                    {t("saved_decks.cancel")}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-300">{reply.comment}</p>
                            )}

                            {/* Reply button for nested replies */}
                            {user?.id && (
                              <button
                                onClick={() => setReplyingToId(reply.id)}
                                className="mt-2 text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                              >
                                <Icon icon="mdi:reply" className="text-xs" />
                                {t("saved_decks.reply")}
                              </button>
                            )}

                            {/* Reply form for nested replies */}
                            {replyingToId === reply.id && (
                              <div className="mt-2 pl-4 border-l-2 border-zinc-600">
                                <div className="mb-2 text-xs text-gray-400">
                                  {t("saved_decks.replying_to", { username: reply.user?.username || "user" })}
                                </div>
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={t("saved_decks.comment_placeholder")}
                                  maxLength={500}
                                  rows={2}
                                  className="w-full px-2 py-2 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white text-xs placeholder-gray-600 resize-none transition-colors"
                                />
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">
                                    {replyText.length}/500
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setReplyingToId(null);
                                        setReplyText("");
                                      }}
                                      className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded text-xs font-semibold transition-colors"
                                    >
                                      {t("saved_decks.cancel")}
                                    </button>
                                    <button
                                      onClick={() => handlePostReply(reply.id)}
                                      disabled={posting || !replyText.trim()}
                                      className="px-2 py-1 bg-white hover:bg-gray-100 disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-gray-600 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                                    >
                                      {posting ? (
                                        <>
                                          <Icon icon="mdi:loading" className="animate-spin text-xs" />
                                          {t("saved_decks.saving")}
                                        </>
                                      ) : (
                                        t("saved_decks.post_comment")
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Nested replies (recursive) */}
                            {(() => {
                              const nestedReplies = getDirectReplies(reply.id);
                              if (nestedReplies.length === 0) return null;
                              
                              return (
                                <div className="mt-2 pl-4 space-y-2 border-l-2 border-zinc-600">
                                  {nestedReplies.map((nestedReply: Comment) => {
                                    const nestedDisplayName =
                                      nestedReply.user?.displayname ||
                                      nestedReply.user?.username ||
                                      "Unknown User";

                                    return (
                                      <div key={nestedReply.id} className="bg-black/30 rounded-md p-2">
                                        <div className="flex items-start justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            {nestedReply.user ? (
                                              <PlayerAvatar
                                                id={nestedReply.user_id}
                                                avatar={nestedReply.user.avatar}
                                                displayname={nestedReply.user.displayname}
                                                username={nestedReply.user.username}
                                                size="sm"
                                                rounded
                                              />
                                            ) : (
                                              <Icon
                                                icon="mdi:account-circle"
                                                className="text-lg text-gray-500"
                                              />
                                            )}
                                            <div>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() =>
                                                    navigate(`/profile/${nestedReply.user_id}`)
                                                  }
                                                  className="text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                                                >
                                                  {nestedDisplayName}
                                                </button>
                                                {nestedReply.user && (
                                                  <button
                                                    onClick={() =>
                                                      navigate(`/profile/${nestedReply.user_id}`)
                                                    }
                                                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                                                  >
                                                    @{nestedReply.user.username}
                                                  </button>
                                                )}
                                              </div>
                                              <p className="text-xs text-gray-500">
                                                {formatCommentDate(nestedReply.created_at)}
                                              </p>
                                            </div>
                                          </div>
                                          {user?.id === nestedReply.user_id && (
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => {
                                                  setEditingCommentId(nestedReply.id);
                                                  setEditingCommentText(nestedReply.comment);
                                                }}
                                                className="text-xs text-gray-400 hover:text-white transition-colors"
                                              >
                                                <Icon icon="mdi:pencil" className="text-xs" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteComment(nestedReply.id)}
                                                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                                              >
                                                <Icon icon="mdi:delete" className="text-xs" />
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {editingCommentId === nestedReply.id ? (
                                          <div>
                                            <textarea
                                              value={editingCommentText}
                                              onChange={(e) => setEditingCommentText(e.target.value)}
                                              maxLength={500}
                                              rows={2}
                                              className="w-full px-2 py-1 bg-black border border-zinc-700 rounded-md focus:outline-none focus:border-zinc-600 text-white text-xs resize-none"
                                            />
                                            <div className="flex gap-2 mt-1">
                                              <button
                                                onClick={() => handleEditComment(nestedReply.id)}
                                                className="px-2 py-1 bg-white hover:bg-gray-100 text-black rounded text-xs font-semibold transition-colors"
                                              >
                                                {t("saved_decks.save")}
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setEditingCommentId(null);
                                                  setEditingCommentText("");
                                                }}
                                                className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded text-xs font-semibold transition-colors"
                                              >
                                                {t("saved_decks.cancel")}
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-gray-300">{nestedReply.comment}</p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikesAndComments;
