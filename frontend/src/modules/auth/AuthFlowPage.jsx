import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function AuthFlowPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get('token') || '';
  const isInvite = location.pathname === '/accept-invitation';
  const isReset = location.pathname === '/reset-password';
  const [email, setEmail] = useState('');
  const [identity, setIdentity] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isInvite) return undefined;
    let cancelled = false;
    fetch('/api/auth/invitation/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.valid) throw new Error('La invitación no es válida o expiró.');
        if (!cancelled) setIdentity(result);
      }).catch((cause) => { if (!cancelled) setError(cause.message); });
    return () => { cancelled = true; };
  }, [isInvite, token]);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (location.pathname === '/forgot-password') {
        const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        if (!response.ok) throw new Error('No se pudo procesar la solicitud.');
        setMessage('Si la cuenta puede recuperar el acceso, recibirá instrucciones por correo.');
      } else {
        const password = form.get('password');
        if (password !== form.get('confirmPassword')) throw new Error('Las contraseñas no coinciden.');
        const endpoint = isInvite ? '/api/auth/invitation/accept' : '/api/auth/reset-password';
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'No se pudo actualizar la contraseña.');
        setMessage(isInvite ? 'Cuenta activada. Ya puedes iniciar sesión.' : 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
        window.history.replaceState({}, '', location.pathname);
      }
    } catch (cause) { setError(cause.message || 'No se pudo completar la solicitud.'); }
    finally { setBusy(false); }
  };

  const formTitle = isInvite ? 'Activa tu cuenta' : isReset ? 'Restablece tu contraseña' : 'Recupera tu acceso';
  const validInvite = !isInvite || Boolean(identity);
  return <main className="auth-screen"><section className="auth-card"><span className="brand-mark">am</span><h1>{formTitle}</h1>
    {isInvite && identity && <p>Invitación para {identity.displayName} ({identity.email}).</p>}
    {error && <div className="inline-notice" role="alert">{error}</div>}{message && <div className="inline-notice" role="status">{message}</div>}
    {location.pathname === '/forgot-password' ? <form className="user-form" onSubmit={submit}><label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><button className="button-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar instrucciones'}</button></form>
      : validInvite && token && <form className="user-form" onSubmit={submit}><label>Nueva contraseña<input type="password" name="password" minLength={12} maxLength={256} required autoComplete="new-password" /></label><label>Confirmar contraseña<input type="password" name="confirmPassword" minLength={12} maxLength={256} required autoComplete="new-password" /></label><small>Usa al menos 12 caracteres.</small><button className="button-primary" disabled={busy}>{busy ? 'Guardando…' : isInvite ? 'Activar cuenta' : 'Actualizar contraseña'}</button></form>}
    {!token && (isInvite || isReset) && <div className="inline-notice" role="alert">El enlace no incluye un token válido.</div>}
    {message && <button className="button-primary" onClick={() => navigate('/')}>Ir a iniciar sesión</button>}
    <Link className="auth-google-link" to="/">Volver al inicio de sesión</Link>
  </section></main>;
}
