
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp, api } from "../../context/Appcontext.jsx";
import {
  MessageCircle,
  Film,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Users,
  GitBranch,
  Clock,
  User,
  Maximize2,
  Loader2,
  Book,
  BookHeart,
  BookOpen,
  BookOpenCheck,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function ScriptDetailPage() {

  const { scriptId } = useParams();
  const navigate = useNavigate();

  const {
    currentUser,
    toggleLike,
    toggleBookmark,
    addComment,
    deleteScript,
    updateScript
  } = useApp();

  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [commentCursor, setCommentCursor] = useState(null);
  const [accessRequests, setAccessRequests] = useState([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);

  
   useEffect(() => {
  const loadScript = async () => {
      try {
        const { data } = await api.get(`/scripts/script/search?codee=${scriptId}`);
        if (data.success) {
          try {
            const commentsData = await api.get(`/scripts/script/${scriptId}/comment`);
            data.script.comments = commentsData.data.comments || [];
            setCommentCursor(commentsData.data.nextCursor || null);
          } catch (commentErr) {
            console.error("Failed to load comments:", commentErr);
            data.script.comments = [];
          }
          setScript(data.script);
        }
      } catch (err) {
        console.error("Failed to load script:", err);
      } finally {
        setLoading(false);
      }
    };
    loadScript();
  }, [scriptId]);

  // Load access requests only for the author
  useEffect(() => {
    const fetchAccessRequests = async () => {
      if (!script || !currentUser) return;
      const userIdLocal = currentUser._id || currentUser.id;
      const authorId = script.author?._id || script.author;
      if (userIdLocal !== authorId) return;

      try {
        setAccessLoading(true);
        const { data } = await api.get(`/scripts/script/${script._id || script.id}/requests`);
        if (data && data.success) {
          setAccessRequests(data.requests || []);
        }
      } catch (err) {
        console.error("Failed to load script access requests", err);
      } finally {
        setAccessLoading(false);
      }
    };
    fetchAccessRequests();
  }, [script, currentUser]);

  /* ---------------- LOADING ---------------- */

  if (loading) {

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500"/>
      </div>
    );

  }

  if (!script) {

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="rounded-xl border shadow-sm max-w-md w-full p-8 text-center"
          style={{backgroundColor:"#FFF8ED",borderColor:"#E5D4C1"}}
        >
          <Film className="w-16 h-16 mx-auto mb-4 text-gray-400"/>
          <h2 className="text-xl font-semibold mb-2">Script Not Found</h2>

          <Link to="/">
            <button
              className="h-10 px-4 rounded-md shadow"
              style={{backgroundColor:"#D4A574",color:"#fff"}}
            >
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );

  }

  /* ---------------- DATA NORMALIZATION ---------------- */

  // Backend stores versions in `edits` field
  const versions = script.edits || [];
  const comments = script.comments || [];
  const allowedUsers = script.allowedUsers || [];

  const sortedVersions = [...versions].sort(
    (a,b)=>new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)
  );

  const currentVersion =
    versions.find(v => (v._id || v.id) === script.currentVersion) ||
    sortedVersions[0];

  const selectedVersion = selectedVersionId
    ? versions.find(v => (v._id || v.id) === selectedVersionId)
    : currentVersion;

  /* ---------------- EDIT MODEL ---------------- */

  const edits = [];

  const displayedContent =
    selectedVersion?.body ||
    selectedVersion?.content ||
    script.content ||
    "No content";

  /* ---------------- USER PERMISSIONS ---------------- */

  const userId = currentUser?._id || currentUser?.id;

  const isLiked = currentUser
    ? (script.likes || []).includes(userId)
    : false;

  const isBookmarked = currentUser
    ? (currentUser.bookmarksScript || []).includes(script._id || script.id)
    : false;

  const isAuthor = userId === (script.author?._id || script.author);

  const isAllowedUser = allowedUsers.some(u => (u._id || u) === userId || (u._id || u)?.toString() === userId?.toString());

  const canEdit = isAuthor;

  /* ---------------- ACTIONS ---------------- */

  const handleLike = () => {
    // Optimistically update likes locally for instant UI feedback
    setScript(prev => {
      if (!prev) return prev;
      const currentLikes = prev.likes || [];
      const hasLiked = currentLikes.includes(userId);
      return {
        ...prev,
        likes: hasLiked
          ? currentLikes.filter(id => id !== userId)
          : [...currentLikes, userId]
      };
    });

    toggleLike(script._id || script.id, "script");
    toast.success(isLiked ? "Removed like" : "Liked");
  };

  const handleBookmark = () => {

    toggleBookmark(script._id || script.id,"script");

    toast.success(isBookmarked ? "Removed bookmark" : "Bookmarked");

  };

  const handleRequestAccess = async () => {
    if (!currentUser) {
      toast.error("Please log in to request access");
      return;
    }
    try {
      const { data } = await api.post(`/scripts/script/${script._id || script.id}/request-access`);
      if (data && data.success) {
        toast.success(data.msg || "Access request sent");
        setAccessRequested(true);
      } else {
        toast.success(data?.msg || "Request sent");
      }
    } catch (err) {
      console.error("Request access error", err);
      toast.error(err.response?.data?.msg || "Failed to request access");
    }
  };

  const handleAcceptAccess = async (request) => {
    try {
      await api.post(`/scripts/script/${request._id}/accept`);
      toast.success("Access request accepted");
      setAccessRequests(prev => prev.filter(r => r._id !== request._id));
      setScript(prev => prev ? {
        ...prev,
        allowedUsers: [...(prev.allowedUsers || []), request.sender?._id || request.sender],
      } : prev);
    } catch (err) {
      console.error("Accept access error", err);
      toast.error("Failed to accept access request");
    }
  };

  const handleRejectAccess = async (request) => {
    try {
      await api.post(`/scripts/script/${request._id}/reject`);
      toast.success("Access request rejected");
      setAccessRequests(prev => prev.filter(r => r._id !== request._id));
    } catch (err) {
      console.error("Reject access error", err);
      toast.error("Failed to reject access request");
    }
  };

  const handleComment = () => {

    if(!commentText.trim()) return;

    addComment(script._id || script.id,"script",commentText);

    setCommentText("");

    toast.success("Comment added");

  };

  const loadMoreComments = async () => {

    if(!commentCursor) return;

    try{

      const {data} = await api.get(`/scripts/script/${scriptId}/comment?lastId=${commentCursor}`);

      if(data.success){

        setScript(prev=>({

          ...prev,
          comments:[...(prev.comments || []),...data.comments]

        }));

        setCommentCursor(data.nextCursor || null);

      }

    }catch(err){

      console.error("Load comments error",err);

    }

  };

  const handleDelete = () => {

    if(window.confirm("Delete script?")){

      deleteScript(script._id || script.id);

      toast.success("Script deleted");

      navigate("/");

    }

  };

  const handleToggleVisibility = async () => {
    const newVisibility = script.visibility === "public" ? "private" : "public";
    
    try {
      await updateScript(script._id || script.id, {
        visibility: newVisibility
      });
      
      // Update local state immediately
      setScript(prev => ({
        ...prev,
        visibility: newVisibility
      }));
      
      toast.success(`Script is now ${newVisibility}`);
    } catch (err) {
      console.error("Failed to update visibility:", err);
      toast.error("Failed to update visibility");
    }
  };

  /* ---------------- UI ---------------- */

  return (

    <div className="max-w-7xl mx-auto space-y-6">

      {/* HEADER */}

      <div
        className="rounded-xl border shadow-sm overflow-hidden"
        style={{backgroundColor:"#FFF8ED",borderColor:"#E5D4C1"}}
      >

        <div className="p-6">

          <h1 className="text-3xl font-semibold mb-2">{script.title}</h1>

          <Link to={`/profile/${script.author?.username}`} className="text-sm hover:underline">
            by {script.author?.username}
          </Link>

          <p className="text-gray-600 mt-4">{script.description}</p>

          {/* ACTION BUTTONS */}

          <div className="flex gap-2 mt-4 flex-wrap">

            <button
              onClick={()=>navigate(`/script/${scriptId}/full-read`)}
              className="h-9 px-3 rounded-md"
              style={{backgroundColor:"#D4A574",color:"#fff"}}
            >
              <Maximize2 className="w-4 h-4 inline mr-1"/>
              Full Page
            </button>

            <button
              onClick={handleLike}
              className="h-9 px-3 border rounded flex items-center gap-1"
            >
              {isLiked
                ? <BookHeart className="w-4 h-4 text-red-500"/>
                : <Book className="w-4 h-4"/>}

              {script.likes?.length || 0}

            </button>

            <button
              onClick={handleBookmark}
              className="h-9 px-3 border rounded flex items-center gap-1"
            >
              {isBookmarked
                ? <BookOpenCheck className="w-4 h-4 text-blue-500"/>
                : <BookOpen className="w-4 h-4"/>}
            </button>

            {/* Request access: visible to non-author users who don't already have access */}
            {!isAuthor && !isAllowedUser && currentUser && (
              <button
                onClick={handleRequestAccess}
                className="h-9 px-3 border rounded flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                <span>{accessRequested ? "Requested" : "Request Access"}</span>
              </button>
            )}

            {/* <button className="h-9 px-3 border rounded flex items-center gap-1">
              <MessageCircle className="w-4 h-4"/>
              {comments.length}
            </button> */}
             <button className="h-9 px-3 border rounded-md flex items-center gap-1">
               <MessageCircle className="w-4 h-4" />
              {(script.comments || []).length}
          </button>

            {canEdit && (
              <>
                <button
                  onClick={handleToggleVisibility}
                  className="h-9 px-3 border rounded-md"
                >
                  {script.visibility === "public" ? "Make Private":"Make Public"}
                </button>
              </>
            )}

            {isAuthor && (
              <button
                onClick={handleDelete}
                className="h-9 px-3 bg-red-500 text-white rounded-md"
              >
                <Trash2 className="w-4 h-4 inline mr-1"/>
                Delete
              </button>
            )}

          </div>

        </div>

      </div>


      {/* VERSION + SCRIPT VIEW */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* VERSION HISTORY */}

        <div
          className="border rounded-xl p-6"
          style={{backgroundColor:"#FFF8ED",borderColor:"#E5D4C1"}}
        >

          <h3 className="text-xl font-semibold flex items-center mb-4">
            <GitBranch className="w-5 h-5 mr-2"/>
            Version History
          </h3>

          {sortedVersions.map((version,index)=>{

            const id = version._id || version.id;

            const isSelected = (selectedVersion?._id || selectedVersion?.id) === id;

            return(

              <button
                key={id}
                onClick={()=>setSelectedVersionId(id)}
                className={`w-full text-left p-3 rounded border mb-2 ${isSelected?"bg-gray-100":""}`}
              >

                <div className="text-sm font-semibold">
                  Version {sortedVersions.length-index}
                </div>

                <div className="text-xs text-gray-500 flex items-center">
                  <User className="w-3 h-3 mr-1"/>
                  {version.editedBy?.username || version.editorName || "Unknown"}
                </div>

                <div className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1"/>
                  {(() => {
                    const d = new Date(version.timestamp || version.createdAt);
                    return !isNaN(d) ? format(d, "MMM d") : "—";
                  })()}
                </div>

                <div className="text-xs text-gray-500">
                  {version.body ? 1 : 0} edits
                </div>

                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/script/${scriptId}/version/${id}/edit`);
                    }}
                    className="mt-2 w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Edit Version
                  </button>
                )}

              </button>

            );

          })}

        </div>


        {/* SCRIPT CONTENT */}

        <div
          className="lg:col-span-2 border rounded-xl p-6"
          style={{backgroundColor:"#FFF8ED",borderColor:"#E5D4C1"}}
        >

          <h3 className="text-xl font-semibold mb-4">Script Content</h3>

          <pre className="whitespace-pre-wrap font-mono text-sm">
            {displayedContent}
          </pre>

        </div>

      </div>


      {/* ALLOWED USERS */}

      {allowedUsers.length > 0 && (

        <div
          className="border rounded-xl p-6"
          style={{backgroundColor:"#FFF8ED",borderColor:"#E5D4C1"}}
        >

          <h3 className="text-xl font-semibold flex items-center mb-4">
            <Users className="w-5 h-5 mr-2"/>
            Allowed Users
          </h3>

          {allowedUsers.map(u => {
            const id = u._id || u;
            const name = u.username || String(id).slice(-6);
            return (
              <div key={String(id)} className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {name.charAt(0).toUpperCase()}
                </div>
                <Link to={`/profile/${u.username}`} className="text-sm hover:underline">
                  {name}
                </Link>
              </div>
            );
          })}

        </div>

      )}

      {/* ACCESS REQUESTS (only for author) */}
      {isAuthor && (
        <div
          className="border rounded-xl p-6"
          style={{backgroundColor:"#FFF8ED",borderColor:"#E5D4C1"}}
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Access Requests
          </h3>

          {accessLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : accessRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No pending access requests.</p>
          ) : (
            accessRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between border rounded-lg p-3 mb-2"
                style={{backgroundColor:"#FFF8ED",borderColor:"#E5D4C1"}}
              >
                <Link
                  to={`/profile/${request.sender?.username}`}
                  className="font-semibold hover:underline flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {(request.sender?.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <span>{request.sender?.username || "Unknown"}</span>
                </Link>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptAccess(request)}
                    className="h-8 px-3 rounded-md bg-gray-900 text-white text-xs flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectAccess(request)}
                    className="h-8 px-3 rounded-md border text-xs flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}


      {/* COMMENTS */}

      <div
        className="border rounded-xl p-6"
        style={{backgroundColor:"#FFF8ED",borderColor:"#E5D4C1"}}
      >

        <h3 className="text-xl font-semibold mb-4">Comments</h3>

        {currentUser && (

          <div className="mb-4">

            <textarea
              value={commentText}
              onChange={(e)=>setCommentText(e.target.value)}
              className="w-full border p-2 rounded mb-2"
              placeholder="Write comment"
            />

            <button
              onClick={handleComment}
              className="px-4 py-2 bg-amber-500 text-white rounded"
            >
              Post Comment
            </button>

          </div>

        )}

        <div className="max-h-72 overflow-y-auto pr-2 mt-2">
          {comments.map(comment=>(
            <div
              key={comment._id || comment.id}
              className="border p-4 rounded-lg mb-2"
              style={{backgroundColor:"#FFF8ED",borderColor:"#E5D4C1"}}
            >
              <p className="font-semibold">
                {comment.author?.username || comment.username}
              </p>
              <p className="text-gray-600">
                {comment.text || comment.content}
              </p>
            </div>
          ))}
        </div>

        {commentCursor && (
          <button
            onClick={loadMoreComments}
            className="text-blue-500 hover:underline"
          >
            Load More
          </button>
        )}

      </div>

    </div>

  );

}

export default ScriptDetailPage;