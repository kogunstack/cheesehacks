import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Workflows from './pages/Workflows';
import PlaceholderPage from './pages/PlaceholderPage';
import { useProjectStore } from './store/useProjectStore';
import { useRef, useCallback } from 'react';
import { exportCanvasAsPng } from './utils/export';

function AppLayout() {
  const location = useLocation();
  const { getProject } = useProjectStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Extract project name from URL if on a workflow canvas
  const workflowMatch = location.pathname.match(/^\/workflows\/(.+)/);
  const projectId = workflowMatch?.[1];
  const project = projectId ? getProject(projectId) : null;

  const handleExport = useCallback(async () => {
    if (!canvasRef.current || !project) return;
    await exportCanvasAsPng(canvasRef.current, project.name);
  }, [project]);

  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          projectName={project?.name || null}
          onExport={handleExport}
        />
        <main className="flex-1 flex min-h-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/workflows/:projectId" element={<Workflows />} />
            <Route
              path="/docs"
              element={
                <PlaceholderPage
                  title="Docs"
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  }
                />
              }
            />
            <Route
              path="/tasks"
              element={
                <PlaceholderPage
                  title="Tasks"
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                  }
                />
              }
            />
            <Route
              path="/people"
              element={
                <PlaceholderPage
                  title="People"
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  }
                />
              }
            />
            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Settings"
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                  }
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
