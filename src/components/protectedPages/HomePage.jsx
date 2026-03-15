import React, { useState, useEffect } from "react";
import { useApp } from "../../context/Appcontext.jsx";
import { MessageCircle, BookOpen, Film, Eye, EyeOff, Loader2, Book, BookHeart, BookOpenCheck } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export function HomePage() {

  const { books, scripts, currentUser, toggleLike, toggleBookmark, addComment, fetchComments } = useApp();

  const [commentContent, setCommentContent] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentCursors, setCommentCursors] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");

  const itemsPerPage = 5;

  const publicBooks = books
    .filter(
      (book) => book.visibility === "public" || book.author === currentUser?.id
    )
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const publicScripts = scripts
    .filter(
      (script) =>
        script.visibility === "public" ||
        (script.author?._id || script.author)?.toString() === (currentUser?._id || currentUser?.id)?.toString() ||
        (script.allowedUsers || []).some(u => (u._id || u)?.toString() === (currentUser?._id || currentUser?.id)?.toString())
    )
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const loadMore = () => {
    setLoading(true);

    setTimeout(() => {
      setPage(page + 1);
      setLoading(false);
    }, 500);
  };

  const handleLike = (id, type) => {
    toggleLike(id, type);
  };

  const handleBookmark = (id, type) => {
    toggleBookmark(id, type);
  };

  const handleComment = (id, type) => {
    const content = commentContent[id];

    if (content && content.trim()) {
      addComment(id, type, content);
      setCommentContent({ ...commentContent, [id]: "" });
    }
  };

  const toggleCommentsVisibility = async (id, type) => {
    if (!showComments[id]) {
      const nextCursor = await fetchComments(id, type);
      setCommentCursors((prev) => ({ ...prev, [id]: nextCursor }));
    }
    setShowComments({ ...showComments, [id]: !showComments[id] });
  };

  const loadMoreComments = async (id, type) => {
    const cursor = commentCursors[id];
    if (cursor) {
      const nextCursor = await fetchComments(id, type, cursor);
      setCommentCursors((prev) => ({ ...prev, [id]: nextCursor }));
    }
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

            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
              {(item.author?.username || "U").charAt(0).toUpperCase()}
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

      {[...publicBooks.map((b) => ({ ...b, type: "book" })), ...publicScripts.map((s) => ({ ...s, type: "script" }))]

        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        .slice(0, page * itemsPerPage)

        .map(renderContentCard)}

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      )}

      {!loading &&
        [...publicBooks, ...publicScripts].length > page * itemsPerPage && (

          <div className="flex justify-center py-4">

            <button
              onClick={loadMore}
              className="border bg-amber-200  font-bold px-4 py-2 rounded-md"
            >
              Load More
            </button>

          </div>

        )}

    </div>

  );

}

export default HomePage;