import React, { useState, useEffect, useCallback } from 'react';
import { Creator, SiteSettings } from './types/index.js';
import { api } from './services/apiClient.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { HomePage } from './pages/HomePage.js';
import { LivePage } from './pages/LivePage.js';
import { StreamersPage } from './pages/StreamersPage.js';
import { StreamerProfilePage } from './pages/StreamerProfilePage.js';
import { FeaturedPage } from './pages/FeaturedPage.js';
import { VodsPage } from './pages/VodsPage.js';
import { SquadStreamPage } from './pages/SquadStreamPage.js';
import { CityMapPage } from './pages/CityMapPage.js';
import { ClipsPage } from './pages/ClipsPage.js';
import { EventsPage } from './pages/EventsPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { FiveMStatusBar } from './components/FiveMStatusBar.js';
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AdminLoginPage } from './pages/admin/AdminLoginPage.js';
import { JoinStreamerModal } from './components/JoinStreamerModal.js';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [liveCreators, setLiveCreators] = useState<Creator[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<Creator[]>([]);
  const [allCreators, setAllCreators] = useState<Creator[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Navigate handler that updates browser history
  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen for browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch Public Data
  const fetchData = useCallback(async () => {
    try {
      const [liveRes, featRes, streamRes, setRes] = await Promise.all([
        api.getLive(),
        api.getFeatured(),
        api.getStreamers({ filter: 'all' }),
        api.getSettings(),
      ]);

      setLiveCreators(liveRes.data);
      setFeaturedCreators(featRes.data);
      setAllCreators(streamRes.data);
      setSettings(setRes.data);
    } catch (err) {
      console.warn('[App] Failed fetching live data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check admin session on mount
  useEffect(() => {
    api.adminGetMe().then(user => {
      if (user) setAdminUser(user);
    }).catch(() => {});
  }, []);

  // Initial fetch + SSE real-time listener + polling fallback
  useEffect(() => {
    fetchData();

    // Setup Server-Sent Events (SSE) for live stream updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'SYNC_UPDATE') {
            console.log('[SSE] Live stream sync update received, refreshing status...');
            fetchData();
          }
        } catch (e) {
          // ignore parsing error
        }
      };
      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (err) {
      console.warn('[SSE] EventSource unavailable:', err);
    }

    // Polling fallback every 30-45s
    const intervalTime = (settings?.liveRefreshIntervalSeconds || 30) * 1000;
    const pollInterval = setInterval(() => {
      fetchData();
    }, intervalTime);

    return () => {
      eventSource?.close();
      clearInterval(pollInterval);
    };
  }, [fetchData, settings?.liveRefreshIntervalSeconds]);

  // Determine current route
  const renderRoute = () => {
    // 1. Admin Login
    if (currentPath === '/admin/login') {
      return (
        <AdminLoginPage
          onLoginSuccess={(user) => {
            setAdminUser(user);
            navigate('/admin');
          }}
          onNavigateHome={() => navigate('/')}
        />
      );
    }

    // 2. Admin Dashboard
    if (currentPath.startsWith('/admin')) {
      if (!adminUser) {
        return (
          <AdminLoginPage
            onLoginSuccess={(user) => {
              setAdminUser(user);
              navigate('/admin');
            }}
            onNavigateHome={() => navigate('/')}
          />
        );
      }
      return (
        <AdminDashboard
          adminUser={adminUser}
          onLogout={async () => {
            await api.adminLogout();
            setAdminUser(null);
            navigate('/');
          }}
          onNavigateHome={() => navigate('/')}
        />
      );
    }

    // 3. Streamer Profile (/streamer/:slug or /streamers/:slug)
    const profileMatch = currentPath.match(/^\/(?:streamer|streamers)\/([a-zA-Z0-9_-]+)/);
    if (profileMatch) {
      const slug = profileMatch[1];
      return (
        <StreamerProfilePage
          slug={slug}
          onNavigateBack={() => navigate('/streamers')}
        />
      );
    }

    // 4. Live Page
    if (currentPath === '/live') {
      return (
        <LivePage
          liveCreators={liveCreators}
          loading={loading}
          onRefresh={fetchData}
          onNavigateToProfile={(slug) => navigate(`/streamer/${slug}`)}
          onNavigate={navigate}
          settings={settings}
        />
      );
    }

    // 5. Streamers Directory
    if (currentPath === '/streamers') {
      return (
        <StreamersPage
          creators={allCreators}
          onNavigateToProfile={(slug) => navigate(`/streamer/${slug}`)}
        />
      );
    }

    // 6. Featured Page
    if (currentPath === '/featured') {
      return (
        <FeaturedPage
          featuredCreators={featuredCreators}
          onNavigateToProfile={(slug) => navigate(`/streamer/${slug}`)}
          onNavigate={navigate}
        />
      );
    }

    // 7. VODs / Past Broadcasts Page
    if (currentPath === '/vods' || currentPath === '/past-broadcasts') {
      return (
        <VodsPage
          onNavigate={navigate}
          onNavigateToProfile={(slug: string) => navigate(`/streamer/${slug}`)}
        />
      );
    }

    // 8. Multi-Stream Squad View
    if (currentPath === '/squad' || currentPath === '/squad-stream') {
      return (
        <SquadStreamPage
          onNavigateHome={() => navigate('/')}
          onNavigateToProfile={(slug: string) => navigate(`/streamer/${slug}`)}
        />
      );
    }

    // 9. Interactive City Map & Districts
    if (currentPath === '/map' || currentPath === '/city-map') {
      return (
        <CityMapPage
          creators={allCreators}
          onNavigateToProfile={(slug: string) => navigate(`/streamer/${slug}`)}
          onNavigateToSquad={(streamers: string[]) => navigate(`/squad?streamers=${streamers.join(',')}`)}
        />
      );
    }

    // 10. Community Stream Clips
    if (currentPath === '/clips' || currentPath === '/highlights') {
      return (
        <ClipsPage
          onNavigateHome={() => navigate('/')}
        />
      );
    }

    // 11. Server Events & Schedule
    if (currentPath === '/events' || currentPath === '/schedule') {
      return (
        <EventsPage
          creators={allCreators}
          onNavigateToProfile={(slug: string) => navigate(`/streamer/${slug}`)}
          onNavigateToSquad={() => navigate('/squad')}
        />
      );
    }

    // 12. About Page
    if (currentPath === '/about') {
      return (
        <AboutPage
          settings={settings}
          onNavigate={navigate}
        />
      );
    }

    // Default: Home Page
    return (
      <HomePage
        liveCreators={liveCreators}
        featuredCreators={featuredCreators}
        allCreators={allCreators}
        settings={settings}
        loading={loading}
        onNavigate={navigate}
        onNavigateToProfile={(slug) => navigate(`/streamer/${slug}`)}
        onRefresh={fetchData}
      />
    );
  };

  const isAdminView = currentPath.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 font-sans selection:bg-purple-600 selection:text-white">
      {!isAdminView && (
        <>
          <FiveMStatusBar onNavigateToSquad={() => navigate('/squad')} />
          <Navbar
            currentPath={currentPath}
            onNavigate={navigate}
            settings={settings}
            adminUser={adminUser}
            liveCount={liveCreators.length}
            onOpenJoinModal={() => setShowJoinModal(true)}
          />
        </>
      )}

      <main className="flex-1">
        {renderRoute()}
      </main>

      {!isAdminView && (
        <Footer
          onNavigate={navigate}
          settings={settings}
        />
      )}

      <JoinStreamerModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
