import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../context/Appcontext.jsx";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ChapterEditPage() {
  const { bookId, chapterId } = useParams();
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBookAndChapter = async () => {
      try {
        const { data } = await api.get(`/books/book/${bookId}`);
        if (data) {
          setBook(data);
          const foundChapter = data.chapters?.find(ch => ch._id === chapterId);
          if (foundChapter) {
            setChapter(foundChapter);
            setTitle(foundChapter.title || "");
            setContent(foundChapter.content || "");
          }
        }
      } catch (err) {
        console.error("Failed to load book and chapter:", err);
        toast.error("Failed to load chapter");
      } finally {
        setLoading(false);
      }
    };
    loadBookAndChapter();
  }, [bookId, chapterId]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Chapter title cannot be empty");
      return;
    }
    if (!content.trim()) {
      toast.error("Chapter content cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/books/chapter/${chapterId}`, {
        title,
        content
      });
      
      if (response.data?.success) {
        toast.success("Chapter saved successfully");
        navigate(`/book/${bookId}`);
      }
    } catch (err) {
      console.error("Failed to save chapter:", err);
      toast.error(err.response?.data?.msg || "Failed to save chapter");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-xl border shadow-sm w-full max-w-md p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Chapter Not Found</h2>
          <button
            onClick={() => navigate(`/book/${bookId}`)}
            className="h-10 px-4 rounded-md mt-4"
            style={{ backgroundColor: "#D4A574", color: "#FFFFFF" }}
          >
            Back to Book
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF8ED" }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/book/${bookId}`)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "#D4A574" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Book
            </button>
            <h1 className="text-2xl font-bold text-center flex-1">{book?.title}</h1>
            <div className="w-32" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor Panel */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold">Edit Chapter</h2>
              </div>
              
              {/* Chapter Title */}
              <div className="p-4 border-b">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter chapter title..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Chapter Content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your chapter content here..."
                className="w-full h-96 p-4 resize-none focus:outline-none border-none"
                style={{ lineHeight: "1.8" }}
              />
              
              <div className="p-4 bg-gray-50 border-t flex gap-2 justify-end">
                <button
                  onClick={() => navigate(`/book/${bookId}`)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: saving ? "#999" : "#D4A574" }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Chapter
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Chapter Info */}
            <div className="rounded-xl border shadow-sm p-4 bg-white">
              <h3 className="font-semibold mb-3">Chapter Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">CHAPTER NUMBER</p>
                  <p className="font-medium">{chapter.chapterNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">BOOK</p>
                  <p className="font-medium">{book?.title}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">CHARACTER COUNT</p>
                  <p className="font-medium">{content.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">WORD COUNT</p>
                  <p className="font-medium">
                    {content.trim().split(/\s+/).filter(w => w).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChapterEditPage;
