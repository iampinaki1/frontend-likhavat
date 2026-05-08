import React, { useState, useEffect, useCallback } from "react";
import { useApp, api } from "../../context/Appcontext.jsx";
import { MessageCircle, BookOpen, Eye, EyeOff, Loader2, Book, BookHeart, BookOpenCheck } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export function HomePage() {

  const { currentUser, toggleLike, toggleBookmark, addComment } = useApp();

  const [feed, setFeed] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentContent, setCommentContent] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentCursors, setCommentCursors] = useState({});

  const fetchFeed = useCallback(async (lastId = null) => {
    try {
      const [booksRes, scriptsRes] = await Promise.all([
        api.get(`/books/book${lastId ? `?lastId=${lastId}` : ''}`),
        api.get(`/scripts/script${lastId ? `?lastId=${lastId}` : ''}`),
      ]);
      const newBooks = (booksRes.data?.books || []).map(b => ({
        ...b, type: "book",
        coverImage: b.image && b.image !== "no img" ? b.image : null,
      }));
      const newScripts = (scriptsRes.data?.scripts || []).map(s => ({
        ...s, type: "script",
        coverImage: s.image && s.image !== "no img" ? s.image : null,
      }));
      const merged = [...newBooks, ...newScripts]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (lastId) {
        setFeed(prev => [...prev, ...merged]);
      } else {
        setFeed(merged);
      }

      // Use the later of the two cursors as next page marker
      const nextCursor = booksRes.data?.nextCursor || scriptsRes.data?.nextCursor || null;
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setFeedLoading(true);
      await fetchFeed();
      setFeedLoading(false);
    };
    load();
  }, [fetchFeed]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchFeed(cursor);
    setLoadingMore(false);
  };

  const handleLike = (id, type) => {
    const uid = currentUser?._id || currentUser?.id;
    if (!uid) return;
    setFeed(prev => prev.map(item => {
      if ((item._id || item.id) !== id) return item;
      const likes = item.likes || [];
      const isLiked = likes.some(l => (l._id || l)?.toString() === uid?.toString());
      toast.success(isLiked ? "Removed like" : "Liked");
      return {
        ...item,
        likes: isLiked
          ? likes.filter(l => (l._id || l)?.toString() !== uid?.toString())
          : [...likes, uid],
      };
    }));
    toggleLike(id, type);
  };

  const handleBookmark = (id, type) => {
    const isBookmarked = type === "book"
      ? (currentUser?.bookmarksBook || []).some(x => x?.toString() === id?.toString())
      : (currentUser?.bookmarksScript || []).some(x => x?.toString() === id?.toString());
    toast.success(isBookmarked ? "Removed bookmark" : "Bookmarked");
    toggleBookmark(id, type);
  };

  const handleComment = async (id, type) => {
    const content = commentContent[id];
    if (!content?.trim()) return;
    setCommentContent(prev => ({ ...prev, [id]: "" }));
    const newComment = await addComment(id, type, content);
    if (newComment) {
      setFeed(prev => prev.map(item =>
        (item._id || item.id) === id
          ? { ...item, comments: [...(item.comments || []), newComment] }
          : item
      ));
      toast.success("Comment added");
    }
  };

  const toggleCommentsVisibility = async (id, type) => {
    if (!showComments[id]) {
      try {
        const endpoint = type === 'book'
          ? `/books/book/${id}/comment`
          : `/scripts/script/${id}/comment`;
        const { data } = await api.get(endpoint);
        if (data?.success) {
          setFeed(prev => prev.map(item =>
            (item._id || item.id) === id
              ? { ...item, comments: data.comments || [] }
              : item
          ));
          setCommentCursors(prev => ({ ...prev, [id]: data.nextCursor || null }));
        }
      } catch (e) { console.error(e); }
    }
    setShowComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const loadMoreComments = async (id, type) => {
    const cursor = commentCursors[id];
    if (!cursor) return;
    try {
      const endpoint = type === 'book'
        ? `/books/book/${id}/comment?lastId=${cursor}`
        : `/scripts/script/${id}/comment?lastId=${cursor}`;
      const { data } = await api.get(endpoint);
      if (data?.success) {
        setFeed(prev => prev.map(item =>
          (item._id || item.id) === id
            ? { ...item, comments: [...(item.comments || []), ...(data.comments || [])] }
            : item
        ));
        setCommentCursors(prev => ({ ...prev, [id]: data.nextCursor || null }));
      }
    } catch (e) { console.error(e); }
  };

  const renderContentCard = (item) => {
    const isPublic = item.visibility === "public";
    const commentsArray = item.comments || [];

    return (
    <div
      key={`${item.type}-${item.id || item._id}`}
      className="rounded-xl border shadow-sm overflow-hidden mb-6"
      style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
    >

      <div className="p-6">

        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center space-x-3">

            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold overflow-hidden flex-shrink-0">
              {item.author?.profilePic ? (
                <img src={item.author.profilePic} alt={item.author.username} className="h-full w-full object-cover" />
              ) : (
                <span>{(item.author?.username || "U").charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div>

              <Link to={`/profile/${encodeURIComponent(item.author?.username || "")}`} className="font-semibold hover:underline">
                {item.author?.username || "Unknown"}
              </Link>

              <p className="text-sm text-gray-500">
                {format(new Date(item.createdAt), "MMM d, yyyy")}
              </p>

            </div>

          </div>

          <span
            className={`px-2 py-1 text-xs rounded-full border ${
              isPublic ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {isPublic ? "Public" : "Private"}
          </span>

        </div>

        {item.coverImage && (
          <img
            src={item.coverImage}
            alt={item.title}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
        )}

        <Link to={item.type === "book" ? `/book/${item._id}` : `/script/${item._id}`}>
          <h2 className="text-2xl font-semibold hover:text-blue-600">
            {item.title}
          </h2>
        </Link>

        <p className="text-gray-600 mb-4">{item.description}</p>

        <div className="flex items-center space-x-4">

          <button
            onClick={() => handleLike(item._id, item.type)}
            className="flex items-center space-x-1"
            title="Like"
          >
            {(item.likes || []).some(l => (l._id || l)?.toString() === (currentUser?._id || currentUser?.id)?.toString()) ? (
              <BookHeart className="w-5 h-5 text-red-500" />
            ) : (
              <Book className="w-5 h-5" />
            )}
            <span>{(item.likes || []).length}</span>
          </button>

          <button
            onClick={() => handleBookmark(item._id, item.type)}
            className="flex items-center space-x-1"
            title="Bookmark"
          >
            {(item.type === "book" ? (currentUser?.bookmarksBook || []) : (currentUser?.bookmarksScript || [])).includes(item._id) ? (
              <BookOpenCheck className="w-5 h-5 text-blue-500" />
            ) : (
              <BookOpen className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={() => toggleCommentsVisibility(item._id, item.type)}
            className="flex items-center space-x-1"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{commentsArray.length}</span>
          </button>

          <button
            onClick={() => toggleCommentsVisibility(item._id, item.type)}
            className="flex items-center space-x-1 ml-auto"
          >
            {showComments[item._id] ? (
              <>
                <EyeOff className="w-5 h-5" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                <span>View</span>
              </>
            )}
          </button>

        </div>

        {showComments[item._id] && (

          <div className="mt-4 space-y-4 border-t pt-4">

            <textarea
              placeholder="Add a comment..."
              value={commentContent[item._id] || ""}
              onChange={(e) =>
                setCommentContent({
                  ...commentContent,
                  [item._id]: e.target.value,
                })
              }
              className="w-full border rounded-md p-2"
            />

            <button
              onClick={() => handleComment(item._id, item.type)}
              className="bg-[#D4A574] text-white px-3 py-1 rounded"
            >
              Post Comment
            </button>

            <div className="max-h-72 overflow-y-auto pr-2 mt-4 space-y-2">
              {commentsArray.map((comment, index) => (

                <div key={comment._id || index} className="text-sm">

                  <Link
                    to={`/profile/${encodeURIComponent(comment.author?.username || comment.username)}`}
                    className="font-semibold"
                  >
                    {comment.author?.username || comment.username}
                  </Link>

                  <p>{comment.text || comment.content}</p>

                </div>

              ))}

              {commentCursors[item._id] && (
                <button
                  onClick={() => loadMoreComments(item._id, item.type)}
                  className="text-sm text-blue-500 hover:underline mt-2 inline-block w-full text-center p-2"
                >
                  Load More Comments
                </button>
              )}
            </div>

          </div>

        )}

      </div>
    </div>

  );
  }

  return (

    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">

      <h1 className="w-full py-3 px-4 sm:py-4 text-2xl sm:text-3xl rounded-xl border bg-white text-blue-950 font-semibold text-center mb-8" style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
        Discover
      </h1>

      {feedLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin w-8 h-8" style={{ color: "#D4A574" }} />
        </div>
      ) : (
        feed.map(renderContentCard)
      )}

      {loadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin w-8 h-8" style={{ color: "#D4A574" }} />
        </div>
      )}

      {!feedLoading && !loadingMore && hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            className="border bg-amber-200 font-bold px-4 py-2 rounded-md"
          >
            Load More
          </button>
        </div>
      )}

    </div>

  );

}

export default HomePage;