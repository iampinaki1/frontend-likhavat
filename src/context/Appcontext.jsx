import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Log every outgoing request to debug infinite loops
api.interceptors.request.use(request => {
  console.log(`[API CALL] ${request.method.toUpperCase()} ${request.url}`);
  return request;
});

// Setup Axios Interceptor for Automatic Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // VERY IMPORTANT: Do NOT intercept requests to /user/refresh, or else an expired refresh token = infinite loop!
    if (originalRequest.url.includes('/user/refresh')) {
      return Promise.reject(error);
    }

    // If the error is 401 (Unauthorized) and we haven't already tried refreshing
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to hit the refresh endpoint (relies on HttpOnly refreshToken cookie)
        await api.post('/user/refresh');

        // If successful, the new HttpOnly accessToken cookie is set automatically.
        // Re-run the exact original request that failed
        return api(originalRequest);
      } catch (refreshError) {
        // If refreshing fails (e.g. refreshToken is expired or missing), we're fully logged out
        console.error('Session expired. Please log in again.');
        return Promise.reject(refreshError);
      }
    }

    if (error.response && error.response.status >= 500) {
      window.location.href = '/error';
    }

    return Promise.reject(error);
  }
);

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [poems, setPoems] = useState([]); // Deprecated
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = currentUser !== null;

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      // Fast path: if we definitely know we aren't logged in, skip the network call entirely
      if (localStorage.getItem('isAuthenticated') !== 'true') {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.post('/user/refresh');
        if (data.accessToken && data.user) {
          // Cleanly restore session strictly from HttpOnly cookie payloads
          setCurrentUser(data.user);
        }
      } catch (err) {
        // If 401/403, our HttpOnly session cookie has expired or doesn't exist. Clear the local hint.
        localStorage.removeItem('isAuthenticated');
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          console.error("Session init failed:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/user/all');
      if (res.data) setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFollowRequests = async () => {
    if (!currentUser) return;
    try {
      const res = await api.get('/user/receivedRequest');
      if (res.data) setFollowRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch application data only when the user is fully authenticated
  // Use a ref to track if we've already fetched to prevent duplicate calls
  const [hasFetchedData, setHasFetchedData] = useState(false);
  
  useEffect(() => {
    if (currentUser?._id && !hasFetchedData) {
      fetchFollowRequests();
      fetchUsers();
      fetchBooks();
      fetchScripts();
      fetchPoems();
      setHasFetchedData(true);
    } else if (!currentUser?._id) {
      // Clear data to completely scrub local memory on logout/failure
      setBooks([]);
      setScripts([]);
      setPoems([]);
      setUsers([]);
      setFollowRequests([]);
      setHasFetchedData(false);
    }
  }, [currentUser?._id]);

  const fetchBooks = async (lastId = null) => {
    try {
      const url = lastId ? `/books/book?lastId=${lastId}` : '/books/book';
      const res = await api.get(url);
      if (res.data.success) {
        // Map backend 'image' to frontend 'coverImage' requirement
        const mappedBooks = res.data.books.map(b => ({
          ...b,
          id: b._id,
          coverImage: b.image && b.image !== "no img" ? b.image : null
        }));

        if (lastId) {
          setBooks(prev => [...prev, ...mappedBooks]);
        } else {
          setBooks(mappedBooks);
        }
        return res.data.nextCursor;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScripts = async (lastId = null) => {
    try {
      const url = lastId ? `/scripts/script?lastId=${lastId}` : '/scripts/script';
      const res = await api.get(url);
      if (res.data.success) {
        // Map backend 'image' to frontend 'coverImage' requirement
        const mappedScripts = res.data.scripts.map(s => ({
          ...s,
          id: s._id,
          coverImage: s.image && s.image !== "no img" ? s.image : null
        }));

        if (lastId) {
          setScripts(prev => [...prev, ...mappedScripts]);
        } else {
          setScripts(mappedScripts);
        }
        return res.data.nextCursor;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPoems = async () => {
    try {
      const res = await api.get('/poems/poem');
      if (res.data.success) {
        setPoems(res.data.poems);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const login = async (username, password) => {
    try {
      const { data } = await api.post('/user/signin', { email_username: username, password });

      if (data && data.user) {
        setCurrentUser(data.user);
      } else {
        // Fallback if backend doesn't return user obj
        const userRes = await api.get(`/user/profile/${username}`);
        if (userRes.data && userRes.data.user) {
          setCurrentUser(userRes.data.user);
        } else if (userRes.data && userRes.data._id) {
          setCurrentUser(userRes.data);
        } else {
          setCurrentUser({ username });
        }
      }
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const signup = async (username, password, email) => {
    try {
      const { data } = await api.post('/user/signup', { username, email, password, termAndCondition: true });
      return { success: true, tempUserId: data.tempUserId };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.msg || 'Signup failed' };
    }
  };

  const verifySignup = async (tempUserId, verificationCode) => {
    try {
      const { data } = await api.post('/user/verifySignup', { tempUserId, verificationCode });
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.msg || 'Verification failed' };
    }
  };

  const logout = async () => {
    try {
      await api.get('/user/logout');
      setCurrentUser(null);
      localStorage.removeItem('username');
      localStorage.removeItem('isAuthenticated');
    } catch (err) {
      console.error(err);
    }
  };

  const requestPasswordReset = async (email, newpassword) => {
    try {
      const { data } = await api.post('/user/profile/password/reset', { email, newpassword });
      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.msg || "Failed to send reset code" };
    }
  };

  const verifyPasswordReset = async (tempUserId, verificationCode) => {
    try {
      const { data } = await api.post('/user/profile/verify-otp', { tempUserId, verificationCode });
      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.msg || "Failed to verify reset code" };
    }
  };

  const updateProfile = async (formData) => {
    try {
      const { data } = await api.post('/user/profile/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (data.profilePic) {
        setCurrentUser((prev) => ({ ...prev, profilePic: data.profilePic }));
        const updatedUsers = users.map((u) => u.username === currentUser.username ? { ...u, profilePic: data.profilePic } : u);
        setUsers(updatedUsers);
      }
      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.msg || "Update failed" };
    }
  };

  const addBook = async (bookData) => {
    try {
      const { data } = await api.post('/books/book/create', bookData);
      setBooks([data, ...books]);
    } catch (err) {
      console.error(err);
    }
  };

  const addScript = async (scriptData) => {
    try {
      const { data } = await api.post('/scripts/script', scriptData);

      // If backend also returns a created script, prefer that (it will have proper _id/image)
      if (data.script) {
        setScripts([
          {
            ...data.script,
            id: data.script._id,
            coverImage: data.script.image && data.script.image !== "no img"
              ? data.script.image
              : scriptData.coverImage || null,
          },
          ...scripts,
        ]);
      } else {
        // Fallback: use local scriptData
        setScripts([scriptData, ...scripts]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addPoem = async (poemData) => {
    try {
      const { data } = await api.post('/poems/poem/create', poemData);
      if (data.success && data.poem) setPoems([data.poem, ...poems]);
    } catch (err) {
      console.error(err);
    }
  };

  const updateBook = async (id, updates) => {
    try {
      const { data } = await api.put(`/books/book/${id}/update`, updates);
      setBooks(books.map((b) => (b._id === id || b.id === id ? { ...b, ...data } : b)));
    } catch (err) {
      console.error(err);
    }
  };

  const updateScript = async (id, updates) => {
    try {
      const { data } = await api.put(`/scripts/script/${id}/update`, updates);
      setScripts(scripts.map((s) => (s._id === id || s.id === id ? { ...s, ...data } : s)));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBook = async (id) => {
    try {
      await api.delete(`/books/book/${id}`);
      setBooks(books.filter((b) => b._id !== id && b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteScript = async (id) => {
    try {
      await api.delete(`/scripts/script/${id}`);
      setScripts(scripts.filter((s) => s._id !== id && s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const deletePoem = async (id) => {
    try {
      await api.delete(`/poems/poem/${id}`);
      setPoems(poems.filter((p) => p._id !== id && p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLike = async (id, type) => {
    if (!currentUser) return;

    // Optimistic UI toggle
    const userIdentifier = currentUser._id || currentUser.id;
    try {
      if (type === 'book') {
        const { data } = await api.post(`/books/book/${id}/like`);
        setBooks(
          books.map((book) => {
            if (book._id === id || book.id === id) {
              const likes = (book.likes || []).includes(userIdentifier)
                ? book.likes.filter((uid) => uid !== userIdentifier)
                : [...(book.likes || []), userIdentifier];
              return { ...book, likes };
            }
            return book;
          })
        );
      } else if (type === 'script') {
        const { data } = await api.post(`/scripts/script/${id}/like`);
        setScripts(
          scripts.map((script) => {
            if (script._id === id || script.id === id) {
              const likes = (script.likes || []).includes(userIdentifier)
                ? script.likes.filter((uid) => uid !== userIdentifier)
                : [...(script.likes || []), userIdentifier];
              return { ...script, likes };
            }
            return script;
          })
        );
      } else if (type === 'poem') {
        const { data } = await api.post(`/poems/poem/${id}/like`);
        setPoems(
          poems.map((poem) => {
            if (poem._id === id || poem.id === id) {
              const likes = (poem.likes || []).includes(userIdentifier)
                ? poem.likes.filter((uid) => uid !== userIdentifier)
                : [...(poem.likes || []), userIdentifier];
              return { ...poem, likes };
            }
            return poem;
          })
        );
      }
    } catch (err) {
      console.error("Failed to toggle like on backend", err);
    }
  };

  const toggleBookmark = async (id, type) => {
    if (!currentUser) return;

    try {
      if (type === 'book') {
        const { data } = await api.post(`/books/book/${id}/bookmark`);
        setCurrentUser(prev => {
          const isBookmarked = (prev.bookmarksBook || []).includes(id);
          return {
            ...prev,
            bookmarksBook: isBookmarked
              ? prev.bookmarksBook.filter(bid => bid !== id)
              : [...(prev.bookmarksBook || []), id]
          };
        });
      } else if (type === 'script') {
        const { data } = await api.post(`/scripts/script/${id}/bookmark`);
        setCurrentUser(prev => {
          const isBookmarked = (prev.bookmarksScript || []).includes(id);
          return {
            ...prev,
            bookmarksScript: isBookmarked
              ? prev.bookmarksScript.filter(sid => sid !== id)
              : [...(prev.bookmarksScript || []), id]
          };
        });
      }
    } catch (err) {
      console.error("Failed to toggle bookmark on backend", err);
    }
  };

  const addComment = async (id, type, content) => {
    if (!currentUser) return;

    try {
      if (type === 'book') {
        const { data } = await api.post(`/books/book/${id}/comment`, { text: content });
        if (data && data.success) {
          setBooks(books.map((book) => book._id === id || book.id === id
            ? { ...book, comments: [...(book.comments || []), data.comment] }
            : book
          ));
        }
      } else {
        const { data } = await api.post(`/scripts/script/${id}/comment`, { text: content });
        if (data && data.success) {
          setScripts(scripts.map((script) => script._id === id || script.id === id
            ? { ...script, comments: [...(script.comments || []), data.comment] }
            : script
          ));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async (id, type, cursor = null) => {
    try {
      const urlParams = cursor ? `?lastId=${cursor}` : '';
      if (type === 'book') {
        const { data } = await api.get(`/books/book/${id}/comment${urlParams}`);
        if (data && data.success) {
          setBooks((prevBooks) => prevBooks.map((book) => book._id === id || book.id === id
            ? { ...book, comments: cursor ? [...(book.comments || []), ...data.comments] : data.comments }
            : book
          ));
          return data.nextCursor;
        }
      } else if (type === 'script') {
        const { data } = await api.get(`/scripts/script/${id}/comment${urlParams}`);
        if (data && data.success) {
          setScripts((prevScripts) => prevScripts.map((script) => script._id === id || script.id === id
            ? { ...script, comments: cursor ? [...(script.comments || []), ...data.comments] : data.comments }
            : script
          ));
          return data.nextCursor;
        }
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
    return null;
  };

  const followUser = async (usernameToFollow) => {
    if (!currentUser) return;
    try {
      const { data } = await api.post(`/user/${usernameToFollow}/followunfollow`);

      // Successfully Followed/Unfollowed
      if (data.targetId) {
        if (data.msg === "Followed") {
          setCurrentUser(prev => ({ ...prev, following: [...(prev.following || []), data.targetId] }));
        } else if (data.msg === "Unfollowed") {
          setCurrentUser(prev => ({ ...prev, following: (prev.following || []).filter(id => id !== data.targetId) }));
        }
      }
      // Sent Follow Request to Private Profile (Backend returns the request doc instance)
      else if (data && data._id && data.status === "pending") {
        setCurrentUser(prev => ({ ...prev, sentRequests: [...(prev.sentRequests || []), data.receiver] }));
      }
    } catch (err) { console.error(err); }
  };

  const unfollowUser = async (usernameToFollow) => {
    if (!currentUser) return;
    // unfollow uses the same toggle endpoint
    await followUser(usernameToFollow);
  };

  const acceptFollowRequest = async (userId) => {
    try {
      await api.post('/user/acceptRequest', { requestId: userId });
      setFollowRequests(reqs => reqs.filter(r => r._id !== userId));
      // Optionally upate followers list here
    } catch (err) { }
  };

  const rejectFollowRequest = async (userId) => {
    try {
      await api.post('/user/rejectRequest', { requestId: userId });
      setFollowRequests(reqs => reqs.filter(r => r._id !== userId));
    } catch (err) { }
  };

  // Script access requests (author handles an individual request by its requestId)
  const acceptScriptAccessRequest = async (requestId) => {
    try {
      await api.post(`/scripts/script/${requestId}/accept`);
      await fetchScripts();
    } catch (err) {
      console.error("Failed to accept script access request", err);
    }
  };

  const rejectScriptAccessRequest = async (requestId) => {
    try {
      await api.post(`/scripts/script/${requestId}/reject`);
      await fetchScripts();
    } catch (err) {
      console.error("Failed to reject script access request", err);
    }
  };

  const deleteAccount = async () => {
    try {
      await api.post('/user/profile/delete');
      setCurrentUser(null);
      localStorage.removeItem('username');
      localStorage.removeItem('isAuthenticated');
      return true;
    } catch (err) {
      console.error("Failed to delete account:", err);
      return false;
    }
  };

  const sendMessage = (receiverId, content) => {
    if (!currentUser) return;
    console.log('Sending message to:', receiverId, content);
  };

  const contextValue = useMemo(() => ({
    currentUser,
    setCurrentUser,
    isAuthenticated,
    loading,
    login,
    signup,
    verifySignup,
    requestPasswordReset,
    verifyPasswordReset,
    logout,
    users,
    followRequests,
    books,
    scripts,
    poems,
    addBook,
    addScript,
    addPoem,
    updateBook,
    updateScript,
    updateProfile,
    deleteBook,
    deleteScript,
    toggleLike,
    toggleBookmark,
    addComment,
    fetchComments,
    followUser,
    unfollowUser,
    acceptFollowRequest,
    rejectFollowRequest,
    acceptScriptAccessRequest,
    rejectScriptAccessRequest,
    conversations,
    sendMessage,
    deleteAccount,
  }), [
    currentUser, isAuthenticated, loading, users, followRequests,
    books, scripts, poems, conversations
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}