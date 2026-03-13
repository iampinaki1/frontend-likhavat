import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../context/Appcontext.jsx";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

export function BookFullReader() {

  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const { data } = await api.get(`/books/book/${bookId}`);
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

        <div
          className="rounded-xl border shadow-sm w-full max-w-md p-8 text-center"
          style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
        >
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />

          <h2 className="text-xl font-semibold mb-2">
            Book Not Found
          </h2>

          <p className="text-gray-600 mb-4">
            The book you're looking for doesn't exist.
          </p>

          <Link to="/">
            <button
              className="h-10 py-2 px-4 rounded-md shadow"
              style={{ backgroundColor: "#D4A574", color: "#FFFFFF" }}
            >
              Back to Home
            </button>
          </Link>

        </div>

      </div>
    );
  }

  const sortedChapters = book.chapters ? [...book.chapters].sort(
    (a, b) => a.order - b.order
  ) : [];

  return (

    <div className="min-h-screen" style={{ backgroundColor: "#020617" }}>

      {/* HEADER */}

      <div
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
      >

        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">

          <button
            onClick={() => navigate(`/book/${bookId}`)}
            className="flex items-center h-9 px-3"
            style={{ color: "#D4A574" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Details
          </button>

          <div className="text-center flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {book.title}
            </h1>

            <p className="text-sm text-gray-600">
              by {book.author?.username || "Unknown"}
            </p>
          </div>

          <div className="w-24"></div>

        </div>

      </div>

      {/* CONTENT */}

      <div className="max-w-4xl mx-auto px-4 py-8">

        <div
          className="rounded-xl border shadow-sm overflow-hidden p-8 md:p-12"
          style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
        >

          {/* BOOK INFO */}

          <div className="mb-12 text-center">

            {book.image && book.image !== "no img" && (
              <img
                src={book.image}
                alt={book.title}
                className="w-48 h-64 object-cover rounded-lg shadow-lg mx-auto mb-6"
              />
            )}

            <h1 className="text-4xl font-bold mb-2 text-gray-900">
              {book.title}
            </h1>

            <p className="text-lg text-gray-600 mb-4">
              by {book.author?.username || "Unknown"}
            </p>

            <p className="text-gray-700 max-w-2xl mx-auto mb-4">
              {book.description}
            </p>

            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "#D4A574", color: "#FFFFFF" }}
            >
              {book.genre || "Story"}
            </div>

          </div>

          {/* CHAPTERS */}

          <div className="space-y-12">

            {sortedChapters.map((chapter, index) => (

              <div key={chapter.id}>

                {index > 0 && (
                  <div
                    className="my-8 border-t-2"
                    style={{ borderColor: "#E5D4C1" }}
                  />
                )}

                <div className="mb-8">

                  <h2 className="text-3xl font-bold mb-2 text-gray-900">
                    Chapter {chapter.order}: {chapter.title}
                  </h2>

                </div>

                <div className="max-w-none">

                  <p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-800">
                    {chapter.content}
                  </p>

                </div>

              </div>

            ))}

          </div>

          {/* NO CHAPTER */}

          {sortedChapters.length === 0 && (

            <div className="text-center py-12">

              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />

              <p className="text-gray-600">
                No chapters available yet.
              </p>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default BookFullReader;