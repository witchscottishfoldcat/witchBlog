import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import { applySiteBranding } from './utils/branding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VisitorAnalytics from './pages/VisitorAnalytics';
import LiveLogs from './pages/LiveLogs';
import MDFiles from './pages/MDFiles';
import MDFileEdit from './pages/MDFileEdit';
import Diaries from './pages/Diaries';
import DiaryEdit from './pages/DiaryEdit';
import Links from './pages/Links';
import LinkEdit from './pages/LinkEdit';
import ResourceLinks from './pages/ResourceLinks';
import ResourceLinkEdit from './pages/ResourceLinkEdit';
import Timelines from './pages/Timelines';
import TimelineEdit from './pages/TimelineEdit';
import Users from './pages/Users';
import UserEdit from './pages/UserEdit';
import Skills from './pages/Skills';
import SkillEdit from './pages/SkillEdit';
import Projects from './pages/Projects';
import ProjectEdit from './pages/ProjectEdit';
import AnimeWatchlist from './pages/AnimeWatchlist';
import AnimeWatchlistEdit from './pages/AnimeWatchlistEdit';
import Albums from './pages/Albums';
import AlbumEdit from './pages/AlbumEdit';
import AlbumPhotos from './pages/AlbumPhotos';
import Music from './pages/Music';
import Games from './pages/Games';
import GamesEdit from './pages/GamesEdit';
import ScheduledTasks from './pages/ScheduledTasks';
import AboutFiles from './pages/AboutFiles';
import SiteConfig from './pages/SiteConfig';
import Admin from './pages/Admin';
import Archives from './pages/Archives';
import ArchiveDetail from './pages/ArchiveDetail';
import Profile from './pages/Profile';
import Sponsors from './pages/Sponsors';
import SponsorEdit from './pages/SponsorEdit';
import { ToastProvider } from './components/Toast';
import './App.css';

function App() {
  // 应用站点品牌（标签页标题 + 网站配置中的 favicon，登录页同样生效）
  useEffect(() => {
    applySiteBranding();
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* 以下为超管专属页面：读接口即要求超管权限 */}
                  <Route path="/visitors" element={<SuperAdminRoute><VisitorAnalytics /></SuperAdminRoute>} />
                  <Route path="/live-logs" element={<SuperAdminRoute><LiveLogs /></SuperAdminRoute>} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/md-files" element={<MDFiles />} />
                  <Route path="/md-files/new" element={<MDFileEdit />} />
                  <Route path="/md-files/:id/edit" element={<MDFileEdit />} />
                  <Route path="/diaries" element={<Diaries />} />
                  <Route path="/diaries/new" element={<DiaryEdit />} />
                  <Route path="/diaries/:id/edit" element={<DiaryEdit />} />
                  <Route path="/links" element={<Links />} />
                  <Route path="/links/new" element={<LinkEdit />} />
                  <Route path="/links/:id/edit" element={<LinkEdit />} />
                  <Route path="/resource-links" element={<ResourceLinks />} />
                  <Route path="/resource-links/new" element={<ResourceLinkEdit />} />
                  <Route path="/resource-links/:id/edit" element={<ResourceLinkEdit />} />
                  <Route path="/timelines" element={<Timelines />} />
                  <Route path="/timelines/new" element={<TimelineEdit />} />
                  <Route path="/timelines/:id/edit" element={<TimelineEdit />} />
                  <Route path="/users" element={<SuperAdminRoute><Users /></SuperAdminRoute>} />
                  <Route path="/users/new" element={<SuperAdminRoute><UserEdit /></SuperAdminRoute>} />
                  <Route path="/users/:id/edit" element={<SuperAdminRoute><UserEdit /></SuperAdminRoute>} />
                  <Route path="/skills" element={<Skills />} />
                  <Route path="/skills/new" element={<SkillEdit />} />
                  <Route path="/skills/:id/edit" element={<SkillEdit />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/new" element={<ProjectEdit />} />
                  <Route path="/projects/:id/edit" element={<ProjectEdit />} />
                  <Route path="/anime-watchlist" element={<AnimeWatchlist />} />
                  <Route path="/anime-watchlist/new" element={<AnimeWatchlistEdit />} />
                  <Route path="/anime-watchlist/:id/edit" element={<AnimeWatchlistEdit />} />
                  <Route path="/albums" element={<Albums />} />
                  <Route path="/albums/new" element={<AlbumEdit />} />
                  <Route path="/albums/:id/edit" element={<AlbumEdit />} />
                  <Route path="/albums/:id/photos" element={<AlbumPhotos />} />
                  <Route path="/music" element={<Music />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/games/new" element={<GamesEdit />} />
                  <Route path="/games/:id/edit" element={<GamesEdit />} />
                  <Route path="/scheduled-tasks" element={<SuperAdminRoute><ScheduledTasks /></SuperAdminRoute>} />
                  <Route path="/about-files" element={<SuperAdminRoute><AboutFiles /></SuperAdminRoute>} />
                  <Route path="/archives" element={<Archives />} />
                  <Route path="/archives/:id" element={<ArchiveDetail />} />
                  <Route path="/site-config" element={<SuperAdminRoute><SiteConfig /></SuperAdminRoute>} />
                  <Route path="/sponsors" element={<Sponsors />} />
                  <Route path="/sponsors/new" element={<SponsorEdit />} />
                  <Route path="/sponsors/:id/edit" element={<SponsorEdit />} />
                  <Route path="/admin" element={<SuperAdminRoute><Admin /></SuperAdminRoute>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </ToastProvider>
  );
}

export default App;
