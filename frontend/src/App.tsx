import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Home from './pages/Home';
import Status from './pages/Status';
import Users from './pages/Users';
import Login from './pages/Login';
import Register from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Button } from './components/ui/button';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';

import { mainUrl } from './lib/utils';
import { clearAccessToken } from './lib/auth';
import { useState } from 'react';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />*
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function AppLayout() {
  const [showAlert, setShowAlert] = useState(false);

  return (
    <>
      <nav className="p-4 bg-slate-800 text-white flex justify-center gap-6">
        <Link to="/" className="hover:underline">
          Accueil
        </Link>
        <Link to="/status" className="hover:underline">
          Statut API
        </Link>
        <Link to="/users" className="hover:underline">
          Utilisateurs
        </Link>
        <Button onClick={() => setShowAlert(true)} className="hover:underline">
          Disconnect
        </Button>
        {showAlert && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Déconnexion</AlertTitle>
              <AlertDescription>
                <p>Es-tu sûr de vouloir te déconnecter ?</p>
                <Button
                  onClick={async () => {
                    try {
                      await fetch(`${mainUrl}/api/auth/logout`, {
                        method: 'POST',
                        credentials: 'include',
                      });
                    } catch (err) {
                      console.error('Logout error:', err);
                    }
                    clearAccessToken();

                    window.location.href = '/login';
                  }}
                >
                  Oui
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </nav>

      <div className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/status" element={<Status />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
