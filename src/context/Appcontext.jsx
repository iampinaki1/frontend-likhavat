import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use(request => {
  console.log(`[API CALL] ${request.method.toUpperCase()} ${request.url}`);
  return request;
});

// Auto-refresh interceptor — only retries once, never retries refresh itself
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.includes('/user/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post('/user/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Session expired. Please log in again.');
        localStorage.removeItem('isAuthenticated');
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status >= 500) {
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
  const [poems, setPoems] = useState([]);
  const [users, setUsers] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);

  const isAuthenticated = currentUser !== null;

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      if (localStorage.getItem('isAuthenticated') !== 'true') {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.post('/user/refresh');
        if (data.accessToken && data.user) {
          setCurrentUser(data.user);
        } else {
          localStorage.removeItem('isAuthenticated');
        }
      } catch (err) {
        localStorage.removeItem('isAuthenticated');
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  // Fetch app data once when user is authenticated
  useEffect(() => {
    if (currentUser?._id && !hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchFollowRequests();
      fetchUsers();
      fetchBooks();
      fetchScripts();
      fetchPoems();
    } else if (!currentUser?._id) {
      hasFetchedData.current = false;
      setBooks([]);
      setScripts([]);
      setPoems([]);
      setUsers([]);
      setFollowRequests([]);
    }
  }, [currentUser?._id]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/user/all');
      if (Array.isArray(res.data)) setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFollowRequests = async () => {
    try {
      const res = await api.get('/user/receivedRequest');
      if (Array.isArray(res.data)) setFollowRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBooks = async (lastId = null) => {
    try {
      const url = lastId ? `/books/book?lastId=${lastId}` : '/books/book';
      const res = await api.get(url);
      if (res.data?.success) {
        const mapped = res.data.books.map(b => ({
          ...b, id: b._id,
          coverImage: b.image && b.image !== "no img" ? b.image : null
        }));
        if (lastId) setBooks(prev => [...prev, ...mapped]);
        else setBooks(mapped);
        return res.data.nextCursor;
      }
    } catch (e) { console.error(e); }
  };

  const fetchScripts = async (lastId = null) => {
    try {
      const url = lastId ? `/scripts/script?lastId=${lastId}` : '/scripts/script';
      const res = await api.get(url);
      if (res.data?.success) {
        const mapped = res.data.scripts.map(s => ({
          ...s, id: s._id,
          coverImage: s.image && s.image !== "no img" ? s.image : null
        }));
        if (lastId) setScripts(prev => [...prev, ...mapped]);
        else setScripts(mapped);
        return res.data.nextCursor;
      }
    } catch (e) { console.error(e); }
  };

  const fetchPoems = async () => {
    try {
      const res = await api.get('/poems/poem');
      if (res.data?.success) setPoems(res.data.poems);
    } catch (e) { console.error(e); }
  };

  const login = async (username, password) => {
    try {
      const { data } = await api.post('/user/signin', { email_username: username, password });
      if (data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('isAuthenticated', 'true');
        return true;
      }
      return false;
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
      return { success: false, error: err.response?.data?.msg || 'Signup failed' };
    }
  };

  const verifySignup = async (tempUserId, verificationCode) => {
    try {
      await api.post('/user/verifySignup', { tempUserId, verificationCode });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.msg || 'Verification failed' };
    }
  };

  const logout = async () => {
    try {
      await api.get('/user/logout');
    } catch (err) {
      console.error(err);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('isAuthenticated');
    }
  };

  const requestPasswordReset = async (email, newpassword) => {
    try {
      const { data } = await api.post('/user/profile/password/reset', { email, newpassword });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.response?.data?.msg || "Failed to send reset code" };
    }
  };

  const verifyPasswordReset = async (tempUserId, verificationCode) => {
    try {
      const { data } = await api.post('/user/profile/verify-otp', { tempUserId, verificationCode });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.response?.data?.msg || "Failed to verify reset code" };
    }
  };

  const updateProfile = async (formData) => {
    try {
      const { data } = await api.post('/user/profile/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Update all changed fields in currentUser
      setCurrentUser(prev => ({
        ...prev,
        ...(data.profilePic ? { profilePic: data.profilePic } : {}),
        ...(formData.get?.('bio') !== null ? { bio: formData.get('bio') } : {}),
        ...(formData.get?.('isPrivate') !== null ? { isPrivate: formData.get('isPrivate') === 'true' } : {}),
      }));
      if (data.profilePic) {
        setUsers(prev => prev.map(u =>
          u.username === currentUser?.username ? { ...u, profilePic: data.profilePic } : u
        ));
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.response?.data?.msg || "Update failed" };
    }
  };

  const addBook = async (bookData) => {
    try {
      const { data } = await api.post('/books/book/create', bookData);
      if (data?._id) {
        const mapped = { ...data, id: data._id, coverImage: data.image && data.image !== "no img" ? data.image : null };
        setBooks(prev => [mapped, ...prev]);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const addScript = async (scriptData) => {
    try {
      const { data } = await api.post('/scripts/script', scriptData);
      if (data?.script) {
        setScripts(prev => [{
          ...data.script,
          id: data.script._id,
          coverImage: data.script.image && data.script.image !== "no img" ? data.script.image : null,
        }, ...prev]);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const addPoem = async (poemData) => {
    try {
      const { data } = await api.post('/poems/poem/create', poemData);
      if (data?.success && data.poem) setPoems(prev => [data.poem, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const updateBook = async (id, updates) => {
    try {
      const { data } = await api.put(`/books/book/${id}/update`, updates);
      setBooks(prev => prev.map(b => (b._id === id || b.id === id) ? { ...b, ...data } : b));
    } catch (err) {
      console.error(err);
    }
  };

  const updateScript = async (id, updates) => {
    try {
      const { data } = await api.put(`/scripts/script/${id}/update`, updates);
      setScripts(prev => prev.map(s => (s._id === id || s.id === id) ? { ...s, ...data } : s));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBook = async (id) => {
    try {
      await api.delete(`/books/book/${id}`);
      setBooks(prev => prev.filter(b => b._id !== id && b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteScript = async (id) => {
    try {
      await api.delete(`/scripts/script/${id}`);
      setScripts(prev => prev.filter(s => s._id !== id && s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const deletePoem = async (id) => {
    try {
      await api.delete(`/poems/poem/${id}`);
      setPoems(prev => prev.filter(p => p._id !== id && p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLike = async (id, type) => {
    if (!currentUser) return;
    const uid = currentUser._id;
    try {
      if (type === 'book') {
        await api.post(`/books/book/${id}/like`);
        setBooks(prev => prev.map(b => {
          if (b._id !== id && b.id !== id) return b;
          const likes = (b.likes || []).includes(uid)
            ? b.likes.filter(x => x !== uid)
            : [...(b.likes || []), uid];
          return { ...b, likes };
        }));
      } else if (type === 'script') {
        await api.post(`/scripts/script/${id}/like`);
        setScripts(prev => prev.map(s => {
          if (s._id !== id && s.id !== id) return s;
          const likes = (s.likes || []).includes(uid)
            ? s.likes.filter(x => x !== uid)
            : [...(s.likes || []), uid];
          return { ...s, likes };
        }));
      } else if (type === 'poem') {
        await api.post(`/poems/poem/${id}/like`);
        setPoems(prev => prev.map(p => {
          if (p._id !== id && p.id !== id) return p;
          const likes = (p.likes || []).includes(uid)
            ? p.likes.filter(x => x !== uid)
            : [...(p.likes || []), uid];
          return { ...p, likes };
        }));
      }
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
  };

  const toggleBookmark = async (id, type) => {
    if (!currentUser) return;
    try {
      if (type === 'book') {
        await api.post(`/books/book/${id}/bookmark`);
        setCurrentUser(prev => {
          const has = (prev.bookmarksBook || []).includes(id);
          return {
            ...prev,
            bookmarksBook: has
              ? prev.bookmarksBook.filter(x => x !== id)
              : [...(prev.bookmarksBook || []), id]
          };
        });
      } else if (type === 'script') {
        await api.post(`/scripts/script/${id}/bookmark`);
        setCurrentUser(prev => {
          const has = (prev.bookmarksScript || []).includes(id);
          return {
            ...prev,
            bookmarksScript: has
              ? prev.bookmarksScript.filter(x => x !== id)
              : [...(prev.bookmarksScript || []), id]
          };
        });
      }
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    }
  };

  const addComment = async (id, type, content) => {
    if (!currentUser) return;
    try {
      if (type === 'book') {
        const { data } = await api.post(`/books/book/${id}/comment`, { text: content });
        if (data?.success) {
          setBooks(prev => prev.map(b =>
            (b._id === id || b.id === id)
              ? { ...b, comments: [...(b.comments || []), data.comment] }
              : b
          ));
        }
      } else {
        const { data } = await api.post(`/scripts/script/${id}/comment`, { text: content });
        if (data?.success) {
          setScripts(prev => prev.map(s =>
            (s._id === id || s.id === id)
              ? { ...s, comments: [...(s.comments || []), data.comment] }
              : s
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
        if (data?.success) {
          setBooks(prev => prev.map(b =>
            (b._id === id || b.id === id)
              ? { ...b, comments: cursor ? [...(b.comments || []), ...data.comments] : data.comments }
              : b
          ));
          return data.nextCursor;
        }
      } else if (type === 'script') {
        const { data } = await api.get(`/scripts/script/${id}/comment${urlParams}`);
        if (data?.success) {
          setScripts(prev => prev.map(s =>
            (s._id === id || s.id === id)
              ? { ...s, comments: cursor ? [...(s.comments || []), ...data.comments] : data.comments }
              : s
          ));
          return data.nextCursor;
        }
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
    return null;
  };

  // These only update local state — the actual API call is made in the component
  const followUser = (targetId) => {
    if (!targetId) return;
    setCurrentUser(prev => ({
      ...prev,
      following: [...(prev.following || []), targetId]
    }));
  };

  const unfollowUser = (targetId) => {
    if (!targetId) return;
    setCurrentUser(prev => ({
      ...prev,
      following: (prev.following || []).filter(id =>
        id.toString ? id.toString() !== targetId.toString() : id !== targetId
      )
    }));
  };

  const acceptFollowRequest = async (requestId) => {
    try {
      await api.post('/user/acceptRequest', { requestId });
      setFollowRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.error(err);
    }
  };

  const rejectFollowRequest = async (requestId) => {
    try {
      await api.post('/user/rejectRequest', { requestId });
      setFollowRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.error(err);
    }
  };

  const acceptScriptAccessRequest = async (requestId) => {
    try {
      await api.post(`/scripts/script/${requestId}/accept`);
      await fetchScripts();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectScriptAccessRequest = async (requestId) => {
    try {
      await api.post(`/scripts/script/${requestId}/reject`);
      await fetchScripts();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAccount = async () => {
    try {
      await api.post('/user/profile/delete');
      setCurrentUser(null);
      localStorage.removeItem('isAuthenticated');
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const contextValue = useMemo(() => ({
    currentUser, setCurrentUser, isAuthenticated, loading,
    login, signup, verifySignup, requestPasswordReset, verifyPasswordReset,
    logout, users, followRequests, books, scripts, poems,
    addBook, addScript, addPoem, updateBook, updateScript, updateProfile,
    deleteBook, deleteScript, deletePoem, toggleLike, toggleBookmark,
    addComment, fetchComments, followUser, unfollowUser,
    acceptFollowRequest, rejectFollowRequest,
    acceptScriptAccessRequest, rejectScriptAccessRequest,
    deleteAccount,
  }), [
    currentUser, isAuthenticated, loading, users, followRequests,
    books, scripts, poems,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
