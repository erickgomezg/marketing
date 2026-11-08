import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, PanelLeftClose, X } from 'lucide-react';
import { primaryNavigation } from '../../constants/navigation.js';

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, role }) {
  const [logoMark] = useState('am');
  return <>
    {mobileOpen && <button className="mobile-scrim" aria-label="Cerrar menú" onClick={onMobileClose} />}
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="brand-mark">{logoMark}</span>
        {!collapsed && <div className="brand-name">AI Marketing<span>MANAGER</span></div>}
        <button className="sidebar-close mobile-only" aria-label="Cerrar navegación" onClick={onMobileClose}><X size={18} /></button>
        {!collapsed && <button className="collapse-btn desktop-only" aria-label="Colapsar navegación" onClick={onToggle}><PanelLeftClose size={17} /></button>}
      </div>
      {collapsed && <button className="expand-btn desktop-only" aria-label="Expandir navegación" onClick={onToggle}><ChevronLeft size={16} /></button>}
      <div className="nav-group-label">{!collapsed && 'ESPACIO DE TRABAJO'}</div>
      <nav className="side-nav" aria-label="Navegación principal">
        {primaryNavigation.filter(({ to }) => role === 'Administrador' || to === '/').map(({ label, to, icon: Icon, exact, channel }) => (
          <NavLink key={to} to={to} end={exact} onClick={onMobileClose} title={collapsed ? label : undefined} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''} ${channel ? `nav-${channel}` : ''}`}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{channel && <i className="nav-channel-dot" />}
          </NavLink>
        ))}
      </nav>
      {!collapsed && <div className="sidebar-bottom">
        <div className="plan-card"><div className="plan-icon">✦</div><strong>Todo en un solo lugar</strong><p>Tus canales conectados están creciendo.</p><div className="plan-progress"><span /></div><small>3 de 4 canales activos</small></div>
        <div className="sidebar-footnote"><span className="online-dot" /> Espacio de trabajo activo</div>
      </div>}
    </aside>
  </>;
}
