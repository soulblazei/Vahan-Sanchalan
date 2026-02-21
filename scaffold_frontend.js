const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'frontend');

function mkdir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function write(filePath, content) {
    fs.writeFileSync(path.join(FRONTEND_DIR, filePath), content.trim() + '\n');
}

mkdir(FRONTEND_DIR);

write('package.json', JSON.stringify({
    "name": "fleet-app-frontend",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        "preview": "vite preview"
    },
    "dependencies": {
        "axios": "^1.4.0",
        "lucide-react": "^0.263.1",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.14.2",
        "recharts": "^2.7.2"
    },
    "devDependencies": {
        "@types/react": "^18.2.15",
        "@types/react-dom": "^18.2.7",
        "@vitejs/plugin-react": "^4.0.3",
        "autoprefixer": "^10.4.14",
        "postcss": "^8.4.27",
        "tailwindcss": "^3.3.3",
        "typescript": "^5.0.2",
        "vite": "^4.4.5"
    }
}, null, 2));

write('tsconfig.json', JSON.stringify({
    "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
}, null, 2));

write('tsconfig.node.json', JSON.stringify({
    "compilerOptions": {
        "composite": true,
        "skipLibCheck": true,
        "module": "ESNext",
        "moduleResolution": "bundler",
        "allowSyntheticDefaultImports": true
    },
    "include": ["vite.config.ts"]
}, null, 2));

write('vite.config.ts', `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})
`);

write('postcss.config.js', `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

write('tailwind.config.js', `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`);

write('index.html', `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fleet Operations Hub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

mkdir(path.join(FRONTEND_DIR, 'src'));
mkdir(path.join(FRONTEND_DIR, 'src', 'components'));
mkdir(path.join(FRONTEND_DIR, 'src', 'pages'));
mkdir(path.join(FRONTEND_DIR, 'src', 'api'));
mkdir(path.join(FRONTEND_DIR, 'src', 'context'));

write('src/index.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;
`);

write('src/main.tsx', `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`);

write('src/api/axios.ts', `
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

export default api;
`);

write('src/context/AuthContext.tsx', `
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, login: () => {}, logout: () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (data) setUser(JSON.parse(data));
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
`);

write('src/components/Sidebar.tsx', `
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-8">Fleet Hub</h2>
      <nav className="flex-1 space-y-4">
        <Link to="/" className="block py-2 px-4 rounded hover:bg-slate-800">Dashboard</Link>
        <Link to="/vehicles" className="block py-2 px-4 rounded hover:bg-slate-800">Vehicles</Link>
        <Link to="/trips" className="block py-2 px-4 rounded hover:bg-slate-800">Dispatch</Link>
      </nav>
      <div className="mt-auto">
        <p className="text-sm text-slate-400 mb-2">{user?.email}</p>
        <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 py-2 rounded">
          Logout
        </button>
      </div>
    </div>
  );
}
`);

write('src/components/ProtectedRoute.tsx', `
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }: { children: JSX.Element, roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}
`);

write('src/pages/Login.tsx', `
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPwd] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={submit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Fleet Login</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <input className="w-full mb-4 p-2 border rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="w-full mb-6 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={e => setPwd(e.target.value)} required />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Login</button>
      </form>
    </div>
  );
}
`);

write('src/pages/Dashboard.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [kpis, setKpis] = useState({ activeFleet: 0, inShop: 0, utilizationRate: 0, pendingCargo: 0 });

  useEffect(() => {
    api.get('/analytics/kpis').then(res => setKpis(res.data));
  }, []);

  const data = [
    { name: 'Active Fleet', value: kpis.activeFleet },
    { name: 'In Shop', value: kpis.inShop },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Command Center</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 shadow rounded">
          <h3 className="text-gray-500 text-sm">Active Fleet</h3>
          <p className="text-3xl font-bold">{kpis.activeFleet}</p>
        </div>
        <div className="bg-white p-6 shadow rounded">
          <h3 className="text-gray-500 text-sm">In Shop</h3>
          <p className="text-3xl font-bold">{kpis.inShop}</p>
        </div>
        <div className="bg-white p-6 shadow rounded">
          <h3 className="text-gray-500 text-sm">Utilization Rate</h3>
          <p className="text-3xl font-bold">{kpis.utilizationRate.toFixed(2)}%</p>
        </div>
        <div className="bg-white p-6 shadow rounded">
          <h3 className="text-gray-500 text-sm">Pending Cargo</h3>
          <p className="text-3xl font-bold">{kpis.pendingCargo} kg</p>
        </div>
      </div>
      
      <div className="bg-white p-6 shadow rounded h-64">
        <h3 className="text-lg font-bold mb-4">Fleet Status</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
`);

write('src/pages/Vehicles.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    api.get('/vehicles').then(res => setVehicles(res.data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Vehicle Registry</h1>
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4">Plate</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Capacity</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id} className="border-t">
                <td className="px-6 py-4 font-mono">{v.licensePlate}</td>
                <td className="px-6 py-4">{v.name}</td>
                <td className="px-6 py-4">{v.maxLoadCapacity} kg</td>
                <td className="px-6 py-4">
                  <span className={\`px-3 py-1 rounded-full text-sm \${v.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}\`}>
                    {v.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`);

write('src/pages/Trips.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Trips() {
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    api.get('/trips').then(res => setTrips(res.data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dispatch & Trips</h1>
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Vehicle</th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">Cargo</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id} className="border-t">
                <td className="px-6 py-4 font-mono">#{t.id}</td>
                <td className="px-6 py-4">{t.vehicle?.licensePlate || 'N/A'}</td>
                <td className="px-6 py-4">{t.driver?.name || 'N/A'}</td>
                <td className="px-6 py-4">{t.cargoWeight} kg</td>
                <td className="px-6 py-4">
                  <span className={\`px-3 py-1 rounded-full text-sm \${t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}\`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`);

write('src/App.tsx', `
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Trips from './pages/Trips';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><Layout><Vehicles /></Layout></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute><Layout><Trips /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
`);

console.log('Frontend scaffolding script created.');
