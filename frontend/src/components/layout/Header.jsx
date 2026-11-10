import { useMemo, useState } from 'react';
import { CalendarDays, Check, Menu, Search, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { pageNames, primaryNavigation } from '../../constants/navigation.js';
import { periods } from '../../mock/marketingData.js';
import { usePeriod } from '../../app/providers/PeriodProvider.jsx';
import { Avatar } from '../common/UI.jsx';

export default function Header({ onMenuClick, user, onLogout }) {
  const location = useLocation();
  const { period, setPeriod, customRange, draftCustomRange, setDraftCustomRange, customRangeValid, customRangeError, applyCustomRange } = usePeriod();
  const title = useMemo(() => pageNames[location.pathname] || pageNames[`/channels/${location.pathname.split('/').at(-1)}`] || 'Dashboard', [location.pathname]);
  const [openMenu, setOpenMenu] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const formatDate = (value) => new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
  const periodLabel = period === 'custom' ? `${formatDate(customRange.from)}${customRange.from === customRange.to ? '' : ` — ${formatDate(customRange.to)}`}` : periods.find((item) => item.id === period)?.label;
  const query = searchQuery.trim().toLocaleLowerCase('es');
  const searchResults = useMemo(() => !query ? [] : primaryNavigation.filter((item) => item.label.toLocaleLowerCase('es').includes(query)).map((item) => ({ ...item, id: item.to })), [query]);
  const closeMenus = () => setOpenMenu('');
  return <header className="topbar">
    <div className="topbar-left"><button className="mobile-menu-btn" aria-label="Abrir navegación" onClick={onMenuClick}><Menu size={21} /></button><div className="breadcrumb"><span>Workspace</span><i>/</i><strong>{title}</strong></div></div>
    <div className={`topbar-actions ${searchOpen ? 'search-open' : ''}`}>
      {searchOpen ? <div className="search-box-wrap"><div className="search-box"><Search size={16} /><input aria-label="Buscar módulos" autoFocus placeholder="Buscar módulos…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); if (event.key === 'Enter' && searchResults[0]) { window.location.assign(searchResults[0].to); setSearchOpen(false); } }} /><button type="button" aria-label="Cerrar búsqueda" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>Esc</button></div>{searchQuery && <div className="global-search-results" role="listbox">{searchResults.length ? searchResults.map((result) => <button type="button" className="global-search-result" role="option" key={result.id} onClick={() => { window.location.assign(result.to); setSearchOpen(false); }}><result.icon size={16} /><span><strong>{result.label}</strong><small>Módulo</small></span></button>) : <p className="global-search-empty">No encontramos módulos.</p>}</div>}</div> : <button className="icon-button search-trigger" aria-label="Buscar módulos" onClick={() => setSearchOpen(true)}><Search size={18} /></button>}
      <div className="dropdown-wrap period-wrap"><button className="period-select" onClick={() => setOpenMenu(openMenu === 'period' ? '' : 'period')}><CalendarDays size={16} /><span>{periodLabel}</span><ChevronDown size={14} /></button>{openMenu === 'period' && <div className="dropdown period-menu">{periods.map((item) => <button type="button" key={item.id} className={period === item.id ? 'selected' : ''} onClick={() => { if (item.id === 'custom') setDraftCustomRange(customRange); setPeriod(item.id); if (item.id !== 'custom') closeMenus(); }}><span>{item.label}</span>{period === item.id && <Check size={15} />}</button>)}{period === 'custom' && <div className="date-range"><label>Desde<input aria-label="Fecha inicial" aria-invalid={!customRangeValid} type="date" value={draftCustomRange.from} max={draftCustomRange.to || undefined} onChange={(event) => setDraftCustomRange({ ...draftCustomRange, from: event.target.value })} /></label><label>Hasta<input aria-label="Fecha final" aria-invalid={!customRangeValid} type="date" value={draftCustomRange.to} min={draftCustomRange.from || undefined} onChange={(event) => setDraftCustomRange({ ...draftCustomRange, to: event.target.value })} /></label>{customRangeError && <p className="date-range-error" role="alert">{customRangeError}</p>}<button type="button" className="button-primary button-small" disabled={!customRangeValid} onClick={() => { if (applyCustomRange()) closeMenus(); }}>Aplicar período</button></div>}</div>}</div>
      <div className="dropdown-wrap profile-wrap"><button className="profile-button" onClick={() => setOpenMenu(openMenu === 'profile' ? '' : 'profile')}><Avatar initials={(user?.displayName || 'U').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()} color="lavender" /><span className="profile-name">{user?.displayName}<small>{user?.role}</small></span><ChevronDown size={14} /></button>{openMenu === 'profile' && <div className="dropdown profile-menu"><div className="profile-menu-head"><Avatar initials={(user?.displayName || 'U').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()} color="lavender" /><span><strong>{user?.displayName}</strong><small>{user?.email}</small></span></div><button type="button" onClick={() => { closeMenus(); onLogout?.(); }}>Cerrar sesión</button></div>}</div>
    </div>
  </header>;
}
