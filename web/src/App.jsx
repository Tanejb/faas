import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { ThemeProvider } from "./context/ThemeContext";
import { InboxProvider } from "./context/InboxContext";
import AppShell from "./components/AppShell";
import LoginHomeRedirect from "./components/LoginHomeRedirect";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventsPage from "./pages/EventsPage";
import OrganizerGate from "./pages/OrganizerGate";
import OrganizerMaterialsPage from "./pages/OrganizerMaterialsPage";
import AdminGate from "./pages/AdminGate";
import NotificationsPage from "./pages/NotificationsPage";
import OrganizerNotifyPage from "./pages/OrganizerNotifyPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import "./App.css";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <ProfileProvider>
      <InboxProvider>
        <BrowserRouter>
          <LoginHomeRedirect />
          <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/events" replace />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:eventId" element={<EventDetailPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="organize" element={<OrganizerGate />} />
            <Route
              path="organize/:eventId/materials"
              element={
                <OrganizerGate>
                  <OrganizerMaterialsPage />
                </OrganizerGate>
              }
            />
            <Route
              path="organize/:eventId/notify"
              element={
                <OrganizerGate>
                  <OrganizerNotifyPage />
                </OrganizerGate>
              }
            />
            <Route path="admin" element={<AdminGate />} />
            <Route
              path="admin/reports"
              element={
                <AdminGate>
                  <AdminReportsPage />
                </AdminGate>
              }
            />
          </Route>
          </Routes>
        </BrowserRouter>
      </InboxProvider>
    </ProfileProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
