import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp, api } from "../../context/Appcontext.jsx";
import { BookOpen, Film, Users, Phone, Video, Feather, Heart, X, Trash2, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

export function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, users, deleteAccount } = useApp();
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('books');
  const [profileUser, setProfileUser] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  // Modal paginated lists
  const [modalList, setModalList] = useState([]);
  const [modalCursor, setModalCursor] = useState(null);
  const [modalHasMore, setModalHasMore] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalType, setModalType] = useState(null); // 'followers' | 'following'
  const modalLoaderRef = useRef(null);
  const modalTargetUsernameRef = useRef(null);
  
  const [userBooks, setUserBooks] = useState([]);
  const [userScripts, setUserScripts] = useState([]);
  const [userPoems, setUserPoems] = useState([]);
  const [userBookmarks, setUserBookmarks] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [booksCursor, setBooksCursor] = useState(null);
  const [scriptsCursor, setScriptsCursor] = useState(null);
  const [poemsCursor, setPoemsCursor] = useState(null);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);
  const [hasMoreScripts, setHasMoreScripts] = useState(true);
  const [hasMorePoems, setHasMorePoems] = useState(true);

  const isOwnProfile = !username || username === currentUser?.username;

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you SURE you want to permanently delete your account? This action cannot be undone.")) {
      const success = await deleteAccount();
      if (success) {
        navigate("/signin");
      }
    }
  };

  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser);
      return;
    }
    const fetchProfileUser = async () => {
      try {
        const res = await api.get(`/user/profile/${encodeURIComponent(username)}`);
        if (res.data && res.data.user) {
          setProfileUser(res.data.user);
        }
      } catch (err) {
        console.error("Failed to load profile user", err);
      }
    };
    fetchProfileUser();
  }, [username, isOwnProfile, currentUser]);

  useEffect(() => {
    const fetchUserContent = async () => {
      if (!profileUser?._id) return;
      setLoadingContent(true);
      try {
        const [booksRes, scriptsRes, poemsRes] = await Promise.all([
          api.get(`/books/book?author=${profileUser._id}`),
          api.get(`/scripts/script?author=${profileUser._id}`),
          api.get(`/poems/poem?author=${profileUser._id}`)
        ]);
        if (booksRes.data?.success) {
          setUserBooks(booksRes.data.books || []);
          setBooksCursor(booksRes.data.nextCursor);
          setHasMoreBooks(!!booksRes.data.nextCursor);
        }
        if (scriptsRes.data?.success) {
          setUserScripts(scriptsRes.data.scripts || []);
          setScriptsCursor(scriptsRes.data.nextCursor);
          setHasMoreScripts(!!scriptsRes.data.nextCursor);
        }
        if (poemsRes.data?.success) {
          setUserPoems(poemsRes.data.poems || []);
          setPoemsCursor(poemsRes.data.nextCursor);
          setHasMorePoems(!!poemsRes.data.nextCursor);
        }
      } catch (err) {
        console.error("Failed to load user content", err);
      } finally {
        setLoadingContent(false);
      }
    };
    fetchUserContent();
  }, [profileUser?._id]);

  const loadMoreBooks = async () => {
    if (!booksCursor || loadingMore || !hasMoreBooks) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`/books/book?author=${profileUser._id}&lastId=${booksCursor}`);
      if (res.data?.success) {
        setUserBooks(prev => [...prev, ...(res.data.books || [])]);
        setBooksCursor(res.data.nextCursor);
        setHasMoreBooks(!!res.data.nextCursor);
      }
    } catch (err) {
      console.error("Failed to load more books", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreScripts = async () => {
    if (!scriptsCursor || loadingMore || !hasMoreScripts) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`/scripts/script?author=${profileUser._id}&lastId=${scriptsCursor}`);
      if (res.data?.success) {
        setUserScripts(prev => [...prev, ...(res.data.scripts || [])]);
        setScriptsCursor(res.data.nextCursor);
        setHasMoreScripts(!!res.data.nextCursor);
      }
    } catch (err) {
      console.error("Failed to load more scripts", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMorePoems = async () => {
    if (!poemsCursor || loadingMore || !hasMorePoems) return;
    setLoadingMore(true);
    try {
      const res = await api.get(`/poems/poem?author=${profileUser._id}&lastId=${poemsCursor}`);
      if (res.data?.success) {
        setUserPoems(prev => [...prev, ...(res.data.poems || [])]);
        setPoemsCursor(res.data.nextCursor);
        setHasMorePoems(!!res.data.nextCursor);
      }
    } catch (err) {
      console.error("Failed to load more poems", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadBookmarks = async () => {
    if (!isOwnProfile || !currentUser?._id) return;
    setLoadingContent(true);
    try {
      const [booksRes, scriptsRes] = await Promise.all([
        api.get(`/books/book?bookmarked=true`),
        api.get(`/scripts/script?bookmarked=true`)
      ]);
      const allBookmarks = [
        ...(booksRes.data?.books || []).map(b => ({ ...b, type: 'book' })),
        ...(scriptsRes.data?.scripts || []).map(s => ({ ...s, type: 'script' }))
      ];
      setUserBookmarks(allBookmarks);
    } catch (err) {
      console.error("Failed to load bookmarks", err);
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookmarks' && isOwnProfile && userBookmarks.length === 0) {
      loadBookmarks();
    }
  }, [activeTab, isOwnProfile]);

  // Fetch paginated follow list for modal
  const fetchModalPage = useCallback(async (type, cursor, targetUsername) => {
    if (!targetUsername) return;
    setModalLoading(true);
    try {
      const params = new URLSearchParams({ type });
      if (cursor) params.set('lastId', cursor);
      const { data } = await api.get(`/user/${encodeURIComponent(targetUsername)}/followlist?${params}`);
      if (!data.success) return;
      setModalList(prev => cursor ? [...prev, ...data.users] : data.users);
      setModalCursor(data.nextCursor);
      setModalHasMore(!!data.nextCursor);
    } catch (err) {
      console.error('fetchModalPage error:', err);
    } finally {
      setModalLoading(false);
    }
  }, []);

  const openModal = (type) => {
    const targetUsername = profileUser?.username;
    if (!targetUsername) return;
    modalTargetUsernameRef.current = targetUsername;
    setModalType(type);
    setModalList([]);
    setModalCursor(null);
    setModalHasMore(false);
    if (type === 'followers') setFollowersOpen(true);
    else setFollowingOpen(true);
    fetchModalPage(type, null, targetUsername);
  };

  const closeModal = () => {
    setFollowersOpen(false);
    setFollowingOpen(false);
    setModalList([]);
    setModalCursor(null);
  };

  // IntersectionObserver for modal infinite scroll
  useEffect(() => {
    const el = modalLoaderRef.current;
    if (!el || !modalHasMore || modalLoading) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        fetchModalPage(modalType, modalCursor, modalTargetUsernameRef.current);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [modalHasMore, modalLoading, modalCursor, modalType, fetchModalPage]);

  // Check if current user is following this profile user
  const isFollowing = currentUser?.following && profileUser?._id
    ? currentUser.following.some(fId => 
        fId.toString ? fId.toString() === profileUser._id.toString() : fId === profileUser._id
      )
    : false;

  // Check if follow request was sent to this user
  const isRequestSent = currentUser?.sentRequests && profileUser?._id
    ? currentUser.sentRequests.some(fId => 
        fId.toString ? fId.toString() === profileUser._id.toString() : fId === profileUser._id
      )
    : false;

  const handleFollowToggle = async () => {
    if (!profileUser?.username || followLoading) return;
    
    setFollowLoading(true);
    try {
      const response = await api.post(`/user/${encodeURIComponent(profileUser.username)}/followunfollow`);
      
      if (response.data.msg === "Followed") {
        // Successfully followed (public profile)
        setProfileUser(prev => ({
          ...prev,
          followers: [...(prev.followers || []), currentUser._id]
        }));
        // Update current user's following list
        setCurrentUser(prev => ({
          ...prev,
          following: [...(prev.following || []), profileUser._id]
        }));
        toast.success("Following user");
      } else if (response.data.msg === "Unfollowed") {
        // Successfully unfollowed
        setProfileUser(prev => ({
          ...prev,
          followers: (prev.followers || []).filter(id => 
            id.toString ? id.toString() !== currentUser._id.toString() : id !== currentUser._id
          )
        }));
        // Update current user's following list
        setCurrentUser(prev => ({
          ...prev,
          following: (prev.following || []).filter(id => 
            id.toString ? id.toString() !== profileUser._id.toString() : id !== profileUser._id
          )
        }));
        toast.success("Unfollowed user");
      } else if (response.data?.status === "pending") {
        // Follow request sent (private profile)
        setProfileUser(prev => ({
          ...prev,
          followers: [...(prev.followers || []), currentUser._id]
        }));
        // Update current user's sent requests
        setCurrentUser(prev => ({
          ...prev,
          sentRequests: [...(prev.sentRequests || []), profileUser._id]
        }));
        toast.success("Follow request sent");
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
      toast.error(err.response?.data?.msg || "Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      {/* Profile Header */}
      <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
        <div className="p-6">
          <div className="flex items-start space-x-6">
            <div className={`relative flex h-24 w-24 shrink-0 overflow-hidden rounded-full border bg-gray-100 ${profileUser?.profilePic ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              onClick={() => {
                if (profileUser?.profilePic) {
                  window.open(profileUser.profilePic, '_blank');
                }
              }}>
              {profileUser?.profilePic ? (
                <img className="aspect-square h-full w-full object-cover" src={profileUser.profilePic} alt={profileUser?.username} />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-800 font-medium text-2xl">
                  {profileUser?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profileUser?.username}</h1>
              <div className="text-gray-800 mt-2 text-sm whitespace-pre-wrap leading-relaxed max-w-md">
                {profileUser?.bio || ''}
              </div>
              <div className="flex items-center space-x-6 mt-4 text-sm">
                <div>
                  <span className="font-semibold">{userBooks.length + userScripts.length + userPoems.length}</span> Posts
                </div>
                <button onClick={() => openModal('followers')} className="hover:underline cursor-pointer focus:outline-none">
                  <span className="font-semibold">{profileUser?.followers?.length || 0}</span> Followers
                </button>
                <button onClick={() => openModal('following')} className="hover:underline cursor-pointer focus:outline-none">
                  <span className="font-semibold">{profileUser?.following?.length || 0}</span> Following
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {!isOwnProfile ? (
                  <>
                    {isRequestSent ? (
                      <button
                        disabled
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 shadow bg-gray-200 text-gray-500"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Sent Request
                      </button>
                    ) : (
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 border ${!isFollowing ? 'shadow-sm text-white border-transparent' : 'border-input hover:bg-accent hover:text-accent-foreground'}`}
                        style={!isFollowing ? { backgroundColor: '#D4A574', color: '#FFFFFF' } : {}}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        {followLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : (profileUser?.isPrivate ? 'Request' : 'Follow'))}
                      </button>
                    )}
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3">
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </button>
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3">
                      <Video className="w-4 h-4 mr-1" />
                      Video Call
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/setup-profile"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border hover:bg-gray-50 h-9 px-4"
                      style={{ borderColor: '#E5D4C1', color: '#D4A574' }}
                    >
                      Edit Profile
                    </Link>
                    <button
                      onClick={handleDeleteAccount}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border hover:bg-red-50 text-red-600 border-red-200 h-9 px-4 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Followers / Following Modal */}
      {(followersOpen || followingOpen) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="bg-white w-full sm:rounded-xl sm:max-w-md shadow-xl flex flex-col"
            style={{ maxHeight: '85vh', borderRadius: '16px 16px 0 0' }}
          >
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E5D4C1' }}>
              <h2 className="text-base font-semibold">
                {followersOpen ? 'Followers' : 'Following'}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  {followersOpen ? profileUser?.followers?.length || 0 : profileUser?.following?.length || 0}
                </span>
              </h2>
              <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 space-y-1">
              {modalList.map((user, i) => (
                <Link
                  key={user._id}
                  to={`/profile/${encodeURIComponent(user.username)}`}
                  onClick={closeModal}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  style={{
                    animation: `slideInModal 0.15s ease both`,
                    animationDelay: `${Math.min(i * 20, 150)}ms`,
                  }}
                >
                  <div className="h-11 w-11 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: '#E5D4C1' }}>
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.username} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{user.username}</p>
                    {user.bio && <p className="text-xs text-gray-400 truncate">{user.bio}</p>}
                  </div>
                </Link>
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={modalLoaderRef} className="flex justify-center py-3">
                {modalLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
              </div>

              {!modalLoading && modalList.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">
                  {followersOpen ? 'No followers yet' : 'Not following anyone yet'}
                </p>
              )}
            </div>
          </div>
          <style>{`
            @keyframes slideInModal {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Content Tabs */}
      <div className="w-full">
        <div className={`grid w-full ${isOwnProfile ? 'grid-cols-4' : 'grid-cols-3'} items-center justify-center rounded-md p-1 text-gray-500 bg-gray-100`} style={{ backgroundColor: '#FFF8ED' }}>
          <button onClick={() => setActiveTab('books')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'books' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}>
            <BookOpen className="w-4 h-4 mr-2" />
            Books ({userBooks.length})
          </button>
          <button onClick={() => setActiveTab('scripts')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'scripts' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}>
            <Film className="w-4 h-4 mr-2" />
            Scripts ({userScripts.length})
          </button>
          <button onClick={() => setActiveTab('poems')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'poems' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}>
            <Feather className="w-4 h-4 mr-2" />
            Poems ({userPoems.length})
          </button>
          {isOwnProfile && (
            <button onClick={() => setActiveTab('bookmarks')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'bookmarks' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}>
              <Heart className="w-4 h-4 mr-2" />
              Bookmarks
            </button>
          )}
        </div>

        {activeTab === 'books' && (
          <div className="space-y-4 mt-4">
            {userBooks.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {userBooks.map((book) => (
                    <div key={book._id} className="rounded-xl border shadow-sm overflow-hidden bg-white">
                      <div className="p-4">
                        <div className="flex items-start space-x-4">
                          {book.coverImage && (
                            <img src={book.coverImage} alt={book.title} className="w-20 h-28 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg hover:text-blue-600">
                              <Link to={`/book/${book._id}`}>{book.title}</Link>
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{book.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-900">
                                {book.chapters.length} {book.chapters.length === 1 ? 'chapter' : 'chapters'}
                              </span>
                              <span className="text-sm text-gray-500">{book.likes?.length || 0} likes</span>
                              <span className="text-sm text-gray-500">{book.comments?.length || 0} comments</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreBooks && booksCursor && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={loadMoreBooks}
                      disabled={loadingMore}
                      className="px-6 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
                <div className="p-8 text-center text-gray-500">
                  {isOwnProfile ? "You haven't created any books yet" : 'No books created yet'}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="space-y-4 mt-4">
            {userScripts.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {userScripts.map((script) => (
                    <div key={script._id} className="rounded-xl border shadow-sm overflow-hidden bg-white">
                      <div className="p-4">
                        <h3 className="font-semibold text-lg hover:text-blue-600">
                          <Link to={`/script/${script._id}`}>{script.title}</Link>
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{script.description}</p>
                        <div className="flex items-center space-x-2 mt-2 flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-900 text-white shadow">{script.genre}</span>
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-input bg-background">{script.purpose}</span>
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-900">{script.versions?.length || script.edits?.length || 0} versions</span>
                          <span className="text-sm text-gray-500">{script.likes?.length || 0} likes</span>
                          <span className="text-sm text-gray-500">{script.comments?.length || 0} comments</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreScripts && scriptsCursor && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={loadMoreScripts}
                      disabled={loadingMore}
                      className="px-6 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
                <div className="p-8 text-center text-gray-500">
                  {isOwnProfile ? "You haven't created any scripts yet" : 'No scripts created yet'}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'poems' && (
          <div className="space-y-4 mt-4">
            {userPoems.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {userPoems.map((poem, index) => (
                    <div 
                      key={poem._id || poem.id} 
                      className="rounded-xl border shadow-sm overflow-hidden bg-white"
                      ref={index === userPoems.length - 3 && hasMorePoems ? (el) => {
                        if (el && !loadingMore) {
                          const observer = new IntersectionObserver(
                            (entries) => {
                              if (entries[0].isIntersecting) {
                                loadMorePoems();
                                observer.disconnect();
                              }
                            },
                            { threshold: 0.1 }
                          );
                          observer.observe(el);
                        }
                      } : null}
                    >
                      <div className="p-4">
                        <h3 className="font-semibold text-lg hover:text-blue-600">
                          <Link to={`/poems`} state={{ poemId: poem._id }}>{poem.title}</Link>
                        </h3>
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{poem.content}</p>
                        <div className="flex items-center space-x-4 mt-4">
                          <span className="text-sm text-gray-500 flex items-center"><Heart className="w-4 h-4 mr-1" />{poem.likes?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {loadingMore && (
                  <div className="flex justify-center mt-4">
                    <div className="text-gray-500">Loading more poems...</div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
                <div className="p-8 text-center text-gray-500">
                  {isOwnProfile ? "You haven't written any poems yet" : 'No poems written yet'}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookmarks' && isOwnProfile && (
          <div className="space-y-4 mt-4">
            {loadingContent ? (
              <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
                <div className="p-8 text-center text-gray-500">Loading bookmarks...</div>
              </div>
            ) : userBookmarks.length > 0 ? (
              <div className="grid gap-4">
                {userBookmarks.map((item) => (
                  <div key={`${item.type}-${item._id}`} className="rounded-xl border shadow-sm overflow-hidden bg-white">
                    <div className="p-4">
                      {item.type === 'book' ? (
                        <div className="flex items-start space-x-4">
                          {item.coverImage && (
                            <img src={item.coverImage} alt={item.title} className="w-20 h-28 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="w-4 h-4 text-gray-500" />
                              <span className="text-xs text-gray-500 uppercase">Book</span>
                            </div>
                            <h3 className="font-semibold text-lg hover:text-blue-600">
                              <Link to={`/book/${item._id}`}>{item.title}</Link>
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-gray-100 text-gray-900">
                                {item.chapters?.length || 0} chapters
                              </span>
                              <span className="text-sm text-gray-500">{item.likes?.length || 0} likes</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Film className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-500 uppercase">Script</span>
                          </div>
                          <h3 className="font-semibold text-lg hover:text-blue-600">
                            <Link to={`/script/${item._id}`}>{item.title}</Link>
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          <div className="flex items-center space-x-2 mt-2 flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-gray-900 text-white shadow">{item.genre}</span>
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-input bg-background">{item.purpose}</span>
                            <span className="text-sm text-gray-500">{item.likes?.length || 0} likes</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
                <div className="p-8 text-center text-gray-500">
                  No bookmarks yet
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div >
  );
}

export default ProfilePage;