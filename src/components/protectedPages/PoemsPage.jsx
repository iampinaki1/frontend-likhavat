import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, api } from "../../context/Appcontext.jsx";
import { Heart, User, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PoemsPage() {

  const { currentUser, setCurrentUser, toggleLike, followUser, unfollowUser } = useApp();
  const navigate = useNavigate();

  const [poems, setPoems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const isScrolling = useRef(false);
  const touchStartY = useRef(null);

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/poems/poem');
        if (data.success) {
          setPoems(data.poems);
          setCursor(data.nextCursor);
          setHasMore(!!data.nextCursor);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Load more when near end
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get(`/poems/poem?lastId=${cursor}`);
      if (data.success) {
        setPoems(prev => [...prev, ...data.poems]);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingMore(false); }
  }, [hasMore, loadingMore, cursor]);

  const currentPoem = poems[currentIndex];

  const poemPages = React.useMemo(() => {
    if (!currentPoem) return [];
    const lines = currentPoem.content.split('\n');
    const pages = [];
    const linesPerPage = 14;
    for (let i = 0; i < lines.length; i += linesPerPage) {
      pages.push(lines.slice(i, i + linesPerPage).join('\n'));
    }
    return pages;
  }, [currentPoem]);


  const isFollowing =
    currentUser?.following.includes(currentPoem?.author?._id || currentPoem?.author) || false;

  const hasRequested =
    currentUser?.sentRequests?.includes(currentPoem?.author?._id || currentPoem?.author) || false;

  const isLiked =
    currentPoem && currentUser
      ? currentPoem.likes.includes(currentUser._id || currentUser.id)
      : false;

  const goToNext = useCallback(() => {
    if (currentIndex < poems.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      // Load more when 3 from end
      if (next >= poems.length - 3 && hasMore) loadMore();
      setTimeout(() => {
        if (contentRef.current) { contentRef.current.scrollTop = 0; contentRef.current.scrollLeft = 0; }
      }, 50);
    }
  }, [currentIndex, poems.length, hasMore, loadMore]);

  const goToPrevious = useCallback(() => {

    if (currentIndex > 0) {

      setCurrentIndex((prev) => prev - 1);

      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
          contentRef.current.scrollLeft = 0;
        }
      }, 50);

    }

  }, [currentIndex]);

  // Touch scroll for mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (touchStartY.current === null) return;
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 50) {
        if (delta > 0) goToNext();
        else goToPrevious();
      }
      touchStartY.current = null;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goToNext, goToPrevious]);

  useEffect(() => {

    const handleWheel = (e) => {

      if (isScrolling.current) return;

      // Check if vertical scroll is dominant
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        isScrolling.current = true;

        if (e.deltaY > 0) {
          goToNext();
        } else {
          goToPrevious();
        }

        setTimeout(() => {
          isScrolling.current = false;
        }, 800);
      }

    };

    const container = containerRef.current;

    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };

  }, [goToNext, goToPrevious]);

  useEffect(() => {

    const handleKeyDown = (e) => {

      if (e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      }

      else if (e.key === "ArrowUp") {
        e.preventDefault();
        goToPrevious();
      }

    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);

  }, [goToNext, goToPrevious]);

  const handleLike = () => {
    if (!currentPoem || !currentUser) return;
    const uid = currentUser._id || currentUser.id;
    const id = currentPoem._id || currentPoem.id;
    // Optimistic local update
    setPoems(prev => prev.map(p => {
      if ((p._id || p.id) !== id) return p;
      const liked = (p.likes || []).includes(uid);
      return { ...p, likes: liked ? p.likes.filter(x => x !== uid) : [...p.likes, uid] };
    }));
    toggleLike(id, "poem");
    toast.success(isLiked ? "Removed like" : "Poem liked!");
  };

  const handleFollow = async () => {
    if (!currentPoem || !currentUser) return;
    const authorId = currentPoem.author?._id || currentPoem.author;
    const authorUsername = currentPoem.author?.username || currentPoem.authorName;
    try {
      const { data } = await api.post(`/user/${authorUsername}/followunfollow`);
      if (data.msg === "Followed") {
        followUser(authorId);
        toast.success(`Following ${authorUsername}`);
      } else if (data.msg === "Unfollowed") {
        unfollowUser(authorId);
        toast.success(`Unfollowed ${authorUsername}`);
      } else if (data.status === "pending") {
        // private user — add to sentRequests
        setCurrentUser(prev => ({
          ...prev,
          sentRequests: [...(prev.sentRequests || []), authorId]
        }));
        toast.success("Follow request sent");
      }
    } catch (err) {
      toast.error("Failed to update follow");
    }
  };

  const handleProfileClick = () => {
    if (!currentPoem) return;
    navigate(`/profile/${currentPoem.author?.username || currentPoem.authorName}`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ top: "64px", backgroundColor: "#FFF8ED" }}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#D4A574' }} />
          <p className="text-sm font-medium" style={{ color: '#333333' }}>Loading poems...</p>
        </div>
      </div>
    );
  }

  if (!currentPoem) {

    return (

      <div
        className="flex items-center justify-center h-screen"
      >

        <div
          className="rounded-xl border shadow-sm w-full max-w-sm overflow-hidden p-8 text-center"
          style={{
            backgroundColor: "#FFF8ED",
            borderColor: "#E5D4C1"
          }}
        >

          <h2 className="text-xl font-semibold mb-2">
            No Poems Available
          </h2>

          <p className="text-gray-600">
            Check back later for new content!
          </p>

        </div>

      </div>

    );

  }

  return (

    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{ top: "64px" }}
    >

      {/* Poem Container */}
      <div className="relative w-full h-full flex items-center justify-center pb-16 md:pb-0">
        {/* Main Poem Card */}
        <div className="w-full max-w-2xl h-full flex flex-col justify-center px-2 sm:px-4 md:px-8">
          <div
            className="rounded-xl shadow-2xl overflow-hidden w-full flex flex-col mx-auto"
            style={{
              backgroundColor: '#FFF8ED',
              border: '2px solid #E5D4C1',
              maxHeight: '85vh'
            }}
          >
            {/* Poem Content */}
            <div
              ref={contentRef}
              className="flex overflow-x-auto snap-x snap-mandatory flex-1"
              style={{
                maxHeight: 'calc(85vh - 120px)',
                scrollbarWidth: 'none',
              }}
            >
              <style>{`.hide-scrollbar-local::-webkit-scrollbar { display: none; }`}</style>
              {poemPages.map((page, index) => (
                <div key={index} className="min-w-full flex-shrink-0 snap-center p-5 sm:p-8 md:p-12 pb-6 sm:pb-8 overflow-y-auto hide-scrollbar-local" style={{ scrollbarWidth: 'none' }}>
                  {index === 0 && (
                    <div className="mb-4 sm:mb-6">
                      <div className="inline-flex items-center rounded-full border px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border-transparent" style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}>
                        {currentPoem.subject}
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mb-3 sm:mb-4" style={{ color: '#333333' }}>
                        {currentPoem.title}
                      </h2>
                    </div>
                  )}
                  <div className="prose prose-base sm:prose-lg max-w-none">
                    <p className="whitespace-pre-wrap font-serif leading-relaxed text-gray-800 text-base sm:text-lg">
                      {page}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            {poemPages.length > 1 && (
              <div className="flex justify-center space-x-2 py-3 bg-opacity-90 z-10" style={{ backgroundColor: '#FFF8ED' }}>
                {poemPages.map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: '#D4A574', opacity: 0.6 }} />
                ))}
              </div>
            )}

            {/* Author Section at Bottom */}
            <div
              className="p-3 sm:p-4 border-t flex-shrink-0"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D4C1' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                  <button onClick={handleProfileClick} className="focus:outline-none">
                    <div className="relative flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                      {currentPoem.author?.profilePic || currentPoem.authorProfilePic ? (
                        <img src={currentPoem.author?.profilePic || currentPoem.authorProfilePic} alt={currentPoem.author?.username || currentPoem.authorName} className="aspect-square h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-medium" style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}>
                          <User className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={handleProfileClick}
                      className="font-semibold text-sm sm:text-base hover:underline focus:outline-none text-left truncate block w-full"
                    >
                      {currentPoem.author?.username || currentPoem.authorName}
                    </button>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {currentPoem.likes.length} {currentPoem.likes.length === 1 ? 'like' : 'likes'}
                    </p>
                  </div>
                </div>
                {currentUser && currentUser._id !== (currentPoem.author?._id || currentPoem.author) && (
                  hasRequested ? (
                    <button
                      disabled
                      className="inline-flex items-center justify-center rounded-md text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-8 sm:h-9 px-2 sm:px-3 border whitespace-nowrap ml-2 bg-gray-200 text-gray-500"
                    >
                      Requested
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      className="inline-flex items-center justify-center rounded-md text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ring-offset-background hover:bg-gray-100 h-8 sm:h-9 px-2 sm:px-3 border whitespace-nowrap ml-2"
                      style={
                        isFollowing
                          ? { borderColor: '#D4A574', color: '#D4A574', backgroundColor: 'transparent' }
                          : { backgroundColor: '#D4A574', color: '#FFFFFF', borderColor: 'transparent' }
                      }
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Actions (Like YouTube Shorts) */}
        <div className="fixed right-2 sm:right-4 md:right-8 bottom-24 sm:bottom-32 flex flex-col space-y-4 sm:space-y-6 z-10">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center space-y-1 focus:outline-none group"
          >
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full shadow-lg flex items-center justify-center transition-transform group-hover:scale-110"
              style={{
                backgroundColor: isLiked ? '#D4A574' : '#FFF8ED',
                border: '2px solid #E5D4C1'
              }}
            >
              <Heart
                className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${isLiked ? 'fill-current' : ''}`}
                style={{ color: isLiked ? '#FFFFFF' : '#D4A574' }}
              />
            </div>
            <span className="text-xs sm:text-sm font-medium" style={{ color: '#FFF8ED' }}>
              {currentPoem.likes.length}
            </span>
          </button>

          {/* Author Avatar (clickable) */}
          <button
            onClick={handleProfileClick}
            className="focus:outline-none group hidden sm:block"
          >
            <div className="relative">
              <div className="relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 transition-transform group-hover:scale-110" style={{ borderColor: '#E5D4C1' }}>
                {currentPoem.author?.profilePic || currentPoem.authorProfilePic ? (
                  <img src={currentPoem.author?.profilePic || currentPoem.authorProfilePic} alt={currentPoem.author?.username || currentPoem.authorName} className="aspect-square h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-medium" style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}>
                    <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </div>
                )}
              </div>
              {currentUser && currentUser._id !== (currentPoem.author?._id || currentPoem.author) && !isFollowing && (
                <div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold cursor-pointer"
                  style={{ backgroundColor: '#D4A574' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollow();
                  }}
                >
                  +
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Navigation Arrows - Only on Large Devices, Left Side */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="fixed top-1/3 left-4 lg:left-8 w-10 h-10 lg:w-12 lg:h-12 rounded-full shadow-lg flex items-center justify-center focus:outline-none hover:opacity-50 transition-opacity z-10 hidden lg:flex"
            style={{ backgroundColor: '#FFF8ED', border: '2px solid #E5D4C1' }}
          >
            <ChevronUp className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: '#D4A574' }} />
          </button>
        )}

        {currentIndex < poems.length - 1 && (
          <button
            onClick={goToNext}
            className="fixed bottom-1/3 left-4 lg:left-8 w-10 h-10 lg:w-12 lg:h-12 rounded-full shadow-lg flex items-center justify-center focus:outline-none hover:opacity-50 transition-opacity z-10 hidden lg:flex"
            style={{ backgroundColor: '#FFF8ED', border: '2px solid #E5D4C1' }}
          >
            <ChevronDown className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: '#D4A574' }} />
          </button>
        )}

        {/* Progress Indicator */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full z-10" style={{ backgroundColor: 'rgba(255, 248, 237, 0.9)' }}>
          <p className="text-sm font-medium" style={{ color: '#333333' }}>
            {currentIndex + 1} / {poems.length}
          </p>
        </div>

        {/* Scroll Hint (appears for first poem) */}
        {currentIndex === 0 && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
            <p className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255, 248, 237, 0.8)', color: '#333333' }}>
              <span className="lg:hidden">Scroll ↓</span>
              <span className="hidden lg:inline">Use arrows ↓↑</span>
            </p>
          </div>
        )}
      </div>
      {/* Rest of your JSX layout stays exactly the same */}

    </div>

  );

}

export default PoemsPage;