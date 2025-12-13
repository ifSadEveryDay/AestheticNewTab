import React, { useState, useEffect } from 'react';
import { Upload, Check } from 'lucide-react';
import { getAllIconUrls } from '../utils/icons';

const IconSelector = ({ url, onSelect, selectedIcon }) => {
    const [iconPreviews, setIconPreviews] = useState([]);
    const [selectedSource, setSelectedSource] = useState(selectedIcon || null);
    const [customIcon, setCustomIcon] = useState(null);
    const [failedSources, setFailedSources] = useState(new Set());
    const [iconDimensions, setIconDimensions] = useState({});

    useEffect(() => {
        if (url) {
            const icons = getAllIconUrls(url);
            setIconPreviews(icons);
            setFailedSources(new Set());
            setIconDimensions({});
        }
    }, [url]);

    const handleImageError = (source) => {
        setFailedSources(prev => {
            const next = new Set(prev);
            next.add(source);
            return next;
        });
    };

    const handleImageLoad = (source, e) => {
        const { naturalWidth, naturalHeight } = e.target;
        if (naturalWidth && naturalHeight) {
            setIconDimensions(prev => ({
                ...prev,
                [source]: `${naturalWidth}x${naturalHeight}`
            }));
        }
    };

    const handleIconSelect = (source, iconUrl) => {
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
                {iconPreviews
                    .filter(icon => !failedSources.has(icon.source))
                    .map((icon) => (
                        <button
                            key={icon.source}
                            type="button"
                            onClick={() => handleIconSelect(icon.source, icon.url)}
                            className={`relative aspect-square rounded-lg bg-white overflow-hidden border-2 transition-all hover:scale-105 ${selectedSource === icon.source
                                ? 'border-blue-500 ring-2 ring-blue-500/50'
                                : 'border-white/10 hover:border-white/30'
                                }`}
                            title={`${icon.name} ${iconDimensions[icon.source] ? `(${iconDimensions[icon.source]})` : ''}`}
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
                                    {iconDimensions[icon.source]}
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
