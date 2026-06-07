import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import LogoutPage from './pages/LogoutPage';
import MyCardsPage from './pages/MyCardsPage';
import CardDetailsPage from './pages/CardDetailsPage';
import ReplenishmentPage from './pages/ReplenishmentPage';
import MyAccountsPage from './pages/MyAccountsPage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import AccountRequisitesPage from './pages/AccountRequisitesPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                <Route path="/cards" element={<ProtectedRoute><MyCardsPage /></ProtectedRoute>} />
                <Route path="/cards/:id" element={<ProtectedRoute><CardDetailsPage /></ProtectedRoute>} />
                <Route path="/replenishment" element={<ProtectedRoute><ReplenishmentPage /></ProtectedRoute>} />
                <Route path="/accounts" element={<ProtectedRoute><MyAccountsPage /></ProtectedRoute>} />
                <Route path="/accounts/:id/requisites" element={<ProtectedRoute><AccountRequisitesPage /></ProtectedRoute>} />
                <Route path="/accounts/:id" element={<ProtectedRoute><AccountDetailsPage /></ProtectedRoute>} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
