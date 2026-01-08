import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/OwnerDashboard';
import WalkerDashboard from './pages/WalkerDashboard';
import Dogs from './pages/Dogs';
import CreateWalkRequest from './pages/CreateWalkRequest';
import EditWalkRequest from './pages/EditWalkRequest';
import WalkRequestDetail from './pages/WalkRequestDetail';
import Profile from './pages/Profile';
import MyWalks from './pages/MyWalks';
import WalkInProgress from './pages/WalkInProgress';
import TermsAndConditions from './pages/TermsAndConditions';
import TermsAcceptance from './pages/TermsAcceptance';
import WalkerVerification from './pages/WalkerVerification';
import Help from './pages/Help';
import Payments from './pages/Payments';
import ErrorBoundary from './components/ErrorBoundary';

const HomeRoute = () => {
    const { isAuthenticated, user } = useAuth();
    if (isAuthenticated && user) {
        if (!user.termsAccepted) return <Navigate to="/aceptar-terminos" replace />;
        return <Navigate to={user.role === 'OWNER' ? '/owner/dashboard' : '/walker/dashboard'} replace />;
    }
    return <Landing />;
};

const LegalRedirect = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    if (isAuthenticated && user && !user.termsAccepted) {
        return <Navigate to="/aceptar-terminos" replace />;
    }
    return children;
};

function App() {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <ErrorBoundary>
                <AuthProvider>
                    <BrowserRouter>
                        <div className="min-h-screen flex flex-col">
                            <Header />
                            <main className="flex-1">
                                <Routes>
                                    <Route path="/" element={<HomeRoute />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    {/* ... rest of routes ... */}
                                    <Route path="/terminos-y-condiciones" element={<TermsAndConditions />} />
                                    <Route
                                        path="/aceptar-terminos"
                                        element={
                                            <ProtectedRoute>
                                                <TermsAcceptance />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/owner/dashboard"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <OwnerDashboard />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/walker/dashboard"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <WalkerDashboard />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/dogs"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <Dogs />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/walk-requests/new"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <CreateWalkRequest />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/walk-requests/:id"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <WalkRequestDetail />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/walk-requests/:id/edit"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <EditWalkRequest />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/my-walks"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <MyWalks />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/walk-assignments/:id/in-progress"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <WalkInProgress />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/verificar-paseador"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <WalkerVerification />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/ayuda"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <Help />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/profile"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <Profile />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/payments"
                                        element={
                                            <ProtectedRoute>
                                                <LegalRedirect>
                                                    <Payments />
                                                </LegalRedirect>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </main>
                            <Footer />
                        </div>
                    </BrowserRouter>
                </AuthProvider>
            </ErrorBoundary>
        </GoogleOAuthProvider>
    );
}

export default App;
