import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import AuthFlowPage from '../modules/auth/AuthFlowPage.jsx';

const DashboardPage = lazy(() => import('../modules/dashboard/DashboardPage.jsx'));
const ChannelPage = lazy(() => import('../modules/channels/ChannelPage.jsx'));
const ComparisonPage = lazy(() => import('../modules/comparison/ComparisonPage.jsx'));
const ReportsPage = lazy(() => import('../modules/reports/ReportsPage.jsx'));
const AiPage = lazy(() => import('../modules/ai/AiPage.jsx'));
const WhatsAppPage = lazy(() => import('../modules/whatsapp/WhatsAppPage.jsx'));
const ConnectionsPage = lazy(() => import('../modules/connections/ConnectionsPage.jsx'));
const UsersPage = lazy(() => import('../modules/users/UsersPage.jsx'));
const SettingsPage = lazy(() => import('../modules/settings/SettingsPage.jsx'));

function Login({ onLogin, notice = '' }) {
  const [error, setError] = useState(() => notice || (new URLSearchParams(window.location.search).has('auth_error') ? 'No se pudo iniciar sesión. Verifica tus credenciales o la cuenta vinculada.' : ''));
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo iniciar sesión.');
      onLogin(result.user);
    } catch (cause) { setError(cause.message || 'No se pudo iniciar sesión.'); }
    finally { setBusy(false); }
  };
  return <main className="auth-screen"><section className="auth-card"><span className="brand-mark">am</span><h1>Inicia sesión</h1><p>Ingresa a AI Marketing Manager con tu cuenta.</p>{error && <div className="inline-notice" role="alert">{error}</div>}<form className="user-form" onSubmit={submit}><label>Correo electrónico<input type="email" name="email" autoComplete="username" required /></label><label>Contraseña<input type="password" name="password" autoComplete="current-password" required /></label><button className="button-primary" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button></form><a className="auth-google-link" href="/api/auth/google">Continuar con Google</a><Link className="auth-google-link" to="/forgot-password">¿Olvidaste tu contraseña?</Link></section></main>;
}

export default function App() {
  const [activeAccount, setActiveAccount] = useState('Todas las cuentas');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [authNotice, setAuthNotice] = useState('');
  const logout = useCallback(async () => {
    setAuthNotice('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      if (response.status === 503) {
        const result = await response.json().catch(() => ({}));
        setAuthNotice(result.error || 'La sesión se cerró en este navegador, pero no se confirmó la revocación en el servidor.');
        setUser(null); setStatus('anonymous');
        return;
      }
      if (!response.ok) throw new Error('No se pudo cerrar la sesión. Verifica la conexión e inténtalo nuevamente.');
      setUser(null); setStatus('anonymous');
    } catch (error) {
      setAuthNotice(error.message || 'No se pudo cerrar la sesión.');
    }
  }, []);
  useEffect(() => {
    fetch('/api/access/me').then((response) => response.ok ? response.json() : Promise.reject())
      .then((profile) => { setUser(profile); setStatus('authenticated'); })
      .catch(() => setStatus('anonymous'));
  }, []);
  if (status === 'loading') return <div className="page-loading"><span className="loading-spinner" /><span>Validando sesión…</span></div>;
  if (status === 'anonymous') return <Routes><Route path="/accept-invitation" element={<AuthFlowPage />} /><Route path="/forgot-password" element={<AuthFlowPage />} /><Route path="/reset-password" element={<AuthFlowPage />} /><Route path="*" element={<Login notice={authNotice} onLogin={(profile) => { setAuthNotice(''); setUser(profile); setStatus('authenticated'); }} />} /></Routes>;
  return <AppShell activeAccount={activeAccount} onAccountChange={setActiveAccount} user={user} onLogout={logout}>
    {user.role === 'Viewer'
      ? <div className="page"><h1>Dashboard disponible próximamente</h1><p>Tu sesión Viewer está activa. Las vistas comerciales se habilitarán cuando se conecten a datos autorizados.</p></div>
      : <Suspense fallback={<div className="page-loading"><span className="loading-spinner" /><span>Cargando vista…</span></div>}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/channels/:channel" element={<ChannelPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/ai" element={<AiPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>}
  </AppShell>;
}
