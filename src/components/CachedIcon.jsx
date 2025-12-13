import React, { useState, useEffect } from 'react';
import { getCachedIcon, cacheIcon } from '../utils/cache';

const CachedIcon = ({ src, alt, className, style, onError }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let objectUrl = null;

        const loadIcon = async () => {
            if (!src) {
                if (isMounted) setLoading(false);
                return;
            }

            // 1. Try to get from cache first
            const cachedBlob = await getCachedIcon(src);

            if (cachedBlob) {
                objectUrl = URL.createObjectURL(cachedBlob);
                if (isMounted) {
                    setImageSrc(objectUrl);
                    setLoading(false);
                }
                return;
            }

            // 2. If not in cache, try to fetch and cache it
            // We set the src directly to trigger the browser's load, 
            // but we also trigger a background cache operation for next time.
            if (isMounted) {
                setImageSrc(src);
                setLoading(false);

                // Background cache attempt
                // We don't await this because we want to show the image ASAP
                cacheIcon(src).catch(err => console.error('Background cache failed:', err));
            }
        };

        loadIcon();

        return () => {
            isMounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src]);

    if (loading) {
        // Optional: Render a skeleton or spacer while checking cache
        // For now, render nothing or a transparent placeholder to avoid layout shift if size is known
        return <div className={className} style={{ ...style, backgroundColor: 'rgba(255,255,255,0.1)' }} />;
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            style={style}
            onError={onError}
            loading="lazy"
        />
    );
};

export default CachedIcon;
