import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Upload, Check } from 'lucide-react';
import { getAllIconUrls } from '../utils/icons';

const IconSelector = ({ url, onSelect, selectedIcon, autoSelectFirst = false }) => {
    const [iconPreviews, setIconPreviews] = useState([]);
    const [selectedSource, setSelectedSource] = useState(null);
    const [customIcon, setCustomIcon] = useState(null);
    const [failedSources, setFailedSources] = useState(new Set());
    const [iconDimensions, setIconDimensions] = useState({});
    const resolvedSourcesRef = useRef(new Set());
    const [resolvedCount, setResolvedCount] = useState(0);
    const [totalSources, setTotalSources] = useState(0);
    const [autoSelectReady, setAutoSelectReady] = useState(false);
    const [autoSelected, setAutoSelected] = useState(false);
    const [hasUserSelected, setHasUserSelected] = useState(false);

    useEffect(() => {
        if (!selectedIcon) {
            setSelectedSource(null);
            setCustomIcon(null);
            return;
        }

        if (selectedIcon.type === 'custom') {
            setSelectedSource('custom');
            setCustomIcon(selectedIcon.data);
            return;
        }

        if (selectedIcon.type === 'source') {
            setSelectedSource(selectedIcon.source);
            setCustomIcon(null);
        }
    }, [selectedIcon]);

    useEffect(() => {
        if (url) {
            const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
            const icons = getAllIconUrls(normalizedUrl);
            setIconPreviews(icons);
            setFailedSources(new Set());
            setIconDimensions({});

            resolvedSourcesRef.current = new Set();
            setResolvedCount(0);
            setTotalSources(icons.length);
            setAutoSelected(false);
            setAutoSelectReady(false);
            setHasUserSelected(false);

            const timeoutId = window.setTimeout(() => {
                setAutoSelectReady(true);
            }, 1500);

            return () => {
                window.clearTimeout(timeoutId);
            };
        }
    }, [url]);

    const markResolved = (source) => {
        if (resolvedSourcesRef.current.has(source)) return;
        resolvedSourcesRef.current.add(source);
        setResolvedCount(resolvedSourcesRef.current.size);
    };

    const sortedIconPreviews = useMemo(() => {
        return iconPreviews
            .map((icon, index) => {
                const dims = iconDimensions[icon.source];
                const maxSide = dims ? Math.max(dims.width, dims.height) : 0;
                const area = dims ? dims.width * dims.height : 0;
                return { icon, index, maxSide, area };
            })
            .filter(({ icon }) => !failedSources.has(icon.source))
            .sort((a, b) => {
                if (b.maxSide !== a.maxSide) return b.maxSide - a.maxSide;
                if (b.area !== a.area) return b.area - a.area;
                return a.index - b.index;
            })
            .map(({ icon }) => icon);
    }, [iconPreviews, failedSources, iconDimensions]);

    const allResolved = totalSources > 0 && resolvedCount >= totalSources;

    useEffect(() => {
        if (!autoSelectFirst) return;
        if (hasUserSelected) return;
        if (selectedSource) return;
        if (selectedIcon) return;
        if (sortedIconPreviews.length === 0) return;
        if (!allResolved && !autoSelectReady) return;

        const first = sortedIconPreviews[0];
        setSelectedSource(first.source);
        setCustomIcon(null);
        onSelect({ type: 'source', source: first.source, url: first.url });
        setAutoSelected(true);
    }, [autoSelectFirst, hasUserSelected, selectedSource, selectedIcon, sortedIconPreviews, allResolved, autoSelectReady, onSelect]);

    useEffect(() => {
        if (!autoSelectFirst) return;
        if (!allResolved) return;
        if (hasUserSelected) return;
        if (selectedIcon) return;
        if (sortedIconPreviews.length === 0) return;

        const first = sortedIconPreviews[0];
        if (selectedSource === first.source) return;

        setSelectedSource(first.source);
        setCustomIcon(null);
        onSelect({ type: 'source', source: first.source, url: first.url });
    }, [autoSelectFirst, allResolved, hasUserSelected, selectedIcon, selectedSource, sortedIconPreviews, onSelect]);

    const handleImageError = (source) => {
        setFailedSources(prev => {
            const next = new Set(prev);
            next.add(source);
            return next;
        });

        markResolved(source);
    };

    const handleImageLoad = (source, e) => {
        const { naturalWidth, naturalHeight } = e.target;
        if (naturalWidth && naturalHeight) {
            setIconDimensions(prev => ({
                ...prev,
                [source]: { width: naturalWidth, height: naturalHeight }
            }));
        }

        markResolved(source);
    };

    const handleIconSelect = (source, iconUrl) => {
        setHasUserSelected(true);
        setSelectedSource(source);
        setCustomIcon(null);
        onSelect({ type: 'source', source, url: iconUrl });
    };

    const handleCustomUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 500KB)
        if (file.size > 500 * 1024) {
            alert('Image size should be less than 500KB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setHasUserSelected(true);
            setCustomIcon(reader.result);
            setSelectedSource('custom');
            onSelect({ type: 'custom', data: reader.result });
        };
        reader.readAsDataURL(file);
    };

    if (!url) {
        return (
            <div className="text-center py-4 text-white/40 text-sm">
                Enter a URL to preview icons
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <label className="text-xs text-white/60">Choose Icon</label>

            {/* Icon Previews Grid */}
            <div className="grid grid-cols-6 gap-2">
                {sortedIconPreviews
                    .map((icon) => (
                        <button
                            key={icon.source}
                            type="button"
                            onClick={() => handleIconSelect(icon.source, icon.url)}
                            className={`relative aspect-square rounded-lg bg-white overflow-hidden border-2 transition-all hover:scale-105 ${selectedSource === icon.source
                                ? 'border-blue-500 ring-2 ring-blue-500/50'
                                : 'border-white/10 hover:border-white/30'
                                }`}
                            title={`${icon.name} ${iconDimensions[icon.source] ? `(${iconDimensions[icon.source].width}x${iconDimensions[icon.source].height})` : ''}`}
                        >
                            <img
                                src={icon.url}
                                alt={icon.name}
                                className="w-full h-full object-contain p-1"
                                onError={() => handleImageError(icon.source)}
                                onLoad={(e) => handleImageLoad(icon.source, e)}
                            />
                            {iconDimensions[icon.source] && (
                                <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-[8px] text-white/90 px-1 rounded backdrop-blur-[2px]">
                                    {iconDimensions[icon.source].width}x{iconDimensions[icon.source].height}
                                </div>
                            )}
                            {selectedSource === icon.source && (
                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-blue-600" />
                                </div>
                            )}
                        </button>
                    ))}

                {/* Custom Upload Button */}
                <label
                    className={`relative aspect-square rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center hover:scale-105 ${selectedSource === 'custom'
                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50'
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                        }`}
                    title="Upload custom icon"
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomUpload}
                        className="hidden"
                    />
                    {customIcon ? (
                        <>
                            <img
                                src={customIcon}
                                alt="Custom"
                                className="w-full h-full object-contain p-1"
                            />
                            {selectedSource === 'custom' && (
                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-blue-600" />
                                </div>
                            )}
                        </>
                    ) : (
                        <Upload className="h-4 w-4 text-white/40" />
                    )}
                </label>
            </div>

            <p className="text-xs text-white/40">
                Click an icon to select, or upload your own (max 500KB)
            </p>
        </div>
    );
};

export default IconSelector;
