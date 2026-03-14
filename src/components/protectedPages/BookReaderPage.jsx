import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../context/Appcontext.jsx";
import { ChevronLeft, ChevronRight, X, BookOpen, List, Loader2 } from "lucide-react";

export function BookReaderPage() {

  const { bookId, chapterId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/books/book/${bookId}`);
        setBook(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#FFF8ED" }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#D4A574' }} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-xl border shadow-sm w-full max-w-md overflow-hidden p-8 text-center" style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Book Not Found</h2>
          <p className="text-gray-600 mb-4">The book you're looking for doesn't exist.</p>
          <Link to="/"><button className="h-10 py-2 px-4 rounded-md shadow" style={{ backgroundColor: "#D4A574", color: "#FFFFFF" }}>Back to Home</button></Link>
        </div>
      </div>
    );
  }

  const sortedChapters = [...(book.chapters || [])].sort((a, b) => a.chapterNumber - b.chapterNumber);

  const currentChapterIndex = sortedChapters.findIndex(
    (c) => (c._id || c.id) === chapterId
  );

  const currentChapter = sortedChapters[currentChapterIndex >= 0 ? currentChapterIndex : 0];

  if (!currentChapter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-xl border shadow-sm w-full max-w-md overflow-hidden p-8 text-center" style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Chapter Not Found</h2>
          <p className="text-gray-600 mb-4">The chapter you're looking for doesn't exist.</p>
          <Link to={`/book/${bookId}`}><button className="h-10 py-2 px-4 rounded-md shadow" style={{ backgroundColor: "#D4A574", color: "#FFFFFF" }}>Back to Book</button></Link>
        </div>
      </div>
    );
  }

  const currentIdx = currentChapterIndex >= 0 ? currentChapterIndex : 0;
  const hasPrevious = currentIdx > 0;
  const hasNext = currentIdx < sortedChapters.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) navigate(`/book/${bookId}/read/${sortedChapters[currentIdx - 1]._id || sortedChapters[currentIdx - 1].id}`);
  };

  const goToNext = () => {
    if (hasNext) navigate(`/book/${bookId}/read/${sortedChapters[currentIdx + 1]._id || sortedChapters[currentIdx + 1].id}`);
  };

  const goToChapter = (chId) => {
    navigate(`/book/${bookId}/read/${chId}`);
    setShowChapterList(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl relative">
        <div
          className="relative rounded-lg shadow-2xl p-12 md:p-16"
          style={{ backgroundColor: "#FFF8ED", minHeight: "600px", boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.1)" }}
        >
          {/* CLOSE */}
          <Link to={`/book/${bookId}`}>
            <button className="absolute top-4 right-4 h-10 w-10" style={{ color: "#D4A574" }}>
              <X className="w-6 h-6" />
            </button>
          </Link>

          {/* CHAPTER LIST TOGGLE */}
          <button
            className="absolute top-4 left-4 h-10 w-10"
            onClick={() => setShowChapterList(!showChapterList)}
            style={{ color: "#D4A574" }}
          >
            <List className="w-6 h-6" />
          </button>

          {/* CHAPTER LIST DROPDOWN */}
          {showChapterList && (
            <div
              className="absolute top-16 left-4 z-20 rounded-lg shadow-xl"
              style={{ backgroundColor: "#FFF8ED", border: "1px solid #E5D4C1", maxHeight: "400px", overflowY: "auto", minWidth: "250px" }}
            >
              <div className="p-2">
                {sortedChapters.map((chapter) => (
                  <button
                    key={chapter._id || chapter.id}
                    onClick={() => goToChapter(chapter._id || chapter.id)}
                    className="w-full text-left px-4 py-2 rounded mb-1 hover:bg-gray-100"
                    style={{
                      backgroundColor: (chapter._id || chapter.id) === chapterId ? "#D4A574" : "transparent",
                      color: (chapter._id || chapter.id) === chapterId ? "#FFFFFF" : "#333333",
                    }}
                  >
                    <div className="font-semibold">Chapter {chapter.chapterNumber}</div>
                    <div className="text-sm truncate opacity-90">{chapter.title}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CHAPTER HEADER */}
          <div className="text-center mb-8 pt-8">
            <div className="text-sm uppercase tracking-wider mb-2 font-semibold" style={{ color: "#D4A574" }}>
              Chapter {currentChapter.chapterNumber}
            </div>
            <h1 className="text-3xl md:text-4xl font-serif mb-4" style={{ color: "#333333" }}>
              {currentChapter.title}
            </h1>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: "#E5D4C1" }} />
          </div>

          {/* CONTENT */}
          <div className="max-w-none font-serif leading-relaxed mb-16 mx-auto" style={{ color: "#333333" }}>
            <p className="whitespace-pre-wrap text-justify" style={{ textIndent: "2em", lineHeight: "1.8" }}>
              {currentChapter.content}
            </p>
          </div>

          {/* NAVIGATION */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-between px-8">
            <button onClick={goToPrevious} disabled={!hasPrevious} style={{ color: hasPrevious ? "#D4A574" : "#999999", opacity: hasPrevious ? 1 : 0.4 }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-sm" style={{ color: "#999999" }}>{currentIdx + 1} / {sortedChapters.length}</div>
            <button onClick={goToNext} disabled={!hasNext} style={{ color: hasNext ? "#D4A574" : "#999999", opacity: hasNext ? 1 : 0.4 }}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookReaderPage;
