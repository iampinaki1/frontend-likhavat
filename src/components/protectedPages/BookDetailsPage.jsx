import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp, api } from "../../context/Appcontext.jsx";
import { MessageCircle, BookOpen, Trash2, Edit, Eye, EyeOff, Maximize2, Loader2, Book, BookHeart, BookOpenCheck, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function BookDetailPage() {

  const { bookId } = useParams();
  const { currentUser, toggleLike, toggleBookmark, addComment, deleteBook, updateBook } = useApp();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("chapters");
  const [commentCursor, setCommentCursor] = useState(null);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: "", content: "" });
  const [addingChapter, setAddingChapter] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadBook = async () => {
      try {
        const { data } = await api.get(`/books/book/${bookId}`);
        try {
          const commentsData = await api.get(`/books/book/${bookId}/comment`);
          data.comments = commentsData.data.comments || [];
          setCommentCursor(commentsData.data.nextCursor || null);
        } catch (commentErr) {
          console.error("Failed to load comments:", commentErr);
          data.comments = [];
        }
        setBook(data);
      } catch (err) {
        console.error("Failed to load full book:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBook();
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-8 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Book Not Found</h2>
            <p className="text-gray-600 mb-4">
              The book you're looking for doesn't exist.
            </p>

            <Link to="/">
              <button className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isLiked = currentUser ? (book.likes || []).includes(currentUser._id || currentUser.id) : false;
  const isBookmarked = currentUser ? (currentUser.bookmarksBook || []).includes(book._id || book.id) : false;
  const isAuthor = (currentUser?._id || currentUser?.id) === (book.author?._id || book.author);
  const canEdit = isAuthor;

  const handleLike = () => {
    if (!currentUser) return;
    const uid = currentUser._id || currentUser.id;
    const id = book._id || book.id;
    const liked = (book.likes || []).includes(uid);
    // Optimistic local update
    setBook(prev => ({
      ...prev,
      likes: liked ? prev.likes.filter(x => x !== uid) : [...(prev.likes || []), uid]
    }));
    toggleLike(id, "book");
    toast.success(liked ? "Unliked" : "Liked!");
  };

  const handleBookmark = () => {
    toggleBookmark(book._id || book.id, "book");
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
  };

  const handleComment = () => {
    if (!commentText.trim()) return;

    addComment(book._id || book.id, "book", commentText);
    setCommentText("");
    toast.success("Comment added!");
  };

  const loadMoreComments = async () => {
    if (!commentCursor) return;
    try {
      const { data } = await api.get(`/books/book/${bookId}/comment?lastId=${commentCursor}`);
      if (data && data.success) {
        setBook((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), ...data.comments]
        }));
        setCommentCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error("Failed to load more comments:", err);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      deleteBook(book._id || book.id);
      toast.success("Book deleted successfully");
      navigate("/");
    }
  };

  const handleToggleVisibility = async () => {
    const newVisibility = book.visibility === "public" ? "private" : "public";
    
    try {
      await updateBook(book._id || book.id, {
        visibility: newVisibility,
      });

      // Update local state immediately
      setBook(prev => ({
        ...prev,
        visibility: newVisibility
      }));

      toast.success(`Book is now ${newVisibility}`);
    } catch (err) {
      console.error("Failed to update visibility:", err);
      toast.error("Failed to update visibility");
    }
  };

  const sortedChapters = [...(book.chapters || [])].sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );

  const handleAddChapter = async () => {
    if (!newChapter.title.trim() || !newChapter.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setAddingChapter(true);
    try {
      const nextNumber = sortedChapters.length + 1;
      const { data } = await api.post('/books/chapter', {
        title: newChapter.title,
        content: newChapter.content,
        chapterNumber: nextNumber,
        bookId: book._id || book.id,
      });
      setBook(prev => ({
        ...prev,
        chapters: [...(prev.chapters || []), data],
      }));
      setNewChapter({ title: "", content: "" });
      setShowAddChapter(false);
      toast.success("Chapter added!");
    } catch (err) {
      toast.error("Failed to add chapter");
    } finally {
      setAddingChapter(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* BOOK HEADER */}

      <div
        className="rounded-xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
      >

        <div className="p-6">

          <h1 className="text-3xl font-bold mb-2">
            {book.title}
          </h1>

          <p className="text-gray-500 mb-4">
            by {book.authorName}
          </p>

          <div className="flex gap-4 flex-wrap items-center">

            <button onClick={handleLike} className="flex items-center gap-1" title="Like">
              {isLiked ? (
                <BookHeart className="w-5 h-5 text-red-500" />
              ) : (
                <Book className="w-5 h-5" />
              )}
              <span>{book.likes?.length || 0}</span>
            </button>

            <button onClick={handleBookmark} className="flex items-center gap-1" title="Bookmark">
              {isBookmarked ? (
                <BookOpenCheck className="w-5 h-5 text-blue-500" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </button>

            <button className="flex items-center gap-1" title="Comments">
              <MessageCircle className="w-5 h-5" />
              <span>{book.comments?.length || 0}</span>
            </button>

            {canEdit && (
              <>
                <button
                  onClick={handleToggleVisibility}
                  className="h-9 px-3 border rounded-md text-sm"
                >
                  {book.visibility === "public" ? "Make Private" : "Make Public"}
                </button>

                <button
                  onClick={handleDelete}
                  className="h-9 px-3 bg-red-500 text-white rounded-md text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}

          </div>

        </div>

      </div>

      {/* TABS */}

      <div>

        <div className="flex gap-4">

          <button onClick={() => setActiveTab("chapters")}>
            Chapters
          </button>

          <button onClick={() => setActiveTab("comments")}>
            Comments
          </button>

        </div>

        {/* CHAPTERS */}

        {activeTab === "chapters" && (
          <div className="space-y-4 mt-4">

            {canEdit && (
              <button
                onClick={() => setShowAddChapter(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: '#D4A574' }}
              >
                <Plus className="w-4 h-4" />
                Add Chapter
              </button>
            )}

            {/* Add Chapter Modal */}
            {showAddChapter && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Add New Chapter</h2>
                    <button onClick={() => setShowAddChapter(false)}>
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <input
                    placeholder="Chapter title"
                    value={newChapter.title}
                    onChange={e => setNewChapter(p => ({ ...p, title: e.target.value }))}
                    className="w-full border rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2"
                    style={{ borderColor: '#E5D4C1' }}
                  />
                  <textarea
                    placeholder="Chapter content..."
                    value={newChapter.content}
                    onChange={e => setNewChapter(p => ({ ...p, content: e.target.value }))}
                    rows={8}
                    className="w-full border rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 resize-none"
                    style={{ borderColor: '#E5D4C1' }}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddChapter(false)}
                      className="px-4 py-2 rounded-md text-sm border"
                      style={{ borderColor: '#E5D4C1' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddChapter}
                      disabled={addingChapter}
                      className="px-4 py-2 rounded-md text-sm text-white flex items-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: '#D4A574' }}
                    >
                      {addingChapter && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Chapter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {sortedChapters.map((chapter) => (
              <div
                key={chapter._id || chapter.id}
                className="border p-4 rounded-lg mb-4"
                style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
              >

                <h2 className="text-xl font-semibold">
                  {chapter.title}
                </h2>

                <p className="text-gray-500">
                  Updated {chapter.updatedAt && !isNaN(new Date(chapter.updatedAt)) ? format(new Date(chapter.updatedAt), "MMM d, yyyy") : 'N/A'}
                </p>

                <div className="flex gap-2 mt-2">
                  <Link to={`/book/${bookId}/read/${chapter._id || chapter.id}`}>
                    <button className="bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600">
                      Read
                    </button>
                  </Link>

                  {canEdit && (
                    <Link to={`/book/${bookId}/chapter/${chapter._id || chapter.id}/edit`}>
                      <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center gap-1">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </Link>
                  )}
                </div>

              </div>
            ))}

          </div>
        )}

        {/* COMMENTS */}

        {activeTab === "comments" && (
          <div className="space-y-4 mt-4">

            {currentUser && (

              <div
                className="border p-4 rounded-lg mb-4"
                style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
              >

                <textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full border p-2 rounded mb-2"
                />

                <button
                  onClick={handleComment}
                  className="bg-amber-500 text-white px-4 py-2 rounded"
                >
                  Post Comment
                </button>

              </div>
            )}

            <div className="max-h-72 overflow-y-auto pr-2 mt-4">
              {(book.comments || []).map((comment) => (

                <div
                  key={comment._id || comment.id}
                  className="border p-4 rounded-lg mb-2"
                  style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
                >

                  <p className="font-semibold">
                    {comment.author?.username || comment.username}
                  </p>

                  <p className="text-gray-600">
                    {comment.text || comment.content}
                  </p>

                </div>

              ))}

              {commentCursor && (
                <button
                  onClick={loadMoreComments}
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

export default BookDetailPage;