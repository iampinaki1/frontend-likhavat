import React, { useState } from 'react';
import { useApp, api } from "../../context/Appcontext.jsx";
import { Search, UserPlus, UserMinus, Check, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export function FollowPage() {
  const { currentUser, setCurrentUser, users, followRequests, acceptFollowRequest, rejectFollowRequest } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('suggestions');
  const [loadingState, setLoadingState] = useState({});

  // Filter global users (exclude self)
  const otherUsers = (users || []).filter(u => u._id !== currentUser?._id);

  const filteredUsers = otherUsers.filter((user) =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Derive categories automatically using actual IDs
  const following = otherUsers.filter(u => currentUser?.following?.includes(u._id));
  const followers = otherUsers.filter(u => currentUser?.followers?.includes(u._id));

  // Suggestions: Everyone not currently followed
  const suggestions = otherUsers.filter(u => !currentUser?.following?.includes(u._id));

  // The request object has sender populated: { sender: { _id, username, profilePic }, status, _id as requestId }
  const requests = followRequests || [];

  const handleFollow = async (username, userId) => {
    if (loadingState[userId]) return;
    
    setLoadingState(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await api.post(`/user/${username}/followunfollow`);
      
      if (response.data?.status === "pending") {
        // Private user - request sent
        setCurrentUser(prev => ({
          ...prev,
          sentRequests: [...(prev.sentRequests || []), userId]
        }));
        toast.success("Follow request sent");
      } else if (response.data.msg === "Followed") {
        // Public user - followed successfully
        setCurrentUser(prev => ({
          ...prev,
          following: [...(prev.following || []), userId]
        }));
        toast.success("Following user");
      }
    } catch (err) {
      console.error("Follow error:", err);
      toast.error(err.response?.data?.msg || "Failed to follow");
    } finally {
      setLoadingState(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnfollow = async (username, userId) => {
    if (loadingState[userId]) return;
    
    setLoadingState(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await api.post(`/user/${username}/followunfollow`);
      
      if (response.data.msg === "Unfollowed") {
        setCurrentUser(prev => ({
          ...prev,
          following: (prev.following || []).filter(id => 
            id.toString ? id.toString() !== userId.toString() : id !== userId
          )
        }));
        toast.success("Unfollowed successfully");
      }
    } catch (err) {
      console.error("Unfollow error:", err);
      toast.error("Failed to unfollow");
    } finally {
      setLoadingState(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleAcceptRequest = (requestId) => {
    acceptFollowRequest(requestId);
  };

  const handleRejectRequest = (requestId) => {
    rejectFollowRequest(requestId);
  };



  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4">
      {/* Search Header */}
      <div className="rounded-xl border bg-white shadow-sm" style={{ borderColor: '#E5D4C1' }}>
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Manage Connections</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Tabs List */}
        <div className="grid w-full grid-cols-4 items-center justify-center rounded-md p-1 text-gray-500 bg-gray-100" style={{ backgroundColor: '#FFF8ED' }}>
          <button
            type="button"
            onClick={() => setActiveTab('suggestions')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'suggestions' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}
          >
            Suggestions
            <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-900">
              {suggestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'following' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}
          >
            Following
            <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-900">
              {following.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('followers')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'followers' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}
          >
            Followers
            <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-900">
              {followers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'requests' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}
          >
            Requests
            {requests.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-red-500 text-white">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">

          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              {searchQuery ? (
                filteredUsers.length > 0 ? (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => {
                      const isRequestSent = currentUser?.sentRequests?.includes(user._id);
                      const isUserFollowing = currentUser?.following?.includes(user._id);
                      const isLoading = loadingState[user._id];
                      
                      return (
                        <div key={user._id} className="rounded-xl border bg-white shadow-sm" style={{ borderColor: '#E5D4C1' }}>
                          <div className="p-4 flex items-center space-x-4">
                            <Link to={`/profile/${user.username}`}>
                              <div className="relative flex-shrink-0 h-12 w-12 rounded-full overflow-hidden border" style={{ borderColor: '#E5D4C1' }}>
                                {user.profilePic ? (
                                  <img src={user.profilePic} alt={user.username} className="aspect-square h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                                    <User className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </Link>
                            <div className="flex-1">
                              <Link to={`/profile/${user.username}`} className="font-semibold hover:underline">
                                {user.username}
                              </Link>
                              <p className="text-sm text-gray-600 truncate">{user.bio || 'No bio'}</p>
                            </div>
                            {isRequestSent ? (
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 shadow bg-gray-200 text-gray-500"
                              >
                                Sent Request
                              </button>
                            ) : isUserFollowing ? (
                              <button
                                type="button"
                                onClick={() => handleUnfollow(user.username, user._id)}
                                disabled={isLoading}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-9 px-3"
                              >
                                <UserMinus className="w-4 h-4 mr-1" />
                                {isLoading ? 'Loading...' : 'Unfollow'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleFollow(user.username, user._id)}
                                disabled={isLoading}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 shadow hover:opacity-90"
                                style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                {isLoading ? 'Loading...' : (user.isPrivate ? 'Request' : 'Follow')}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border bg-white shadow-sm" style={{ borderColor: '#E5D4C1' }}>
                    <div className="p-8 text-center text-gray-500">No users found</div>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {suggestions.map((user) => {
                    const isRequestSent = currentUser?.sentRequests?.includes(user._id);
                    const isUserFollowing = currentUser?.following?.includes(user._id);
                    const isLoading = loadingState[user._id];
                    
                    return (
                      <div key={user._id} className="rounded-xl border bg-white shadow-sm" style={{ borderColor: '#E5D4C1' }}>
                        <div className="p-4 flex items-center space-x-4">
                          <Link to={`/profile/${user.username}`}>
                            <div className="relative flex-shrink-0 h-12 w-12 rounded-full overflow-hidden border" style={{ borderColor: '#E5D4C1' }}>
                              {user.profilePic ? (
                                <img src={user.profilePic} alt={user.username} className="aspect-square h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                                  <User className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex-1">
                            <Link to={`/profile/${user.username}`} className="font-semibold hover:underline">
                              {user.username}
                            </Link>
                            <p className="text-sm text-gray-600 truncate">{user.bio || 'No bio'}</p>
                          </div>
                          {isRequestSent ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 shadow bg-gray-200 text-gray-500"
                            >
                              Sent Request
                            </button>
                          ) : isUserFollowing ? (
                            <button
                              type="button"
                              onClick={() => handleUnfollow(user.username, user._id)}
                              disabled={isLoading}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-9 px-3"
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              {isLoading ? 'Loading...' : 'Unfollow'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleFollow(user.username, user._id)}
                              disabled={isLoading}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 shadow hover:opacity-90"
                              style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              {isLoading ? 'Loading...' : (user.isPrivate ? 'Request' : 'Follow')}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Following Tab */}
          {activeTab === 'following' && (
            <div className="space-y-3">
              {following.map((user) => {
                const isLoading = loadingState[user._id];
                
                return (
                  <div key={user._id} className="rounded-xl border bg-white shadow-sm" style={{ borderColor: '#E5D4C1' }}>
                    <div className="p-4 flex items-center space-x-4">
                      <Link to={`/profile/${user.username}`}>
                        <div className="relative flex-shrink-0 h-12 w-12 rounded-full overflow-hidden border" style={{ borderColor: '#E5D4C1' }}>
                          {user.profilePic ? (
                            <img src={user.profilePic} alt={user.username} className="aspect-square h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1">
                        <Link to={`/profile/${user.username}`} className="font-semibold hover:underline">
                          {user.username}
                        </Link>
                        <p className="text-sm text-gray-600 truncate">{user.bio || 'No bio'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnfollow(user.username, user._id)}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-9 px-3"
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        {isLoading ? 'Loading...' : 'Unfollow'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Followers Tab */}
          {activeTab === 'followers' && (
            <div className="space-y-3">
              {followers.map((user) => {
                const isRequestSent = currentUser?.sentRequests?.includes(user._id);
                const isUserFollowing = currentUser?.following?.includes(user._id);
                const isLoading = loadingState[user._id];
                
                return (
                  <div key={user._id} className="rounded-xl border bg-white shadow-sm" style={{ borderColor: '#E5D4C1' }}>
                    <div className="p-4 flex items-center space-x-4">
                      <Link to={`/profile/${user.username}`}>
                        <div className="relative flex-shrink-0 h-12 w-12 rounded-full overflow-hidden border" style={{ borderColor: '#E5D4C1' }}>
                          {user.profilePic ? (
                            <img src={user.profilePic} alt={user.username} className="aspect-square h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1">
                        <Link to={`/profile/${user.username}`} className="font-semibold hover:underline">
                          {user.username}
                        </Link>
                        <p className="text-sm text-gray-600 truncate">{user.bio || 'No bio'}</p>
                      </div>
                      {isRequestSent ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 shadow bg-gray-200 text-gray-500"
                        >
                          Sent Request
                        </button>
                      ) : isUserFollowing ? (
                        <button
                          type="button"
                          onClick={() => handleUnfollow(user.username, user._id)}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-9 px-3"
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          {isLoading ? 'Loading...' : 'Unfollow'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleFollow(user.username, user._id)}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 shadow hover:opacity-90"
                          style={{ borderColor: '#DBB996', color: '#DBB996', borderWidth: '1px' }}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          {isLoading ? 'Loading...' : 'Follow Back'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <div key={request._id} className="rounded-xl border bg-white shadow-sm" style={{ borderColor: '#E5D4C1' }}>
                    <div className="p-4 flex items-center space-x-4">
                      <Link to={`/profile/${request.sender?.username}`}>
                        <div className="relative flex-shrink-0 h-12 w-12 rounded-full overflow-hidden border" style={{ borderColor: '#E5D4C1' }}>
                          {request.sender?.profilePic ? (
                            <img src={request.sender.profilePic} alt={request.sender.username} className="aspect-square h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1">
                        <Link to={`/profile/${request.sender?.username}`} className="font-semibold hover:underline">
                          {request.sender?.username}
                        </Link>
                        <p className="text-sm text-gray-600 truncate">{request.sender?.bio || 'Sent you a follow request'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(request._id)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 shadow hover:opacity-90 bg-gray-900 text-gray-50 hover:bg-gray-900/90"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(request._id)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-9 px-3"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border bg-white shadow-sm" style={{ borderColor: '#E5D4C1' }}>
                  <div className="p-8 text-center text-gray-500">No follow requests</div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default FollowPage;