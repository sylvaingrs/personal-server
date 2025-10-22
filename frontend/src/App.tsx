import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Home from './pages/Home';
import Status from './pages/Status';
import './App.css';
import Users from './pages/Users';

function App() {
  return (
    <Router>
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
      </nav>

      <div className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/status" element={<Status />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
