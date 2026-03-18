import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp, api } from "../../context/Appcontext.jsx";
import { Heart, User, ChevronUp, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Estimate how many lines fit in the content area based on viewport
function useLinesPerPage() {
  const [lines, setLines] = useState({ first: 8, other: 13 });
  useEffect(() => {
    const calc = () => {
      const available = window.innerHeight - 64 - 72 - 24 - 40;
      const lineH = window.innerWidth < 640 ? 26 : 30;
      const totalLines = Math.max(4, Math.floor(available / lineH));
      setLines({ first: Math.max(4, totalLines - 3), other: totalLines });
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  return lines;
}

/**
 * Binary-search the largest font size (px) where the text fits inside
 * containerW x containerH without overflowing, using canvas for width measurement.
 * lineHeight: multiplier (e.g. 1.7)
 * headerH: extra height consumed by title/badge on page 0
 */
function fitFontSize(text, containerW, containerH, lineHeightMult, headerH, minSize, maxSize) {
  if (!text || containerW <= 0 || containerH <= 0) return minSize;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const availH = containerH - headerH;

  const fits = (size) => {
    ctx.font = `${size}px serif`;
    const lhPx = size * lineHeightMult;
    let totalVisualLines = 0;
    for (const line of text.split("\n")) {
      if (line.trim() === "") { totalVisualLines += 1; continue; }
      const words = line.split(" ");
      let cur = "";
      let lineCount = 1;
      for (const w of words) {
        const test = cur ? cur + " " + w : w;
        if (ctx.measureText(test).width > containerW) { lineCount++; cur = w; }
        else cur = test;
      }
      totalVisualLines += lineCount;
    }
    return totalVisualLines * lhPx <= availH;
  };

  let lo = minSize, hi = maxSize, best = minSize;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid)) { best = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

export function PoemsPage() {

  const { currentUser, setCurrentUser, toggleLike, followUser, unfollowUser, deletePoem } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const targetPoemId = location.state?.poemId || null;

  const [poems, setPoems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const linesPerPage = useLinesPerPage();
  const currentPoem = poems[currentIndex] || null;

  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const cardRef = useRef(null);
  const poemTextRef = useRef(null);
  const isScrolling = useRef(false);
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);

  const [cardDims, setCardDims] = useState({ w: 0, h: 0 });

  // Measure card dimensions for font fitting
  useEffect(() => {
    const measure = () => {
      if (cardRef.current) {
        setCardDims({ w: cardRef.current.clientWidth, h: cardRef.current.clientHeight });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (cardRef.current) ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        // If a specific poem was requested, fetch it first so it's at index 0
        if (targetPoemId) {
          const [targetRes, feedRes] = await Promise.all([
            api.get(`/poems/poem/${targetPoemId}`).catch(() => null),
            api.get('/poems/poem'),
          ]);
          if (feedRes.data.success) {
            let feedPoems = feedRes.data.poems || [];
            if (targetRes?.data?.poem) {
              const target = targetRes.data.poem;
              // Remove duplicate if already in feed, then prepend
              feedPoems = [target, ...feedPoems.filter(p => p._id !== target._id)];
            }
            setPoems(feedPoems);
            setCursor(feedRes.data.nextCursor);
            setHasMore(!!feedRes.data.nextCursor);
            setCurrentIndex(0);
          }
        } else {
          const { data } = await api.get('/poems/poem');
          if (data.success) {
            setPoems(data.poems);
            setCursor(data.nextCursor);
            setHasMore(!!data.nextCursor);
          }
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

  // Reset page index when poem changes
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [currentIndex]);

  // Track horizontal scroll page for dots
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const page = Math.round(el.scrollLeft / el.clientWidth);
      setCurrentPageIndex(page);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [currentIndex, poems]);

  const poemPages = React.useMemo(() => {
    if (!currentPoem) return [];
    const lines = currentPoem.content.split('\n');
    const pages = [];
    let i = 0;
    let pageIndex = 0;
    while (i < lines.length) {
      const limit = pageIndex === 0 ? linesPerPage.first : linesPerPage.other;
      pages.push(lines.slice(i, i + limit).join('\n'));
      i += limit;
      pageIndex++;
    }
    return pages;
  }, [currentPoem, linesPerPage]);

  // Per-page fitted font sizes — computed once card dimensions are known
  const pageFontSizes = React.useMemo(() => {
    if (!poemPages.length || cardDims.w === 0 || cardDims.h === 0) return [];
    // padding inside .poem-page: p-4 = 16px each side on mobile
    const pad = cardDims.w < 640 ? 32 : cardDims.w < 768 ? 48 : 80; // px-4 / px-6 / px-10 * 2
    const textW = cardDims.w - pad;
    // available height = card height minus author bar (~56px) minus dots (~28px) minus padding top+bottom
    const padV = cardDims.w < 640 ? 32 : 48;
    const fixedH = 56 + 28; // author + dots
    const textH = cardDims.h - fixedH - padV;
    // title/badge on page 0 takes ~72px
    const titleH = 72;

    return poemPages.map((page, i) =>
      fitFontSize(page, textW, textH, 1.7, i === 0 ? titleH : 20, 11, 16)
    );
  }, [poemPages, cardDims]);


  const isFollowing = currentUser?.following
    ? currentUser.following.some(id =>
        (id?._id || id)?.toString() === (currentPoem?.author?._id || currentPoem?.author)?.toString()
      )
    : false;

  const hasRequested = currentUser?.sentRequests
    ? currentUser.sentRequests.some(id =>
        (id?._id || id)?.toString() === (currentPoem?.author?._id || currentPoem?.author)?.toString()
      )
    : false;

  const isLiked =
    currentPoem && currentUser
      ? (currentPoem.likes || []).some(id =>
          (id?._id || id)?.toString() === (currentUser._id || currentUser.id)?.toString()
        )
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

  const touchStartTime = useRef(null);
  const swipeDirection = useRef(null); // 'horizontal' | 'vertical' | null

  // Prevent pull-to-refresh and browser overscroll while on this page
  useEffect(() => {
    const prev = document.body.style.overscrollBehavior;
    const prevHtml = document.documentElement.style.overscrollBehavior;
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overscrollBehavior = prev;
      document.documentElement.style.overscrollBehavior = prevHtml;
    };
  }, []);

  // Touch scroll:
  //   slow / short  → scroll poem text within the current page
  //   fast / long   → navigate to next/prev poem
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      touchStartTime.current = Date.now();
      swipeDirection.current = null; // reset direction lock
    };

    const handleTouchMove = (e) => {
      if (touchStartY.current === null) return;

      const dy = touchStartY.current - e.touches[0].clientY;
      const dx = touchStartX.current - e.touches[0].clientX;

      // Lock direction after 8px of movement to avoid ambiguity
      if (!swipeDirection.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        swipeDirection.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }

      // If horizontal swipe — let native scroll handle it, don't interfere
      if (swipeDirection.current === 'horizontal') return;

      // Vertical swipe — block pull-to-refresh only when pulling down at top of first poem
      if (swipeDirection.current === 'vertical' && dy < 0 && currentIndex === 0) {
        const textEl = poemTextRef.current;
        const atTop = !textEl || textEl.scrollTop <= 0;
        if (atTop) e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      if (touchStartY.current === null) return;

      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      const deltaX = Math.abs(touchStartX.current - e.changedTouches[0].clientX);
      const elapsed = Date.now() - (touchStartTime.current || Date.now());
      const velocity = Math.abs(deltaY) / Math.max(elapsed, 1); // px/ms

      touchStartY.current = null;
      touchStartX.current = null;
      touchStartTime.current = null;
      swipeDirection.current = null;

      // Ignore horizontal-dominant swipes (page flipping)
      if (deltaX > Math.abs(deltaY)) return;

      const absDy = Math.abs(deltaY);

      // Fast swipe (velocity > 0.5 px/ms) OR long swipe (> 120px) → change poem
      const isFast = velocity > 0.5;
      const isLong = absDy > 120;

      if (isFast || isLong) {
        if (deltaY > 0) goToNext();
        else goToPrevious();
        return;
      }

      // Slow / short swipe → scroll the poem text area
      if (absDy > 10) {
        const textEl = poemTextRef.current;
        if (textEl) {
          // Scroll proportionally — map swipe distance to scroll amount
          const scrollAmount = deltaY * 1.8;
          textEl.scrollBy({ top: scrollAmount, behavior: "smooth" });
        }
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goToNext, goToPrevious, currentIndex]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (isScrolling.current) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

      // Fast or large wheel delta → change poem
      const isFast = Math.abs(e.deltaY) > 80;
      if (isFast) {
        e.preventDefault();
        isScrolling.current = true;
        if (e.deltaY > 0) goToNext();
        else goToPrevious();
        setTimeout(() => { isScrolling.current = false; }, 600);
        return;
      }

      // Small wheel delta → scroll poem text
      const textEl = poemTextRef.current;
      if (textEl) {
        e.preventDefault();
        textEl.scrollBy({ top: e.deltaY * 2, behavior: "smooth" });
      }
    };

    const container = containerRef.current;
    if (container) container.addEventListener("wheel", handleWheel, { passive: false });
    return () => { if (container) container.removeEventListener("wheel", handleWheel); };
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
      const { data } = await api.post(`/user/${encodeURIComponent(authorUsername)}/followunfollow`);
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

  const handleDelete = async () => {
    if (!currentPoem) return;
    const id = currentPoem._id || currentPoem.id;
    try {
      await deletePoem(id);
      setPoems(prev => prev.filter(p => (p._id || p.id) !== id));
      setCurrentIndex(prev => Math.max(0, prev - 1));
      toast.success("Poem deleted");
    } catch {
      toast.error("Failed to delete poem");
    }
  };

  const handleProfileClick = () => {
    if (!currentPoem) return;
    navigate(`/profile/${encodeURIComponent(currentPoem.author?.username || currentPoem.authorName)}`);
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
      style={{ top: "64px", overscrollBehavior: "none" }}
    >

      {/* Poem Container */}
      <div className="relative w-full h-full flex items-center justify-center pb-16 md:pb-0">
        {/* Main Poem Card */}
        <div className="w-full max-w-2xl h-full flex flex-col justify-center px-2 sm:px-4 md:px-8">
          <div
            className="rounded-xl shadow-2xl overflow-hidden w-full flex flex-col mx-auto"
            ref={cardRef}
            style={{
              backgroundColor: '#FFF8ED',
              border: '2px solid #E5D4C1',
              height: 'calc(100% - 32px)',
              maxHeight: '720px',
            }}
          >
            {/* Poem Content — horizontal snap, no vertical scroll */}
            <div
              ref={contentRef}
              className="flex overflow-x-auto snap-x snap-mandatory flex-1 min-h-0"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              <style>{`
                .poem-scroll-area::-webkit-scrollbar { display: none; }
                .poem-page { min-width: 100%; flex-shrink: 0; scroll-snap-align: center; overflow: hidden; }
                .poem-page .poem-text::-webkit-scrollbar { width: 3px; }
                .poem-page .poem-text::-webkit-scrollbar-thumb { background: #E5D4C1; border-radius: 2px; }
                .poem-page .poem-text::-webkit-scrollbar-track { background: transparent; }
              `}</style>
              {poemPages.map((page, index) => (
                <div key={index} className="poem-page p-4 sm:p-6 md:p-10 flex flex-col">
                  {index === 0 && (
                    <div className="mb-2 sm:mb-4 flex-shrink-0">
                      <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-semibold mb-1.5 border-transparent" style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}>
                        {currentPoem.subject}
                      </div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-serif leading-tight" style={{ color: '#333333' }}>
                        {currentPoem.title}
                      </h2>
                    </div>
                  )}
                  {index > 0 && (
                    <div className="mb-2 flex-shrink-0">
                      <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Page {index + 1}</p>
                    </div>
                  )}
                  <div
                    ref={index === currentPageIndex ? poemTextRef : null}
                    className="poem-text flex-1 overflow-y-auto"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#E5D4C1 transparent' }}
                  >
                    <p
                      className="whitespace-pre-wrap font-serif text-gray-800 pb-2"
                      style={{
                        fontSize: pageFontSizes[index] ? `${pageFontSizes[index]}px` : undefined,
                        lineHeight: 1.7,
                      }}
                    >
                      {page}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            {poemPages.length > 1 && (
              <div className="flex justify-center items-center space-x-2 py-2 flex-shrink-0" style={{ backgroundColor: '#FFF8ED' }}>
                {poemPages.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === currentPageIndex ? '20px' : '8px',
                      height: '8px',
                      backgroundColor: '#D4A574',
                      opacity: i === currentPageIndex ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Author Section at Bottom */}
            <div
              className="px-3 py-2 sm:p-4 border-t flex-shrink-0"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5D4C1' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <button onClick={handleProfileClick} className="focus:outline-none flex-shrink-0">
                    <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                      {currentPoem.author?.profilePic || currentPoem.authorProfilePic ? (
                        <img src={currentPoem.author?.profilePic || currentPoem.authorProfilePic} alt={currentPoem.author?.username || currentPoem.authorName} className="aspect-square h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-medium" style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}>
                          <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={handleProfileClick}
                      className="font-semibold text-xs sm:text-sm hover:underline focus:outline-none text-left truncate block w-full"
                    >
                      {currentPoem.author?.username || currentPoem.authorName}
                    </button>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {currentPoem.likes.length} {currentPoem.likes.length === 1 ? 'like' : 'likes'}
                    </p>
                  </div>
                </div>
                {currentUser && currentUser._id !== (currentPoem.author?._id || currentPoem.author) && (
                  hasRequested ? (
                    <button
                      disabled
                      className="text-xs font-medium h-7 sm:h-8 px-2 sm:px-3 rounded-md border whitespace-nowrap ml-2 bg-gray-200 text-gray-500 flex-shrink-0"
                    >
                      Requested
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      className="text-xs sm:text-sm font-medium h-7 sm:h-8 px-2 sm:px-3 rounded-md border whitespace-nowrap ml-2 flex-shrink-0 transition-colors"
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

          {/* Delete Button — only for poem author */}
          {currentUser && currentUser._id === (currentPoem.author?._id || currentPoem.author) && (
            <button
              onClick={handleDelete}
              className="flex flex-col items-center space-y-1 focus:outline-none group"
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full shadow-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: '#FFF8ED', border: '2px solid #E5D4C1' }}
              >
                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" style={{ color: '#ef4444' }} />
              </div>
            </button>
          )}

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