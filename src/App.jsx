import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import MembersPage from './pages/MembersPage';
import OrdersPage from './pages/OrdersPage';
import BooksPage from './pages/BooksPage';
import NewsletterPage from './pages/NewsletterPage';
import AdminsPage from './pages/AdminsPage';
import EventRegistrationsPage from './pages/EventRegistrationsPage';

function AppRoutes() {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <LoginPage />;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/members" replace />} />
          <Route path="members"     element={<MembersPage />} />
          <Route path="orders"      element={<OrdersPage />} />
          <Route path="books"       element={<BooksPage />} />
          <Route path="newsletter"  element={<NewsletterPage />} />
          <Route path="admins"      element={<AdminsPage />} />
          <Route path="event-registrations" element={<EventRegistrationsPage />} />
          <Route path="*"           element={<Navigate to="/members" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
