import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export default function AppShell({ children, activeAccount, onAccountChange, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className={`app-frame ${collapsed ? 'is-collapsed' : ''}`}>
    <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} role={user?.role} />
    <div className="app-main"><Header onMenuClick={() => setMobileOpen(true)} activeAccount={activeAccount} onAccountChange={onAccountChange} user={user} onLogout={onLogout} /><main className="content-area">{children}<footer className="app-footer"><span>© 2026 AI Marketing Manager</span><span className="demo-label"><i /> Datos simulados para demostración</span></footer></main></div>
  </div>;
}
