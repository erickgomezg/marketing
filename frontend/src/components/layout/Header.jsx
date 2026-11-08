import { useMemo, useState } from 'react';
import { Bell, CalendarDays, Check, ChevronDown, FileText, Menu, Search, UsersRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pageNames, primaryNavigation } from '../../constants/navigation.js';
import { initialUsers, periods, posts } from '../../mock/marketingData.js';
import { usePeriod } from '../../app/providers/PeriodProvider.jsx';
import { Avatar } from '../common/UI.jsx';

export default function Header({ onMenuClick, activeAccount, onAccountChange, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    period, setPeriod, customRange, draftCustomRange, setDraftCustomRange,
    customRangeValid, customRangeError, applyCustomRange,
  } = usePeriod();
  const title = useMemo(() => pageNames[location.pathname] || pageNames[`/channels/${location.pathname.split('/').at(-1)}`] || 'Dashboard', [location.pathname]);
  const [openMenu, setOpenMenu] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsUnread, setNotificationsUnread] = useState(true);
  const showAccount = location.pathname.startsWith('/channels/');
  const formatDate = (value) => new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
  const periodLabel = period === 'custom'
    ? `${formatDate(customRange.from)}${customRange.from === customRange.to ? '' : ` — ${formatDate(customRange.to)}`}`
    : periods.find((item) => item.id === period)?.label;
  const closeMenus = () => setOpenMenu('');
  const query = searchQuery.trim().toLocaleLowerCase('es');
  const searchResults = useMemo(() => {
    if (!query) return [];
    const modules = primaryNavigation
      .filter((item) => item.label.toLocaleLowerCase('es').includes(query))
      .map((item) => ({ id: `module-${item.to}`, label: item.label, detail: 'Módulo', icon: item.icon, to: item.to }));
    const users = initialUsers
      .filter((user) => `${user.name} ${user.email} ${user.role}`.toLocaleLowerCase('es').includes(query))
      .map((user) => ({ id: `user-${user.id}`, label: user.name, detail: `Usuario · ${user.email}`, icon: UsersRound, to: '/users', searchQuery: user.name }));
    const publicationResults = posts
      .filter((post) => `${post.caption} ${post.channel}`.toLocaleLowerCase('es').includes(query))
      .map((post) => ({ id: post.id, label: post.caption, detail: `Publicación · ${post.channel}`, icon: FileText, to: '/reports', searchQuery: post.caption }));
    return [...modules, ...users, ...publicationResults].slice(0, 8);
  }, [query]);
  const chooseSearchResult = (result) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(result.to, result.searchQuery ? { state: { searchQuery: result.searchQuery } } : undefined);
  };
  const changePeriod = (id) => {
    if (id === 'custom') {
      setDraftCustomRange(customRange);
      setPeriod('custom');
    } else {
      setPeriod(id);
      closeMenus();
    }
  };
  return <header className="topbar">
    <div className="topbar-left"><button className="mobile-menu-btn" aria-label="Abrir navegación" onClick={onMenuClick}><Menu size={21} /></button><div className="breadcrumb"><span>Workspace</span><i>/</i><strong>{title}</strong></div></div>
    <div className={`topbar-actions ${searchOpen ? 'search-open' : ''}`}>
      {searchOpen ? <div className="search-box-wrap"><div className="search-box"><Search size={16} /><input aria-label="Buscar módulos, usuarios y publicaciones" autoFocus placeholder="Buscar en la plataforma…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); if (event.key === 'Enter' && searchResults[0]) chooseSearchResult(searchResults[0]); }} /><button type="button" aria-label="Cerrar búsqueda" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>Esc</button></div>
        {searchQuery && <div className="global-search-results" role="listbox" aria-label="Resultados de búsqueda">{searchResults.length ? searchResults.map((result) => { const Icon = result.icon; return <button type="button" className="global-search-result" role="option" key={result.id} onClick={() => chooseSearchResult(result)}><Icon size={16} /><span><strong>{result.label}</strong><small>{result.detail}</small></span></button>; }) : <p className="global-search-empty">No encontramos módulos, usuarios ni publicaciones.</p>}</div>}
      </div> : <button className="icon-button search-trigger" aria-label="Buscar" onClick={() => setSearchOpen(true)}><Search size={18} /></button>}
      {showAccount && <div className="dropdown-wrap"><button className="account-select" onClick={() => setOpenMenu(openMenu === 'account' ? '' : 'account')}><Avatar initials="AS" color="lavender" size="small" /><span>{activeAccount}</span><ChevronDown size={14} /></button>{openMenu === 'account' && <div className="dropdown account-menu">{['Todas las cuentas', 'Amor Studio', '@amor.studio', '@amorstudio'].map((account) => <button key={account} onClick={() => { onAccountChange(account); closeMenus(); }}><span>{account}</span>{activeAccount === account && <Check size={15} />}</button>)}</div>}</div>}
      <div className="dropdown-wrap period-wrap"><button className="period-select" onClick={() => setOpenMenu(openMenu === 'period' ? '' : 'period')}><CalendarDays size={16} /><span>{periodLabel}</span><ChevronDown size={14} /></button>{openMenu === 'period' && <div className="dropdown period-menu">{periods.map((item) => <button type="button" key={item.id} className={period === item.id ? 'selected' : ''} onClick={() => changePeriod(item.id)}><span>{item.label}</span>{period === item.id && <Check size={15} />}</button>)}{period === 'custom' && <div className="date-range"><label>Desde<input aria-label="Fecha inicial" aria-invalid={!customRangeValid} type="date" value={draftCustomRange.from} max={draftCustomRange.to || undefined} onChange={(event) => setDraftCustomRange({ ...draftCustomRange, from: event.target.value })} /></label><label>Hasta<input aria-label="Fecha final" aria-invalid={!customRangeValid} type="date" value={draftCustomRange.to} min={draftCustomRange.from || undefined} onChange={(event) => setDraftCustomRange({ ...draftCustomRange, to: event.target.value })} /></label>{customRangeError && <p className="date-range-error" role="alert">{customRangeError}</p>}<button type="button" className="button-primary button-small" disabled={!customRangeValid} onClick={() => { if (applyCustomRange()) closeMenus(); }}>Aplicar período</button></div>}</div>}</div>
      <div className="dropdown-wrap notification-wrap"><button className="icon-button notification-button" aria-label="Notificaciones" onClick={() => setOpenMenu(openMenu === 'notifications' ? '' : 'notifications')}><Bell size={18} />{notificationsUnread && <i />}</button>{openMenu === 'notifications' && <div className="dropdown notification-panel"><div className="dropdown-heading"><strong>Notificaciones</strong><button type="button" onClick={() => setNotificationsUnread(false)}>{notificationsUnread ? 'Marcar leídas' : 'Todas leídas'}</button></div><div className="notification-item"><span className="notification-icon blue-notice"><CalendarDays size={16} /></span><div><strong>Reporte semanal listo</strong><small>Tu resumen de canales está disponible.</small><em>Hace 12 min</em></div></div><div className="notification-item"><span className="notification-icon purple-notice"><span>✦</span></span><div><strong>Nuevo insight de IA</strong><small>Hay una oportunidad en Instagram.</small><em>Hace 1 h</em></div></div></div>}</div>
      <div className="dropdown-wrap profile-wrap"><button className="profile-button" onClick={() => setOpenMenu(openMenu === 'profile' ? '' : 'profile')}><Avatar initials={(user?.displayName || 'U').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()} color="lavender" /><span className="profile-name">{user?.displayName}<small>{user?.role}</small></span><ChevronDown size={14} /></button>{openMenu === 'profile' && <div className="dropdown profile-menu"><div className="profile-menu-head"><Avatar initials={(user?.displayName || 'U').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()} color="lavender" /><span><strong>{user?.displayName}</strong><small>{user?.email}</small></span></div><button type="button" onClick={() => { closeMenus(); onLogout?.(); }}>Cerrar sesión</button></div>}</div>
    </div>
  </header>;
}
