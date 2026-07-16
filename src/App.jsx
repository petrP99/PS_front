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
import TransferPage from './pages/TransferPage';
import TransferMethodPage from './pages/TransferMethodPage';
import TransferStatusPage from './pages/TransferStatusPage';
import TransferHistoryPage from './pages/TransferHistoryPage';
import TransferHistoryDetailsPage from './pages/TransferHistoryDetailsPage';
import AccountTransferPage from './pages/AccountTransferPage';
import ProfilePage from './pages/ProfilePage';
import PaymentMethodPage from './pages/PaymentMethodPage';
import PaymentPage from './pages/PaymentPage';
import PaymentHistoryDetailsPage from './pages/PaymentHistoryDetailsPage';
import CashbackPage from './pages/CashbackPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                  <Route path="/cards" element={<ProtectedRoute><MyCardsPage /></ProtectedRoute>} />
                  <Route path="/cards/:id" element={<ProtectedRoute><CardDetailsPage /></ProtectedRoute>} />
                  <Route path="/replenishment" element={<ProtectedRoute><ReplenishmentPage /></ProtectedRoute>} />
                  <Route path="/payments" element={<ProtectedRoute><PaymentMethodPage /></ProtectedRoute>} />
                  <Route path="/payments/:type" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                  <Route path="/cashback" element={<ProtectedRoute><CashbackPage /></ProtectedRoute>} />
                  <Route path="/accounts" element={<ProtectedRoute><MyAccountsPage /></ProtectedRoute>} />
                  <Route path="/accounts/:id/requisites" element={<ProtectedRoute><AccountRequisitesPage /></ProtectedRoute>} />
                  <Route path="/accounts/:id" element={<ProtectedRoute><AccountDetailsPage /></ProtectedRoute>} />
                  <Route path="/transfers" element={<ProtectedRoute><TransferMethodPage /></ProtectedRoute>} />
                  <Route path="/transfers/card" element={<ProtectedRoute><TransferPage mode="card" /></ProtectedRoute>} />
                  <Route path="/transfers/phone" element={<ProtectedRoute><TransferPage mode="phone" /></ProtectedRoute>} />
                  <Route path="/transfers/accounts" element={<ProtectedRoute><AccountTransferPage /></ProtectedRoute>} />
                  <Route path="/transfers/:id" element={<ProtectedRoute><TransferStatusPage /></ProtectedRoute>} />
                  <Route path="/history" element={<ProtectedRoute><TransferHistoryPage /></ProtectedRoute>} />
                  <Route path="/history/payments/:id" element={<ProtectedRoute><PaymentHistoryDetailsPage /></ProtectedRoute>} />
                  <Route path="/history/transfers/:id" element={<ProtectedRoute><TransferHistoryDetailsPage /></ProtectedRoute>} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
