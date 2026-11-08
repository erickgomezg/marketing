import { useState } from 'react';
import { Check, Clock3, Link2, Plus, RefreshCw, Unplug } from 'lucide-react';
import { Card, ChannelMark, PageTitle } from '../../components/common/UI.jsx';
import { connections as initialConnections } from '../../mock/marketingData.js';

export default function ConnectionsPage() {
  const [items, setItems] = useState(initialConnections);
  const [notice, setNotice] = useState('');
  const toggle = (id) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, connected: !item.connected, lastSync: item.connected ? item.lastSync : 'Ahora mismo' } : item));
    const target = items.find((item) => item.id === id);
    setNotice(target?.connected ? `${target.name} se desconectó en esta demostración.` : `${target?.name} quedó conectado localmente.`);
    window.setTimeout(() => setNotice(''), 2800);
  };
  const refreshStatuses = () => {
    setItems((current) => current.map((item) => item.connected ? { ...item, lastSync: 'Ahora mismo' } : item));
    setNotice('Se actualizaron las fechas de sincronización simuladas.');
  };
  return <div className="page connections-page">
    <PageTitle eyebrow="Integraciones" title="Conexiones" description="Administra los canales de tu marca y revisa su estado de sincronización." action={<button className="button-primary" onClick={() => setNotice('El asistente de conexión estará disponible en una fase futura.')}><Plus size={17} />Agregar conexión</button>} />
    {notice && <div className="inline-notice" role="status"><Check size={16} />{notice}<button onClick={() => setNotice('')}>Entendido</button></div>}
    <div className="connections-summary"><div><strong>{items.filter((item) => item.connected).length}</strong><span>canales conectados</span></div><div><span className="connection-dot" />Sincronización simulada activa</div><button className="button-secondary button-small" onClick={refreshStatuses}><RefreshCw size={14} />Actualizar estados</button></div>
    <div className="connection-grid">{items.map((item) => <Card className="connection-card" key={item.id}><div className="connection-card-top"><ChannelMark channel={item.id} size={48} /><span className={`status-pill ${item.connected ? 'status-connected' : 'status-disconnected'}`}><i />{item.connected ? 'Conectado' : 'Desconectado'}</span></div><h2>{item.name}</h2><p>{item.description}</p><div className="connection-sync"><Clock3 size={14} /><span>Última sincronización: {item.connected ? item.lastSync : '—'}</span></div><div className="connection-card-footer"><span className="mock-tag">Estado de demostración</span><button className={item.connected ? 'button-secondary button-small' : 'button-primary button-small'} onClick={() => toggle(item.id)}>{item.connected ? <><Unplug size={14} />Desconectar</> : <><Link2 size={14} />Conectar</>}</button></div></Card>)}</div>
    <Card className="connection-security-note"><span className="note-icon"><Check size={16} /></span><div><strong>Conexiones protegidas</strong><p>Las conexiones futuras usarán autorización segura. Los botones de esta vista solo modifican datos locales.</p></div><span className="security-label">Configuración simulada</span></Card>
  </div>;
}
