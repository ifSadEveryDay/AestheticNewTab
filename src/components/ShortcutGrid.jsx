import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getIconUrl } from '../utils/icons';
import CachedIcon from './CachedIcon';

// Auto-calculate gaps based on grid size
const calculateGaps = (cols, rows) => {
    const baseColGap = 40;
    const colGapReduction = (cols - 3) * 6;
    const colGap = Math.max(8, baseColGap - colGapReduction);

    const baseRowGap = 32;
    const rowGapReduction = (rows - 2) * 5;
    const rowGap = Math.max(12, baseRowGap - rowGapReduction);

    return { colGap, rowGap };
};

const ShortcutGrid = ({ config, shortcuts }) => {
    const { cols = 5, rows = 3, iconSize = 96 } = config || {};
    const [currentPage, setCurrentPage] = useState(0);

    const containerRef = useRef(null);
    const accumulatedRef = useRef(0);
    const lastTimeRef = useRef(0);
    const isChangingRef = useRef(false);

    const { colGap, rowGap } = calculateGaps(cols, rows);
    const [scale, setScale] = useState(1);

    // Calculate scale to fit screen
    useEffect(() => {
        const handleResize = () => {
            const padding = 48; // Horizontal padding
            const availableWidth = window.innerWidth - padding;

            // Calculate required width: (cols * iconSize) + ((cols - 1) * colGap)
            const requiredWidth = (cols * iconSize) + ((cols - 1) * colGap);

            if (requiredWidth > availableWidth) {
                const newScale = availableWidth / requiredWidth;
                // Cap scale at 1 (don't scale up, only down)
                setScale(Math.min(1, newScale));
            } else {
                setScale(1);
            }
        };

        handleResize(); // Initial calculation
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [cols, iconSize, colGap]);

    const itemsPerPage = cols * rows;
    const totalPages = Math.ceil(shortcuts.length / itemsPerPage);

    // Get all pages of shortcuts
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
        const start = i * itemsPerPage;
        pages.push(shortcuts.slice(start, start + itemsPerPage));
    }

    // Reset page when shortcuts change
    useEffect(() => {
        if (currentPage >= totalPages && totalPages > 0) {
            setCurrentPage(totalPages - 1);
        }
    }, [shortcuts.length, totalPages, currentPage]);

    // Snap to page
    const goToPage = useCallback((targetPage) => {
        const clampedPage = Math.max(0, Math.min(totalPages - 1, targetPage));
        if (clampedPage !== currentPage) {
            isChangingRef.current = true;
            setCurrentPage(clampedPage);
            // Allow next page change after animation
            setTimeout(() => {
                isChangingRef.current = false;
                accumulatedRef.current = 0;
            }, 600);
        }
    }, [totalPages, currentPage]);

    // Wheel handler for mouse wheel (vertical) and trackpad (horizontal)
    useEffect(() => {
        if (totalPages <= 1) return;

        const handleWheel = (e) => {
            // Skip if page change is in progress
            if (isChangingRef.current) return;

            const now = Date.now();

            // Reset if new gesture (gap > 200ms)
            if (now - lastTimeRef.current > 200) {
                accumulatedRef.current = 0;
            }
            lastTimeRef.current = now;

            let scrollDelta = 0;

            // Detect input type:
            // - Trackpad horizontal swipe: deltaX is dominant
            // - Mouse wheel vertical: deltaY is present, deltaX is 0 or minimal
            const isHorizontalSwipe = Math.abs(e.deltaX) > Math.abs(e.deltaY);
            const isMouseWheel = e.deltaX === 0 && e.deltaY !== 0;

            if (isHorizontalSwipe) {
                // Trackpad horizontal swipe
                scrollDelta = e.deltaX;
            } else if (isMouseWheel) {
                // Mouse wheel vertical scroll
                scrollDelta = e.deltaY;
            } else {
                // Ignore diagonal or vertical trackpad scroll
                return;
            }

            // Accumulate scroll
            accumulatedRef.current += scrollDelta;

            // Trigger page change at threshold
            const threshold = 50;

            if (accumulatedRef.current > threshold) {
                goToPage(currentPage + 1);
                accumulatedRef.current = 0; // Reset immediately
            } else if (accumulatedRef.current < -threshold) {
                goToPage(currentPage - 1);
                accumulatedRef.current = 0; // Reset immediately
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [totalPages, currentPage, goToPage]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                goToPage(currentPage - 1);
            } else if (e.key === 'ArrowRight') {
                goToPage(currentPage + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, goToPage]);

    if (shortcuts.length === 0) {
        return null;
    }

    return (
        <>
            {/* Swipeable Container */}
            <div
                ref={containerRef}
                className="w-full overflow-x-hidden"
            >
                <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{
                        transform: `translateX(${-currentPage * 100}%)`,
                    }}
                >
                    {pages.map((pageShortcuts, pageIndex) => (
                        <div
                            key={pageIndex}
                            className="flex-shrink-0 w-full flex justify-center"
                        >
                            <div
                                className="grid px-4 py-10 transition-transform duration-300"
                                style={{
                                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                    columnGap: `${colGap}px`,
                                    rowGap: `${rowGap}px`,
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top center',
                                    // Calculate exact width to ensure grid layout is preserved before scaling
                                    width: scale < 1 ? `${(cols * iconSize) + ((cols - 1) * colGap)}px` : '100%',
                                    maxWidth: scale < 1 ? 'none' : '56rem' // 4xl
                                }}
                            >
                                {pageShortcuts.map((shortcut) => {
                                    const iconSrc = shortcut.customIcon?.type === 'custom'
                                        ? shortcut.customIcon.data
                                        : (shortcut.customIcon?.url || getIconUrl(shortcut.url));

                                    return (
                                        <a
                                            key={shortcut.id}
                                            href={shortcut.url}
                                            className="group relative flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 hover:z-10 justify-self-center h-fit"
                                            draggable={false}
                                        >
                                            <div
                                                className="relative rounded-[22px] bg-white shadow-xl flex items-center justify-center overflow-hidden transition-all group-hover:shadow-2xl"
                                                style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                                            >
                                                <CachedIcon
                                                    src={iconSrc}
                                                    alt={shortcut.title}
                                                    className="select-none pointer-events-none transition-opacity duration-300"
                                                    style={{
                                                        width: shortcut.iconPadding ? '70%' : '100%',
                                                        height: shortcut.iconPadding ? '70%' : '100%',
                                                        objectFit: shortcut.iconPadding ? 'contain' : 'cover',
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        const p = e.target.parentElement;
                                                        // Check if already has placeholder to avoid dupes
                                                        if (!p.querySelector('span')) {
                                                            p.innerHTML = `<span class="text-3xl font-bold text-white">${shortcut.title[0].toUpperCase()}</span>`;
                                                            p.classList.add('bg-gradient-to-br', 'from-blue-500', 'to-purple-600');
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-white/90 drop-shadow-md truncate w-full text-center px-1 select-none">
                                                {shortcut.title}
                                            </span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fixed Pagination Controls */}
            {totalPages > 1 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 0}
                        className={`p-1.5 rounded-full transition-all ${currentPage === 0
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-white/20 text-white active:scale-90'
                            }`}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToPage(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentPage
                                    ? 'bg-white w-6'
                                    : 'bg-white/40 hover:bg-white/60 w-2'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className={`p-1.5 rounded-full transition-all ${currentPage === totalPages - 1
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-white/20 text-white active:scale-90'
                            }`}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </>
    );
};

export default ShortcutGrid;
