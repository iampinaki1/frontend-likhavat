import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp, api } from "../../context/Appcontext.jsx";
import { BookOpen, Film, Users, Phone, Video, Feather, Heart, X, Trash2 } from 'lucide-react';
import axios from 'axios';

export function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser, users, books, scripts, poems, followUser, unfollowUser, deleteAccount } = useApp();
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('books');
  const [profileUser, setProfileUser] = useState(null);
  
  const [userBooks, setUserBooks] = useState([]);
  const [userScripts, setUserScripts] = useState([]);
  const [userPoems, setUserPoems] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

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
        const res = await axios.get(`http://localhost:3000/api/user/profile/${username}`, { withCredentials: true });
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
        if (booksRes.data?.success) setUserBooks(booksRes.data.books || []);
        if (scriptsRes.data?.success) setUserScripts(scriptsRes.data.scripts || []);
        if (poemsRes.data?.success) setUserPoems(poemsRes.data.poems || []);
      } catch (err) {
        console.error("Failed to load user content", err);
      } finally {
        setLoadingContent(false);
      }
    };
    fetchUserContent();
  }, [profileUser]);

  // Check if current user is following this profile user
  const isFollowing = currentUser?.following && profileUser?._id
    ? currentUser.following.some(fId => 
        fId.toString ? fId.toString() === profileUser._id.toString() : fId === profileUser._id
      )
    : false;

  // Populate follower and following user lists from the users array
  const followerUsers = profileUser?.followers && (users || []).length > 0
    ? (users || []).filter(u => 
        profileUser.followers.some(fId => 
          fId.toString ? fId.toString() === u._id.toString() : fId === u._id
        )
      )
    : [];
  
  const followingUsers = profileUser?.following && (users || []).length > 0
    ? (users || []).filter(u => 
        profileUser.following.some(fId => 
          fId.toString ? fId.toString() === u._id.toString() : fId === u._id
        )
      )
    : [];

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
                <button onClick={() => setFollowersOpen(true)} className="hover:underline cursor-pointer focus:outline-none">
                  <span className="font-semibold">{profileUser?.followers?.length || 0}</span> Followers
                </button>
                <button onClick={() => setFollowingOpen(true)} className="hover:underline cursor-pointer focus:outline-none">
                  <span className="font-semibold">{profileUser?.following?.length || 0}</span> Following
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {!isOwnProfile ? (
                  <>
                    <button
                      onClick={() => (isFollowing ? unfollowUser(profileUser.username) : followUser(profileUser.username))}
                      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 border ${!isFollowing ? 'shadow-sm text-white border-transparent' : 'border-input hover:bg-accent hover:text-accent-foreground'}`}
                      style={!isFollowing ? { backgroundColor: '#D4A574', color: '#FFFFFF' } : {}}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
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

      {/* Followers Modal */}
      {
        followersOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
              <div className="flex flex-col space-y-1.5 p-6 pb-4 relative">
                <h2 className="text-lg font-semibold leading-none tracking-tight">Followers</h2>
                <button
                  onClick={() => setFollowersOpen(false)}
                  className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
              <div className="p-6 pt-0 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {followerUsers.length > 0 ? (
                    followerUsers.map(user => (
                      <Link
                        key={user._id}
                        to={`/profile/${user.username}`}
                        onClick={() => setFollowersOpen(false)}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-gray-100">
                          {user.profilePic ? (
                            <img className="aspect-square h-full w-full object-cover" src={user.profilePic} alt={user.username} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-800 font-medium text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{user.username}</p>
                          {user.bio && <p className="text-xs text-gray-500">{user.bio}</p>}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No followers yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Following Modal */}
      {
        followingOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
              <div className="flex flex-col space-y-1.5 p-6 pb-4 relative">
                <h2 className="text-lg font-semibold leading-none tracking-tight">Following</h2>
                <button
                  onClick={() => setFollowingOpen(false)}
                  className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
              <div className="p-6 pt-0 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {followingUsers.length > 0 ? (
                    followingUsers.map(user => (
                      <Link
                        key={user._id}
                        to={`/profile/${user.username}`}
                        onClick={() => setFollowingOpen(false)}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-gray-100">
                          {user.profilePic ? (
                            <img className="aspect-square h-full w-full object-cover" src={user.profilePic} alt={user.username} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-800 font-medium text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{user.username}</p>
                          {user.bio && <p className="text-xs text-gray-500">{user.bio}</p>}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">Not following anyone yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Content Tabs */}
      <div className="w-full">
        <div className="grid w-full grid-cols-3 items-center justify-center rounded-md p-1 text-gray-500 bg-gray-100" style={{ backgroundColor: '#FFF8ED' }}>
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
        </div>

        {activeTab === 'books' && (
          <div className="space-y-4 mt-4">
            {userBooks.length > 0 ? (
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
              <div className="grid gap-4">
                {userPoems.map((poem) => (
                  <div key={poem._id || poem.id} className="rounded-xl border shadow-sm overflow-hidden bg-white">
                    <div className="p-4">
                      <h3 className="font-semibold text-lg hover:text-blue-600">
                        <Link to={`/poems`}>{poem.title}</Link>
                      </h3>
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{poem.content}</p>
                      <div className="flex items-center space-x-4 mt-4">
                        <span className="text-sm text-gray-500 flex items-center"><Heart className="w-4 h-4 mr-1" />{poem.likes?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
                <div className="p-8 text-center text-gray-500">
                  {isOwnProfile ? "You haven't written any poems yet" : 'No poems written yet'}
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