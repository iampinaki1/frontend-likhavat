import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp, api } from "../../context/Appcontext.jsx";
import {
  MessageCircle, Film, Trash2, Edit, Users, GitBranch,
  Clock, User, Maximize2, Loader2, Book, BookHeart,
  BookOpen, BookOpenCheck, UserPlus, Check, X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const BTN = "h-9 px-3 rounded-md border text-sm flex items-center gap-1.5 transition-colors hover:opacity-80";
const BTN_PRIMARY = { backgroundColor: "#D4A574", color: "#fff", border: "none" };
const BTN_OUTLINE = { borderColor: "#D4A574", color: "#D4A574" };

export function ScriptDetailPage() {
  const { scriptId } = useParams();
  const navigate = useNavigate();
  const { currentUser, toggleLike, toggleBookmark, addComment, deleteScript, updateScript } = useApp();

  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedVersionContent, setSelectedVersionContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [commentCursor, setCommentCursor] = useState(null);
  const [accessRequests, setAccessRequests] = useState([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);

  // Load script
  useEffect(() => {
    const loadScript = async () => {
      try {
        const { data } = await api.get(`/scripts/script/search?codee=${scriptId}`);
        if (data.success) {
          try {
            const commentsData = await api.get(`/scripts/script/${scriptId}/comment`);
            data.script.comments = commentsData.data.comments || [];
            setCommentCursor(commentsData.data.nextCursor || null);
          } catch {
            data.script.comments = [];
          }
          setScript(data.script);
          // Default to latest version
          const edits = data.script.edits || [];
          if (edits.length > 0) {
            const sorted = [...edits].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const latest = sorted[0];
            setSelectedVersionId(latest._id?.toString());
            setSelectedVersionContent(latest.body ?? null);
          }
        }
      } catch (err) {
        console.error("Failed to load script:", err);
      } finally {
        setLoading(false);
      }
    };
    loadScript();
  }, [scriptId]);

  // Reload version content when selection changes
  useEffect(() => {
    if (!selectedVersionId || !script) return;
    const versions = script.edits || [];
    const found = versions.find(v => (v._id || v.id)?.toString() === selectedVersionId);
    if (found) {
      // Already populated — use directly
      setSelectedVersionContent(found.body ?? null);
    } else {
      // Fetch individually
      const fetchVersion = async () => {
        setContentLoading(true);
        try {
          const { data } = await api.get(`/scripts/script/${scriptId}/version/${selectedVersionId}`);
          if (data.success) setSelectedVersionContent(data.version?.body ?? null);
        } catch (err) {
          console.error("Failed to load version:", err);
        } finally {
          setContentLoading(false);
        }
      };
      fetchVersion();
    }
  }, [selectedVersionId, script, scriptId]);

  // Load access requests for author
  useEffect(() => {
    const fetchAccessRequests = async () => {
      if (!script || !currentUser) return;
      const userId = currentUser._id || currentUser.id;
      const authorId = script.author?._id || script.author;
      if (userId?.toString() !== authorId?.toString()) return;
      try {
        setAccessLoading(true);
        const { data } = await api.get(`/scripts/script/${script._id}/requests`);
        if (data?.success) setAccessRequests(data.requests || []);
      } catch (err) {
        console.error("Failed to load access requests", err);
      } finally {
        setAccessLoading(false);
      }
    };
    fetchAccessRequests();
  }, [script, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: "#D4A574" }} />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-xl border shadow-sm max-w-md w-full p-8 text-center"
          style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
          <Film className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Script Not Found</h2>
          <Link to="/">
            <button className={BTN} style={BTN_PRIMARY}>Back to Home</button>
          </Link>
        </div>
      </div>
    );
  }

  const versions = script.edits || [];
  const comments = script.comments || [];
  const allowedUsers = script.allowedUsers || [];
  const sortedVersions = [...versions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const userId = currentUser?._id || currentUser?.id;
  const isLiked = currentUser ? (script.likes || []).some(id => id?.toString() === userId?.toString()) : false;
  const isBookmarked = currentUser ? (currentUser.bookmarksScript || []).some(id => id?.toString() === (script._id)?.toString()) : false;
  const isAuthor = userId?.toString() === (script.author?._id || script.author)?.toString();
  const isAllowedUser = allowedUsers.some(u => (u._id || u)?.toString() === userId?.toString());

  const handleLike = () => {
    setScript(prev => {
      if (!prev) return prev;
      const likes = prev.likes || [];
      const liked = likes.some(id => id?.toString() === userId?.toString());
      return { ...prev, likes: liked ? likes.filter(id => id?.toString() !== userId?.toString()) : [...likes, userId] };
    });
    toggleLike(script._id, "script");
    toast.success(isLiked ? "Removed like" : "Liked");
  };

  const handleBookmark = () => {
    toggleBookmark(script._id, "script");
    toast.success(isBookmarked ? "Removed bookmark" : "Bookmarked");
  };

  const handleRequestAccess = async () => {
    if (!currentUser) { toast.error("Please log in"); return; }
    try {
      const { data } = await api.post(`/scripts/script/${script._id}/request-access`);
      toast.success(data?.msg || "Request sent");
      setAccessRequested(true);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to request access");
    }
  };

  const handleAcceptAccess = async (request) => {
    try {
      await api.post(`/scripts/script/${request._id}/accept`);
      toast.success("Access granted");
      setAccessRequests(prev => prev.filter(r => r._id !== request._id));
      setScript(prev => prev ? { ...prev, allowedUsers: [...(prev.allowedUsers || []), request.sender] } : prev);
    } catch { toast.error("Failed to accept"); }
  };

  const handleRejectAccess = async (request) => {
    try {
      await api.post(`/scripts/script/${request._id}/reject`);
      toast.success("Request rejected");
      setAccessRequests(prev => prev.filter(r => r._id !== request._id));
    } catch { toast.error("Failed to reject"); }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment(script._id, "script", commentText);
    setCommentText("");
    toast.success("Comment added");
  };

  const loadMoreComments = async () => {
    if (!commentCursor) return;
    try {
      const { data } = await api.get(`/scripts/script/${scriptId}/comment?lastId=${commentCursor}`);
      if (data.success) {
        setScript(prev => ({ ...prev, comments: [...(prev.comments || []), ...data.comments] }));
        setCommentCursor(data.nextCursor || null);
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = () => {
    if (window.confirm("Delete script?")) {
      deleteScript(script._id);
      toast.success("Script deleted");
      navigate("/");
    }
  };

  const handleToggleVisibility = async () => {
    const newVis = script.visibility === "public" ? "private" : "public";
    try {
      await updateScript(script._id, { visibility: newVis });
      setScript(prev => ({ ...prev, visibility: newVis }));
      toast.success(`Script is now ${newVis}`);
    } catch { toast.error("Failed to update visibility"); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">

      {/* HEADER */}
      <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
        {script.image && script.image !== "no img" && (
          <img src={script.image} alt={script.title} className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <h1 className="text-2xl sm:text-3xl font-semibold">{script.title}</h1>
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: "#D4A574", color: "#fff" }}>{script.genre}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border" style={{ borderColor: "#D4A574", color: "#D4A574" }}>{script.purpose}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border" style={{ borderColor: "#E5D4C1", color: "#888" }}>{script.visibility}</span>
            </div>
          </div>
          <Link to={`/profile/${encodeURIComponent(script.author?.username)}`} className="text-sm hover:underline" style={{ color: "#D4A574" }}>
            by {script.author?.username}
          </Link>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed">{script.description}</p>

          {/* ACTION BUTTONS */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button onClick={() => navigate(`/script/${scriptId}/full-read`)} className={BTN} style={BTN_PRIMARY}>
              <Maximize2 className="w-4 h-4" /> Full Page
            </button>
            <button onClick={handleLike} className={BTN} style={BTN_OUTLINE}>
              {isLiked ? <BookHeart className="w-4 h-4" /> : <Book className="w-4 h-4" />}
              {script.likes?.length || 0}
            </button>
            <button onClick={handleBookmark} className={BTN} style={BTN_OUTLINE}>
              {isBookmarked ? <BookOpenCheck className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            </button>
            <button className={BTN} style={BTN_OUTLINE}>
              <MessageCircle className="w-4 h-4" /> {(script.comments || []).length}
            </button>
            {!isAuthor && !isAllowedUser && currentUser && (
              <button onClick={handleRequestAccess} className={BTN} style={BTN_OUTLINE} disabled={accessRequested}>
                <UserPlus className="w-4 h-4" /> {accessRequested ? "Requested" : "Request Access"}
              </button>
            )}
            {isAuthor && (
              <button onClick={handleToggleVisibility} className={BTN} style={BTN_OUTLINE}>
                {script.visibility === "public" ? "Make Private" : "Make Public"}
              </button>
            )}
            {isAuthor && (
              <button onClick={handleDelete} className={BTN} style={{ backgroundColor: "#ef4444", color: "#fff", border: "none" }}>
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VERSION HISTORY + SCRIPT CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* VERSION HISTORY */}
        <div className="border rounded-xl p-5" style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
          <h3 className="text-lg font-semibold flex items-center mb-4">
            <GitBranch className="w-4 h-4 mr-2" style={{ color: "#D4A574" }} /> Version History
          </h3>
          {sortedVersions.length === 0 && (
            <p className="text-sm text-gray-400">No versions yet.</p>
          )}
          {sortedVersions.map((version, index) => {
            const id = (version._id || version.id)?.toString();
            const isSelected = selectedVersionId === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedVersionId(id)}
                className="w-full text-left p-3 rounded-lg border mb-2 transition-colors"
                style={{
                  borderColor: isSelected ? "#D4A574" : "#E5D4C1",
                  backgroundColor: isSelected ? "#F5E6D3" : "#fff",
                }}
              >
                <div className="text-sm font-semibold" style={{ color: "#333" }}>
                  Version {sortedVersions.length - index}
                </div>
                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                  <User className="w-3 h-3 mr-1" />
                  {version.editedBy?.username || "Unknown"}
                </div>
                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                  <Clock className="w-3 h-3 mr-1" />
                  {(() => { const d = new Date(version.createdAt); return !isNaN(d) ? format(d, "MMM d, yyyy") : "—"; })()}
                </div>
                {isAuthor && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/script/${scriptId}/version/${id}/edit`); }}
                    className="mt-2 w-full px-2 py-1 text-xs rounded flex items-center justify-center gap-1 transition-colors"
                    style={{ backgroundColor: "#D4A574", color: "#fff" }}
                  >
                    <Edit className="w-3 h-3" /> Edit Version
                  </button>
                )}
              </button>
            );
          })}
        </div>

        {/* SCRIPT CONTENT */}
        <div className="lg:col-span-2 border rounded-xl p-5" style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
          <h3 className="text-lg font-semibold mb-4">Script Content</h3>
          {contentLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#D4A574" }} />
            </div>
          ) : selectedVersionContent ? (
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800">{selectedVersionContent}</pre>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No content yet. Edit a version to start writing.</p>
            </div>
          )}
        </div>
      </div>

      {/* ALLOWED USERS */}
      {allowedUsers.length > 0 && (
        <div className="border rounded-xl p-5" style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
          <h3 className="text-lg font-semibold flex items-center mb-4">
            <Users className="w-4 h-4 mr-2" style={{ color: "#D4A574" }} /> Collaborators
          </h3>
          <div className="flex flex-wrap gap-3">
            {allowedUsers.map(u => {
              const id = u._id || u;
              const name = u.username || String(id).slice(-6);
              return (
                <Link key={String(id)} to={`/profile/${encodeURIComponent(u.username)}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm hover:opacity-80"
                  style={{ borderColor: "#E5D4C1", backgroundColor: "#fff" }}>
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium text-white" style={{ backgroundColor: "#D4A574" }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  {name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ACCESS REQUESTS */}
      {isAuthor && (
        <div className="border rounded-xl p-5" style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: "#D4A574" }} /> Access Requests
          </h3>
          {accessLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#D4A574" }} />
            </div>
          ) : accessRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No pending requests.</p>
          ) : (
            accessRequests.map(request => (
              <div key={request._id} className="flex items-center justify-between border rounded-lg p-3 mb-2 bg-white" style={{ borderColor: "#E5D4C1" }}>
                <Link to={`/profile/${encodeURIComponent(request.sender?.username)}`}
                  className="font-medium text-sm hover:underline flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs text-white" style={{ backgroundColor: "#D4A574" }}>
                    {(request.sender?.username || "U").charAt(0).toUpperCase()}
                  </div>
                  {request.sender?.username || "Unknown"}
                </Link>
                <div className="flex gap-2">
                  <button onClick={() => handleAcceptAccess(request)} className={BTN} style={BTN_PRIMARY}>
                    <Check className="w-3 h-3" /> Accept
                  </button>
                  <button onClick={() => handleRejectAccess(request)} className={BTN} style={BTN_OUTLINE}>
                    <X className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* COMMENTS */}
      <div className="border rounded-xl p-5" style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
        <h3 className="text-lg font-semibold mb-4">Comments</h3>
        {currentUser && (
          <div className="mb-4">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm mb-2 focus:outline-none"
              style={{ borderColor: "#E5D4C1", backgroundColor: "#fff" }}
              placeholder="Write a comment..."
              rows={3}
            />
            <button onClick={handleComment} className={BTN} style={BTN_PRIMARY}>
              Post Comment
            </button>
          </div>
        )}
        <div className="space-y-2 mt-2">
          {comments.map(comment => (
            <div key={comment._id || comment.id} className="border rounded-lg p-3 bg-white" style={{ borderColor: "#E5D4C1" }}>
              <p className="text-sm font-semibold">{comment.author?.username || comment.username}</p>
              <p className="text-sm text-gray-600 mt-0.5">{comment.text || comment.content}</p>
            </div>
          ))}
        </div>
        {commentCursor && (
          <button onClick={loadMoreComments} className="mt-3 text-sm hover:underline" style={{ color: "#D4A574" }}>
            Load more comments
          </button>
        )}
      </div>
    </div>
  );
}

export default ScriptDetailPage;
