import React, { useState, useEffect, useLayoutEffect } from 'react';
import { getCachedBackgroundImage } from '../utils/cache';

const BackgroundLayer = ({ url, opacity, blur, overlay }) => (
    <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-700 ease-in-out"
        style={{
            backgroundImage: url ? `url(${url})` : 'none',
            backgroundColor: !url ? '#111827' : 'transparent',
            opacity: opacity
        }}
    >
        <div
            className="absolute inset-0 transition-all duration-300"
            style={{
                backgroundColor: `rgba(0, 0, 0, ${overlay / 100})`,
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`
            }}
        />
    </div>
);

const Layout = ({ children, backgroundUrl, bgConfig }) => {
    const { blur = 2, overlay = 30 } = bgConfig || {};

    // Double buffering state
    const [activeBg, setActiveBg] = useState(null);
    const [nextBg, setNextBg] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Initial load: Check cache first to avoid flash
    useLayoutEffect(() => {
        const checkCache = async () => {
            if (!backgroundUrl) return;

            const cachedBlob = await getCachedBackgroundImage(backgroundUrl);
            if (cachedBlob) {
                const objectUrl = URL.createObjectURL(cachedBlob);
                setActiveBg(objectUrl);
                setIsInitialLoad(false);
            } else {
                // If not in cache, set as next to trigger load
                setNextBg(backgroundUrl);
            }
        };
        checkCache();
    }, []); // Only run once on mount

    // Handle background changes
    useEffect(() => {
        if (!backgroundUrl) return;
        if (backgroundUrl === activeBg && !isInitialLoad) return;

        // If we found it in cache during initial load, skip this
        if (isInitialLoad && activeBg) {
            setIsInitialLoad(false);
            return;
        }

        setNextBg(backgroundUrl);
    }, [backgroundUrl]);

    // Load next background
    useEffect(() => {
        if (!nextBg) return;

        const img = new Image();
        img.src = nextBg;
        img.onload = () => {
            setActiveBg(nextBg);
            setNextBg(null);
        };
        img.onerror = () => {
            // Still switch if error to avoid stuck state, maybe show fallback?
            // For now just keep old one or switch to blank if it was a distinct user action?
            // Proceeding to switch to avoid stuck loading state
            setActiveBg(nextBg);
            setNextBg(null);
        };
    }, [nextBg]);

    return (
        <div
            className="relative min-h-screen w-full overflow-hidden bg-gray-900 text-white"
            style={{ overscrollBehaviorX: 'none' }}
        >
            {/* Active (Old) Background */}
            <BackgroundLayer
                url={activeBg}
                opacity={1}
                blur={blur}
                overlay={overlay}
            />

            {/* Next (New) Background - Preloading hidden, or cross-fading? 
                Actually standard double buffering: 
                We just change the 'activeBg' once loaded.
                React diffing handles the cross-fade if we use key? 
                Or we just rely on the single layer transition?
                
                Wait, single layer transition:
                If we change backgroundImage url, it might flash white/empty while loading the new resource if not preloaded.
                But we DID preload it with `new Image()`.
                So `activeBg` is only set AFTER `img.onload`.
                
                However, if we want a CROSS FADE (old image stays visible while new opacity goes 0->1), we need two layers.
                Let's use the single layer for simplicity first as we are preloading.
                If preloaded, the switch should be instant.
                The transition-all duration-700 on the div handles opacity but not cross-fade of images.
                
                Let's stick to single layer with Preload. 
                The 'flash' usually happens because we set state BEFORE image is loaded.
                Here we set `activeBg` only AFTER onload.
                So browser has it in memory. It should be instant.
            */}

            {/* Content */}
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-start pt-16 p-8">
                {children}
            </div>
        </div>
    );
};

export default Layout;
