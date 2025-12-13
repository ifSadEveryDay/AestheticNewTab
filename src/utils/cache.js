

const ICON_CACHE_NAME = 'icon-cache-v1';

export const getCachedIcon = async (url) => {
    try {
        if (!url.startsWith('http')) return null;

        const cache = await caches.open(ICON_CACHE_NAME);
        const response = await cache.match(url);
        if (response) {
            return await response.blob();
        }
        return null;
    } catch (error) {
        console.error('Error getting cached icon:', error);
        return null;
    }
};

export const cacheIcon = async (url) => {
    try {
        if (!url.startsWith('http')) return false;

        const cache = await caches.open(ICON_CACHE_NAME);

        // Check if already cached
        const match = await cache.match(url);
        if (match) return true;

        // Fetch and cache
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error('Network response was not ok');

        await cache.put(url, response.clone());
        return true;
    } catch (error) {
        console.error('Error caching icon:', error);
        return false;
    }
};

const BG_CACHE_NAME = 'bg-cache';

export const getCachedBackgroundImage = async (url) => {
    try {
        if (!url.startsWith('http')) return null;

        const cache = await caches.open(BG_CACHE_NAME);
        const response = await cache.match(url);
        if (response) {
            return await response.blob();
        }
        return null;
    } catch (error) {
        console.error('Error getting cached background:', error);
        return null;
    }
};

export const cacheBackgroundImage = async (url) => {
    try {
        if (!url.startsWith('http')) return false;

        const cache = await caches.open(BG_CACHE_NAME);

        // Check if already cached
        const match = await cache.match(url);
        if (match) return true;

        // Fetch and cache
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error('Network response was not ok');

        await cache.put(url, response.clone());
        return true;
    } catch (error) {
        console.error('Error caching background:', error);
        return false;
    }
};
