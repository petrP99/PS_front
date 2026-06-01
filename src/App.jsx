import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {useEffect, useState} from 'react';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import CardsPage from './pages/CardsPage';
import TransfersPage from './pages/TransfersPage';
import PaymentsPage from './pages/PaymentsPage';
import ReplenishmentsPage from './pages/ReplenishmentsPage';
import {getProfile} from './api';

function ProtectedRoute({children}) {
    const [auth, setAuth] = useState(null); // null = проверка, true = авторизован, false = нет
    const [error, setError] = useState(null);

    useEffect(() => {
        getProfile()
            .then(() => {
                setAuth(true);
            })
            .catch((err) => {
                console.warn("Ошибка при проверке профиля:", err.message);
                if (err.status === 401) {
                    setAuth(false);
                } else {
                    setError(`Ошибка сервера (${err.status || err.message}). Проверьте работу BFF и бэкенда.`);
                }
            });
    }, []);

    if (error) {
        return (
            <div style={{padding: 24, textAlign: 'center', color: '#721c24'}}>
                <h3>Произошла непредвиденная ошибка</h3>
                <p>{error}</p>
                <button className="btn" onClick={() => window.location.reload()}>Повторить попытку</button>
            </div>
        );
    }

    if (auth === null) {
        return <div className="loading">Проверка авторизации...</div>;
    }

    if (!auth) {
        // Безопасно перенаправляем на внутренний роут /signin (он не проксируется в BFF)
        return <Navigate to="/signin" replace/>;
    }

    return <Layout>{children}</Layout>;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/" element={<ProtectedRoute><HomePage/></ProtectedRoute>}/>
                <Route path="/home" element={<ProtectedRoute><HomePage/></ProtectedRoute>}/>
                <Route path="/profile" element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
                <Route path="/cards" element={<ProtectedRoute><CardsPage/></ProtectedRoute>}/>
                <Route path="/transfers" element={<ProtectedRoute><TransfersPage/></ProtectedRoute>}/>
                <Route path="/payments" element={<ProtectedRoute><PaymentsPage/></ProtectedRoute>}/>
                <Route path="/replenishments" element={<ProtectedRoute><ReplenishmentsPage/></ProtectedRoute>}/>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}