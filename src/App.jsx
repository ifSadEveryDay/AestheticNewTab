import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import SearchBar from './components/SearchBar';
import Settings from './components/Settings';
import ShortcutGrid from './components/ShortcutGrid';

import { fetchRandomPhoto } from './utils/unsplash';
import { cacheBackgroundImage } from './utils/cache';

import { arrayMove } from '@dnd-kit/sortable';
import syncService from './services/syncService';

function App() {
  const [bgUrl, setBgUrl] = useState(localStorage.getItem('bg_url') || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop');
  const [gridConfig, setGridConfig] = useState(() => {
    const saved = localStorage.getItem('grid_config');
    return saved ? JSON.parse(saved) : {
      cols: 5,
      rows: 3,
      iconSize: 80,
      showSearchBar: true
    };
  });
  const [bgConfig, setBgConfig] = useState(() => {
    const saved = localStorage.getItem('bg_config');
    return saved ? JSON.parse(saved) : {
      blur: 2,
      overlay: 30
    };
  });

  const [shortcuts, setShortcuts] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Track if we're currently pulling data to prevent auto-push during pull
  const isPullingRef = useRef(false);

  // Auto-pull from cloud - defined with useCallback to avoid closure issues
  const pullFromCloud = useCallback(async () => {
    if (!syncService.isLoggedIn()) return;

    try {
      isPullingRef.current = true; // Set flag before pulling

      const cloudData = await syncService.pullData();
      if (!cloudData) {
        isPullingRef.current = false;
        return;
      }

      // Get last local update time
      const lastLocalUpdate = localStorage.getItem('last_local_update');
      const lastSync = syncService.getLastSync();

      // If cloud data is newer, use it
      if (!lastLocalUpdate || (lastSync && new Date(lastSync) > new Date(lastLocalUpdate))) {
        console.log('Pulling data from cloud...');

        let updated = false;

        if (cloudData.shortcuts) {
          console.log('Updating shortcuts:', cloudData.shortcuts);
          setShortcuts(cloudData.shortcuts);
          localStorage.setItem('shortcuts', JSON.stringify(cloudData.shortcuts));
          updated = true;
        }
        if (cloudData.gridConfig) {
          console.log('Updating gridConfig:', cloudData.gridConfig);
          setGridConfig(cloudData.gridConfig);
          localStorage.setItem('grid_config', JSON.stringify(cloudData.gridConfig));
          updated = true;
        }
        if (cloudData.bgConfig) {
          console.log('Updating bgConfig:', cloudData.bgConfig);
          setBgConfig(cloudData.bgConfig);
          localStorage.setItem('bg_config', JSON.stringify(cloudData.bgConfig));
          updated = true;
        }
        if (cloudData.bgUrl) {
          console.log('Updating bgUrl:', cloudData.bgUrl);
          setBgUrl(cloudData.bgUrl);
          localStorage.setItem('bg_url', cloudData.bgUrl);
          updated = true;
        }

        if (updated) {
          console.log('Cloud data pulled successfully - UI should update now');
        }
      } else {
        console.log('Local data is up to date');
      }

      // Reset flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isPullingRef.current = false;
      }, 100);
    } catch (error) {
      console.error('Failed to pull from cloud:', error);
      isPullingRef.current = false; // Reset flag on error
    }
  }, []);

  // Load shortcuts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('shortcuts');
    if (saved) {
      setShortcuts(JSON.parse(saved));
    } else {
      const defaults = [
        { id: 1, title: 'Google', url: 'https://google.com' },
        { id: 2, title: 'YouTube', url: 'https://youtube.com' },
        { id: 3, title: 'GitHub', url: 'https://github.com' },
        { id: 4, title: 'Bilibili', url: 'https://bilibili.com' },
      ];
      setShortcuts(defaults);
      localStorage.setItem('shortcuts', JSON.stringify(defaults));
    }

    // Initial pull on startup
    pullFromCloud();

    // Periodic sync check (every 180 seconds)
    const syncInterval = setInterval(() => {
      if (syncService.isLoggedIn()) {
        pullFromCloud();
      }
    }, 30000);

    // Pull when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && syncService.isLoggedIn()) {
        pullFromCloud();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for storage changes (e.g. from Popup)
    const handleStorageChange = (e) => {
      if (e.key === 'shortcuts') {
        const newValue = e.newValue;
        if (newValue) {
          setShortcuts(JSON.parse(newValue));
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pullFromCloud]);

  const handleAddShortcut = (newShortcut) => {
    const updated = [...shortcuts, newShortcut];
    setShortcuts(updated);
    localStorage.setItem('shortcuts', JSON.stringify(updated));
    localStorage.setItem('last_local_update', new Date().toISOString());
  };

  const handleRemoveShortcut = (id) => {
    const updated = shortcuts.filter(s => s.id !== id);
    setShortcuts(updated);
    localStorage.setItem('shortcuts', JSON.stringify(updated));
    localStorage.setItem('last_local_update', new Date().toISOString());
  };

  const handleReorder = (newShortcuts) => {
    setShortcuts(newShortcuts);
    localStorage.setItem('shortcuts', JSON.stringify(newShortcuts));
    localStorage.setItem('last_local_update', new Date().toISOString());
  };

  const handleEditShortcut = (updatedShortcut) => {
    const updated = shortcuts.map(s =>
      s.id === updatedShortcut.id ? updatedShortcut : s
    );
    setShortcuts(updated);
    localStorage.setItem('shortcuts', JSON.stringify(updated));
    localStorage.setItem('last_local_update', new Date().toISOString());
  };

  const handleBgConfigChange = (newConfig) => {
    setBgConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('bg_config', JSON.stringify(updated));
      localStorage.setItem('last_local_update', new Date().toISOString());
      return updated;
    });
  };

  const handleConfigChange = (newConfig) => {
    setGridConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('grid_config', JSON.stringify(updated));
      localStorage.setItem('last_local_update', new Date().toISOString());
      return updated;
    });
  };


  // Disable browser back/forward gestures (two-finger swipe on trackpad)
  useEffect(() => {
    const preventBrowserGesture = (e) => {
      // Prevent browser navigation gestures (horizontal swipe)
      // We block it if there's ANY horizontal movement to be safe
      if (Math.abs(e.deltaX) > 0) {
        e.preventDefault();
      }
    };

    // Must use non-passive to be able to preventDefault
    window.addEventListener('wheel', preventBrowserGesture, { passive: false });

    return () => {
      window.removeEventListener('wheel', preventBrowserGesture);
    };
  }, []);

  // Cache background image when it changes
  useEffect(() => {
    if (bgUrl) {
      cacheBackgroundImage(bgUrl);
    }
  }, [bgUrl]);

  // Auto-sync when data changes (debounced)
  useEffect(() => {
    // Only sync if logged in and not currently pulling
    if (!syncService.isLoggedIn() || isPullingRef.current) return;

    const syncData = async () => {
      try {
        const data = {
          shortcuts,
          gridConfig,
          bgConfig,
          bgUrl
        };
        await syncService.pushData(data);
        console.log('Auto-sync completed');
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    };

    // Debounce sync - wait 2 seconds after last change
    const timeoutId = setTimeout(syncData, 2000);

    return () => clearTimeout(timeoutId);
  }, [shortcuts, gridConfig, bgConfig, bgUrl]);

  return (
    <Layout backgroundUrl={bgUrl} bgConfig={bgConfig}>
      <Settings
        gridConfig={gridConfig}
        bgConfig={bgConfig}
        onConfigChange={handleConfigChange}
        onBgConfigChange={handleBgConfigChange}
        onBgUpdate={setBgUrl}
        onAddShortcut={handleAddShortcut}
        shortcuts={shortcuts}
        onEditShortcut={handleEditShortcut}
        onRemoveShortcut={handleRemoveShortcut}
        onReorderShortcuts={handleReorder}
        onSyncPull={pullFromCloud}
      />
      {/* Top Left Time Widget */}
      <div className="absolute top-8 left-8 z-50">
        <h1 className="text-6xl font-light text-white/90 drop-shadow-md tracking-wide select-none">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </h1>
      </div>

      <div className="w-full flex flex-col items-center mt-8">
        {gridConfig.showSearchBar && <SearchBar />}

        <ShortcutGrid
          config={gridConfig}
          shortcuts={shortcuts}
        />
      </div>
    </Layout>
  );
}

export default App;
