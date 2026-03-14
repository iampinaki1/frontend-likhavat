import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp, api } from "../../context/Appcontext.jsx";
import { Search, UserPlus, UserMinus, Check, X, User, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// Reusable user card with slide-in animation
function UserCard({ user, action, index }) {
  return (
    <div
      className="rounded-xl border bg-white shadow-sm flex items-center gap-3 p-3 sm:p-4 transition-all duration-200 hover:shadow-md"
      style={{
        borderColor: '#E5D4C1',
        animation: `slideIn 0.2s ease both`,
        animationDelay: `${Math.min(index * 30, 200)}ms`,
      }}
    >
      <Link to={`/profile/${user.username}`} className="flex-shrink-0">
        <div className="h-12 w-12 rounded-full overflow-hidden border-2" style={{ borderColor: '#E5D4C1' }}>
          {user.profilePic ? (
            <img src={user.profilePic} alt={user.username} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <User className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.username}`} className="font-semibold text-sm hover:underline block truncate">
          {user.username}
        </Link>
        <p className="text-xs text-gray-500 truncate">{user.bio || 'No bio'}</p>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}

const PAGE_SIZE = 10;

export function FollowPage() {
  const { currentUser, setCurrentUser, followRequests, acceptFollowRequest, rejectFollowRequest } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('suggestions');
  const [loadingState, setLoadingState] = useState({});

  // Per-tab paginated lists
  const [suggestions, setSuggestions] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);

  const [cursors, setCursors] = useState({ suggestions: null, following: null, followers: null });
  const [hasMore, setHasMore] = useState({ suggestions: true, following: true, followers: true });
  const [tabLoading, setTabLoading] = useState({ suggestions: false, following: false, followers: false });
  const [initialized, setInitialized] = useState({ suggestions: false, following: false, followers: false });

  const loaderRef = useRef(null);

  // Fetch a page for a given tab
  const fetchPage = useCallback(async (tab, cursor = null) => {
    if (!currentUser?._id) return;
    setTabLoading(prev => ({ ...prev, [tab]: true }));
    try {
      const params = new URLSearchParams({ tab });
      if (cursor) params.set('lastId', cursor);
      if (searchQuery) params.set('search', searchQuery);

      const { data } = await api.get(`/user/all?${params}`);
      if (!data.success) return;

      const page = data.users || [];
      const nextCursor = data.nextCursor || null;

      if (tab === 'suggestions') setSuggestions(prev => cursor ? [...prev, ...page] : page);
      if (tab === 'following') setFollowing(prev => cursor ? [...prev, ...page] : page);
      if (tab === 'followers') setFollowers(prev => cursor ? [...prev, ...page] : page);

      setCursors(prev => ({ ...prev, [tab]: nextCursor }));
      setHasMore(prev => ({ ...prev, [tab]: !!nextCursor }));
      setInitialized(prev => ({ ...prev, [tab]: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setTabLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, [currentUser, searchQuery]);

  // Load tab on switch
  useEffect(() => {
    if (!initialized[activeTab]) {
      fetchPage(activeTab);
    }
  }, [activeTab, initialized, fetchPage]);

  // Re-fetch when search changes (reset pagination)
  useEffect(() => {
    setInitialized({ suggestions: false, following: false, followers: false });
    setSuggestions([]); setFollowing([]); setFollowers([]);
    setCursors({ suggestions: null, following: null, followers: null });
    setHasMore({ suggestions: true, following: true, followers: true });
  }, [searchQuery]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore[activeTab] && !tabLoading[activeTab]) {
        fetchPage(activeTab, cursors[activeTab]);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab, hasMore, tabLoading, cursors, fetchPage]);

  const handleFollow = async (username, userId, isPrivate) => {
    if (loadingState[userId]) return;
    setLoadingState(prev => ({ ...prev, [userId]: true }));
    try {
      const { data } = await api.post(`/user/${username}/followunfollow`);
      if (data?.status === 'pending') {
        setCurrentUser(prev => ({ ...prev, sentRequests: [...(prev.sentRequests || []), userId] }));
        toast.success('Follow request sent');
      } else if (data.msg === 'Followed') {
        setCurrentUser(prev => ({ ...prev, following: [...(prev.following || []), userId] }));
        // Move from suggestions to following
        setSuggestions(prev => prev.filter(u => u._id !== userId));
        toast.success('Following');
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to follow');
    } finally {
      setLoadingState(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnfollow = async (username, userId) => {
    if (loadingState[userId]) return;
    setLoadingState(prev => ({ ...prev, [userId]: true }));
    try {
      const { data } = await api.post(`/user/${username}/followunfollow`);
      if (data.msg === 'Unfollowed') {
        setCurrentUser(prev => ({
          ...prev,
          following: (prev.following || []).filter(id =>
            id.toString ? id.toString() !== userId.toString() : id !== userId
          )
        }));
        setFollowing(prev => prev.filter(u => u._id !== userId));
        toast.success('Unfollowed');
      }
    } catch (err) {
      toast.error('Failed to unfollow');
    } finally {
      setLoadingState(prev => ({ ...prev, [userId]: false }));
    }
  };

  const requests = followRequests || [];

  const tabs = [
    { key: 'suggestions', label: 'Suggestions', count: null },
    { key: 'following', label: 'Following', count: currentUser?.following?.length || 0 },
    { key: 'followers', label: 'Followers', count: currentUser?.followers?.length || 0 },
    { key: 'requests', label: 'Requests', count: requests.length || null, badge: requests.length > 0 },
  ];

  // Get current tab's list (search is server-side now)
  const getFilteredList = () => {
    if (activeTab === 'suggestions') return suggestions;
    if (activeTab === 'following') return following;
    return followers;
  };

  const renderAction = (user, tab) => {
    const isLoading = loadingState[user._id];
    const isRequestSent = currentUser?.sentRequests?.some(id =>
      id.toString ? id.toString() === user._id.toString() : id === user._id
    );
    const isUserFollowing = currentUser?.following?.some(id =>
      id.toString ? id.toString() === user._id.toString() : id === user._id
    );

    if (isRequestSent) {
      return (
        <button disabled className="h-9 px-3 rounded-md text-sm bg-gray-100 text-gray-400 cursor-not-allowed">
          Requested
        </button>
      );
    }
    if (tab === 'following' || isUserFollowing) {
      return (
        <button
          onClick={() => handleUnfollow(user.username, user._id)}
          disabled={isLoading}
          className="h-9 px-3 rounded-md text-sm border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-transform"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
          <span className="hidden sm:inline">{isLoading ? '...' : 'Unfollow'}</span>
        </button>
      );
    }
    return (
      <button
        onClick={() => handleFollow(user.username, user._id, user.isPrivate)}
        disabled={isLoading}
        className="h-9 px-3 rounded-md text-sm text-white flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-transform hover:opacity-90"
        style={{ backgroundColor: '#D4A574' }}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        <span className="hidden sm:inline">{isLoading ? '...' : (tab === 'followers' ? 'Follow Back' : (user.isPrivate ? 'Request' : 'Follow'))}</span>
      </button>
    );
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-2xl mx-auto space-y-4 px-3 sm:px-4 pb-24">
        {/* Header + Search */}
        <div className="rounded-xl border bg-white shadow-sm p-4" style={{ borderColor: '#E5D4C1' }}>
          <h3 className="text-xl font-semibold mb-3">Connections</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 rounded-xl p-1" style={{ backgroundColor: '#FFF8ED', border: '1px solid #E5D4C1' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeTab === tab.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    tab.badge ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-2">
          {/* Suggestions / Following / Followers */}
          {activeTab !== 'requests' && (() => {
            const list = getFilteredList();
            const isLoading = tabLoading[activeTab];

            if (isLoading && list.length === 0) {
              return (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#D4A574' }} />
                </div>
              );
            }

            if (!isLoading && list.length === 0) {
              return (
                <div className="rounded-xl border bg-white p-8 text-center text-gray-400 text-sm" style={{ borderColor: '#E5D4C1' }}>
                  {activeTab === 'suggestions' ? 'No suggestions' : activeTab === 'following' ? "You're not following anyone" : 'No followers yet'}
                </div>
              );
            }

            return (
              <>
                {list.map((user, i) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    index={i}
                    action={renderAction(user, activeTab)}
                  />
                ))}
                {/* Infinite scroll sentinel */}
                <div ref={loaderRef} className="flex justify-center py-4">
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                </div>
              </>
            );
          })()}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            requests.length > 0 ? requests.map((request, i) => (
              <div
                key={request._id}
                className="rounded-xl border bg-white shadow-sm flex items-center gap-3 p-3 sm:p-4"
                style={{
                  borderColor: '#E5D4C1',
                  animation: `slideIn 0.2s ease both`,
                  animationDelay: `${Math.min(i * 30, 200)}ms`,
                }}
              >
                <Link to={`/profile/${request.sender?.username}`} className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2" style={{ borderColor: '#E5D4C1' }}>
                    {request.sender?.profilePic ? (
                      <img src={request.sender.profilePic} alt={request.sender.username} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${request.sender?.username}`} className="font-semibold text-sm hover:underline block truncate">
                    {request.sender?.username}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">{request.sender?.bio || 'Sent you a follow request'}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => acceptFollowRequest(request._id)}
                    className="h-9 w-9 sm:w-auto sm:px-3 rounded-md text-sm bg-gray-900 text-white flex items-center justify-center gap-1 active:scale-95 transition-transform hover:bg-gray-700"
                  >
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Accept</span>
                  </button>
                  <button
                    onClick={() => rejectFollowRequest(request._id)}
                    className="h-9 w-9 sm:w-auto sm:px-3 rounded-md text-sm border border-gray-200 bg-white flex items-center justify-center gap-1 active:scale-95 transition-transform hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Reject</span>
                  </button>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border bg-white p-8 text-center text-gray-400 text-sm" style={{ borderColor: '#E5D4C1' }}>
                No follow requests
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}

export default FollowPage;
