import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Image as ImageIcon, Layout as LayoutIcon, Cloud, RefreshCw, Globe, LogOut, Github } from 'lucide-react';
import { fetchRandomPhoto } from '../utils/unsplash';
import { cacheBackgroundImage } from '../utils/cache';
import WallpaperModal from './WallpaperModal';
import IconSelector from './IconSelector';
import ShortcutManager from './ShortcutManager';
import ToastContainer, { useToast } from './Toast';
import syncService from '../services/syncService';
import { searchWebsites, getCategories, getWebsitesByCategory } from '../utils/popularWebsites';
import { getIconUrl } from '../utils/icons';

const Settings = ({
    gridConfig,
    bgConfig,
    onConfigChange,
    onBgConfigChange,
    onBgUpdate,
    onAddShortcut,
    shortcuts,
    onEditShortcut,
    onRemoveShortcut,
    onReorderShortcuts,
    onSyncPull
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [isLoadingBg, setIsLoadingBg] = useState(false);
    const { toasts, showToast, removeToast } = useToast();

    // Sync state
    const [isLoggedIn, setIsLoggedIn] = useState(syncService.isLoggedIn());
    const [userEmail, setUserEmail] = useState(syncService.getEmail());
    const [isSyncing, setIsSyncing] = useState(false);

    const handleBgRefresh = async () => {
        setIsLoadingBg(true);
        const photo = await fetchRandomPhoto();
        if (photo) {
            localStorage.setItem('bg_url', photo.url);
            localStorage.setItem('bg_last_fetch', new Date().toDateString());
            localStorage.setItem('last_local_update', new Date().toISOString());
            cacheBackgroundImage(photo.url);
            if (onBgUpdate) onBgUpdate(photo.url);
        }
        setIsLoadingBg(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-6 right-6 p-2.5 rounded-full bg-black/20 hover:bg-black/40 
                   text-white/70 hover:text-white transition-all backdrop-blur-md z-40
                   hover:rotate-45 duration-300 border border-white/5"
            >
                <SettingsIcon className="h-5 w-5" />
            </button>

            {/* Drawer Overlay */}
            <div
                className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsOpen(false)}
                />

                {/* Drawer Panel */}
                <div
                    className={`absolute top-0 right-0 h-full w-96 bg-white/10 backdrop-blur-2xl border-l border-white/20 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-white/10">
                        <h2 className="text-xl font-semibold text-white tracking-tight">Settings</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation Tabs (Horizontal for Drawer) */}
                    <div className="flex p-2 gap-1 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('shortcuts')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all
                                ${activeTab === 'shortcuts' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            <Globe className="h-3.5 w-3.5" />
                            链接
                        </button>
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all
                                ${activeTab === 'general' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            <LayoutIcon className="h-3.5 w-3.5" />
                            通用
                        </button>
                        <button
                            onClick={() => setActiveTab('sync')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all
                                ${activeTab === 'sync' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            <Cloud className="h-3.5 w-3.5" />
                            同步
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'shortcuts' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-white mb-4">添加新快捷方式</h3>
                                    <AddShortcutForm onAddShortcut={onAddShortcut} showToast={showToast} />
                                </div>

                                {/* Popular Websites */}
                                <div className="pt-4 border-t border-white/10">
                                    <h3 className="text-sm font-medium text-white mb-4">常用网站</h3>
                                    <PopularWebsites onAddShortcut={onAddShortcut} showToast={showToast} />
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <h3 className="text-sm font-medium text-white mb-4">管理快捷方式</h3>
                                    <ShortcutManager
                                        shortcuts={shortcuts}
                                        onReorder={onReorderShortcuts}
                                        onRemove={onRemoveShortcut}
                                        onEdit={onEditShortcut}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-lg font-medium text-white mb-6">自定义布局</h3>
                                        <div className="space-y-6">
                                            {/* Rows */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <label className="text-sm text-white/80">行数</label>
                                                    <span className="text-sm font-mono text-white/60">{gridConfig.rows}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="4"
                                                    value={gridConfig.rows}
                                                    onChange={(e) => onConfigChange({ rows: Number(e.target.value) })}
                                                    className="w-full accent-white/80 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>

                                            {/* Columns */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <label className="text-sm text-white/80">列数</label>
                                                    <span className="text-sm font-mono text-white/60">{gridConfig.cols}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="3"
                                                    max="6"
                                                    value={gridConfig.cols}
                                                    onChange={(e) => onConfigChange({ cols: Number(e.target.value) })}
                                                    className="w-full accent-white/80 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>

                                            {/* Icon Size */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <label className="text-sm text-white/80">图标大小</label>
                                                    <span className="text-sm font-mono text-white/60">{gridConfig.iconSize}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="48"
                                                    max="120"
                                                    value={gridConfig.iconSize}
                                                    onChange={(e) => onConfigChange({ iconSize: Number(e.target.value) })}
                                                    className="w-full accent-white/80 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>

                                            {/* Info Text */}
                                            <p className="text-xs text-white/40 pt-2">
                                                间距会根据网格大小自动调整
                                            </p>
                                        </div>
                                    </div>

                                    {/* Display Settings */}
                                    <div className="pt-4 border-t border-white/10">
                                        <h3 className="text-sm font-medium text-white mb-4">显示</h3>
                                        <div className="space-y-4">
                                            {/* Show Search Bar Toggle */}
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm text-white/80">显示搜索栏</label>
                                                <button
                                                    type="button"
                                                    onClick={() => onConfigChange({ showSearchBar: !gridConfig.showSearchBar })}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gridConfig.showSearchBar ? 'bg-blue-600' : 'bg-white/20'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gridConfig.showSearchBar ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Background Settings */}
                                    <div className="pt-4 border-t border-white/10">
                                        <h3 className="text-sm font-medium text-white mb-4">Background</h3>
                                        <div className="space-y-6">
                                            {/* Blur Slider */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <label className="text-sm text-white/80">模糊度</label>
                                                    <span className="text-sm font-mono text-white/60">{bgConfig?.blur || 0}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="20"
                                                    value={bgConfig?.blur || 0}
                                                    onChange={(e) => onBgConfigChange({ blur: Number(e.target.value) })}
                                                    className="w-full accent-white/80 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>

                                            {/* Overlay Slider */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <label className="text-sm text-white/80">Darkness</label>
                                                    <span className="text-sm font-mono text-white/60">{bgConfig?.overlay || 0}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="90"
                                                    value={bgConfig?.overlay || 0}
                                                    onChange={(e) => onBgConfigChange({ overlay: Number(e.target.value) })}
                                                    className="w-full accent-white/80 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>

                                            {/* Wallpaper Preview & Change */}
                                            <div className="space-y-3">
                                                <label className="text-sm text-white/80">Wallpaper</label>
                                                <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-white/20 shadow-lg">
                                                    <img
                                                        src={localStorage.getItem('bg_url')}
                                                        alt="Current Wallpaper"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setIsWallpaperModalOpen(true)}
                                                        className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-sm font-medium text-white rounded-lg transition-colors shadow-lg border border-white/10"
                                                    >
                                                        更换背景
                                                    </button>
                                                    <button
                                                        onClick={handleBgRefresh}
                                                        disabled={isLoadingBg}
                                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-sm font-medium text-white rounded-lg transition-colors shadow-lg border border-white/10 disabled:opacity-50"
                                                    >
                                                        {isLoadingBg ? (
                                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        {activeTab === 'sync' && (
                            <div className="space-y-6">
                                {!isLoggedIn ? (
                                    <LoginForm
                                        onLogin={(email) => {
                                            setIsLoggedIn(true);
                                            setUserEmail(email);
                                            showToast('Logged in successfully!', 'success');
                                        }}
                                        showToast={showToast}
                                        onSyncPull={onSyncPull}
                                    />
                                ) : (
                                    <SyncPanel
                                        email={userEmail}
                                        isSyncing={isSyncing}
                                        onSync={async () => {
                                            setIsSyncing(true);
                                            try {
                                                // Collect all data to sync
                                                const data = {
                                                    shortcuts,
                                                    gridConfig,
                                                    bgConfig,
                                                    bgUrl: localStorage.getItem('bg_url') || ''
                                                };

                                                // Push to server
                                                await syncService.pushData(data);
                                                showToast('Data synced successfully!', 'success');
                                            } catch (error) {
                                                showToast(error.message, 'error');
                                            } finally {
                                                setIsSyncing(false);
                                            }
                                        }}
                                        onLogout={() => {
                                            syncService.logout();
                                            setIsLoggedIn(false);
                                            setUserEmail(null);
                                            showToast('Logged out successfully', 'success');
                                        }}
                                        lastSync={syncService.getLastSync()}
                                    />
                                )}
                            </div>
                        )}

                        {/* About Section - Always visible */}
                        <div className="pt-4 border-t border-white/10">
                            <h3 className="text-sm font-medium text-white mb-4">关于</h3>
                            <a
                                href="https://github.com/jiangnan1224/AestheticNewTab"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10 hover:border-white/20 group"
                            >
                                <Github className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
                                <div className="flex-1">
                                    <div className="text-sm text-white font-medium">Aesthetic New Tab</div>
                                    <div className="text-xs text-white/40">View source on GitHub</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <WallpaperModal
                isOpen={isWallpaperModalOpen}
                onClose={() => setIsWallpaperModalOpen(false)}
                onSelectWallpaper={(url) => {
                    localStorage.setItem('bg_url', url);
                    localStorage.setItem('bg_last_fetch', new Date().toDateString());
                    localStorage.setItem('last_local_update', new Date().toISOString());
                    cacheBackgroundImage(url);
                    if (onBgUpdate) onBgUpdate(url);
                }}
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

// Separate component for Add Shortcut form
const AddShortcutForm = ({ onAddShortcut, showToast }) => {
    const [url, setUrl] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const urlInput = formData.get('url');
        const title = formData.get('title');

        if (!urlInput) return;

        let finalUrl = urlInput;
        if (!finalUrl.startsWith('http')) {
            finalUrl = 'https://' + finalUrl;
        }

        try {
            const domain = new URL(finalUrl).hostname;
            onAddShortcut({
                id: Date.now(),
                title: title || domain,
                url: finalUrl,
                customIcon: selectedIcon // Add custom icon data
            });
            e.target.reset();
            setUrl('');
            setSelectedIcon(null);
            showToast('快捷方式添加成功！', 'success');
        } catch (err) {
            showToast('URL 无效，请检查后重试。', 'error');
        }
    };

    const handleUrlChange = (value) => {
        setUrl(value);
        if (value.length > 0) {
            const results = searchWebsites(value);
            setSearchResults(results.slice(0, 5)); // Show top 5 results
            setShowSuggestions(true);
        } else {
            setSearchResults([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectWebsite = (website) => {
        setUrl(website.url);
        setShowSuggestions(false);
        setSearchResults([]);
    };

    return (
        <form onSubmit={handleSubmit}
            className="space-y-4"
        >
            <div className="space-y-2 relative">
                <label className="text-xs text-white/60">URL 或搜索</label>
                <input
                    name="url"
                    type="text"
                    placeholder="搜索常用网站或输入 URL..."
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    onFocus={() => url && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full bg-black/10 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-white/30 transition-colors placeholder-white/30"
                    required
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl overflow-hidden">
                        {searchResults.map((site, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleSelectWebsite(site)}
                                className="w-full px-4 py-2.5 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-white font-medium">{site.name}</div>
                                        <div className="text-xs text-white/50">{site.url}</div>
                                    </div>
                                    <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
                                        {site.category}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="space-y-2">
                <label className="text-xs text-white/60">名称（可选）</label>
                <input
                    name="title"
                    type="text"
                    placeholder="我的网站"
                    className="w-full bg-black/10 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-white/30 transition-colors placeholder-white/30"
                />
            </div>

            {/* Icon Selector */}
            <IconSelector
                url={url}
                onSelect={setSelectedIcon}
                selectedIcon={selectedIcon}
            />

            <button
                type="submit"
                className="w-full py-2.5 bg-white/20 hover:bg-white/30 text-sm font-medium text-white rounded-lg transition-colors shadow-lg border border-white/10"
            >
                Add Shortcut
            </button>
        </form>
    );
};

// Login Form Component
const LoginForm = ({ onLogin, showToast, onSyncPull }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isRegistering) {
                await syncService.register(email, password);
                showToast('账户创建成功！', 'success');
            } else {
                await syncService.login(email, password);
            }
            onLogin(email);
            // Trigger immediate pull after login
            if (onSyncPull) {
                onSyncPull();
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-sm font-medium text-white mb-4">
                {isRegistering ? '创建账户' : '登录同步'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs text-white/60">邮箱</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-black/10 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-white/30 transition-colors placeholder-white/30"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs text-white/60">密码</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/10 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-white/30 transition-colors placeholder-white/30"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white rounded-lg transition-colors shadow-lg disabled:opacity-50"
                >
                    {isLoading ? '请稍候...' : (isRegistering ? '创建账户' : '登录')}
                </button>

                <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="w-full text-xs text-white/60 hover:text-white transition-colors"
                >
                    {isRegistering ? '已有账户？登录' : '没有账户？注册'}
                </button>
            </form>

            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/60 leading-relaxed">
                    同步您的快捷方式、设置和背景到云端，您可以在所有设备上访问您的数据。
                </p>
            </div>
        </div>
    );
};

// Sync Panel Component
const SyncPanel = ({ email, isSyncing, onSync, onLogout, lastSync }) => {
    const formatLastSync = (timestamp) => {
        if (!timestamp) return '从未';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    return (
        <div>
            <h3 className="text-sm font-medium text-white mb-4">同步设置</h3>

            <div className="space-y-4">
                {/* User Info */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/60">已登录</span>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-1 text-xs text-white/60 hover:text-red-400 transition-colors"
                        >
                            <LogOut className="h-3 w-3" />
                            登出
                        </button>
                    </div>
                    <div className="text-sm text-white font-medium">{email}</div>
                </div>

                {/* Last Sync */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-white/60 mb-1">上次同步</div>
                    <div className="text-sm text-white">{formatLastSync(lastSync)}</div>
                </div>

                {/* Info */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-xs text-white/60 leading-relaxed">
                        您的快捷方式、设置和背景会自动同步到云端。修改数据后会自动保存。
                    </p>
                </div>

            </div>
        </div>
    );
};

// Popular Websites Component
const PopularWebsites = ({ onAddShortcut, showToast }) => {
    const categories = getCategories();
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const websites = getWebsitesByCategory(selectedCategory);

    const handleQuickAdd = (website) => {
        try {
            onAddShortcut({
                id: Date.now(),
                title: website.name,
                url: website.url,
            });
            showToast(`已添加 ${website.name}！`, 'success');
        } catch (error) {
            showToast('添加失败', 'error');
        }
    };

    return (
        <div className="space-y-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedCategory === category
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Website Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                {websites.map((website, index) => (
                    <button
                        key={index}
                        onClick={() => handleQuickAdd(website)}
                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10 hover:border-white/20 text-left group"
                    >
                        <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg overflow-hidden">
                            <img
                                src={getIconUrl(website.url)}
                                alt={website.name}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                    // Improved fallback chain with better sources
                                    const currentSrc = e.target.src;
                                    const domain = new URL(website.url).hostname;

                                    if (currentSrc.includes('icon.horse')) {
                                        e.target.src = `https://logo.clearbit.com/${domain}`;
                                    } else if (currentSrc.includes('clearbit')) {
                                        e.target.src = `https://unavatar.io/${domain}?fallback=false`;
                                    } else if (currentSrc.includes('unavatar')) {
                                        e.target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                                    } else if (currentSrc.includes('google.com/s2/favicons')) {
                                        e.target.src = `https://api.faviconkit.com/${domain}/128`;
                                    } else if (currentSrc.includes('faviconkit')) {
                                        e.target.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
                                    } else {
                                        // Final fallback - show first letter
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">${website.name[0].toUpperCase()}</div>`;
                                    }
                                }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium truncate">{website.name}</div>
                            <div className="text-xs text-white/40 truncate">{website.url.replace('https://', '')}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Settings;
