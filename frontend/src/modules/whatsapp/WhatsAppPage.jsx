import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, RefreshCw, Send, Smartphone, Wifi, WifiOff, Users } from 'lucide-react';
import { Card, PageTitle } from '../../components/common/UI.jsx';

const API = '/api/integrations/whatsapp';
const labels = {
  disconnected: 'Desconectado', connecting: 'Conectando', qr_required: 'Esperando escaneo',
  connected: 'Conectado', reconnecting: 'Reconectando', logged_out: 'Sesión cerrada',
  error: 'Error de conexión',
};

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include', ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'No fue posible completar la operación.');
  return data;
}

export default function WhatsAppPage() {
  const [connection, setConnection] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    try {
      const data = await request('/status');
      setConnection(data);
      setSelectedGroup(data.selectedGroup || null);
      if (data.selectedGroup?.id) setGroupId(current => current || data.selectedGroup.id);
      setError('');
    } catch (err) { setError(err.message); }
  }, []);

  useEffect(() => {
    loadStatus();
    const timer = window.setInterval(loadStatus, 3000);
    return () => window.clearInterval(timer);
  }, [loadStatus]);

  async function run(action, successMessage) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); if (successMessage) setMessage(successMessage); await loadStatus(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function loadGroups() {
    await run(async () => {
      const data = await request('/groups');
      setGroups(data.groups || []);
      if (!data.groups?.length) setMessage('No se encontraron grupos en esta cuenta.');
    });
  }

  async function saveGroup() {
    const group = groups.find(item => item.id === groupId);
    if (!group) return;
    await run(async () => {
      const data = await request('/group', { method: 'PUT', body: JSON.stringify({ groupId: group.id, groupName: group.subject }) });
      setSelectedGroup(data.selectedGroup);
    }, 'Grupo global guardado correctamente.');
  }

  const connected = connection?.status === 'connected';
  const statusColor = connected ? 'success' : connection?.status === 'error' || connection?.status === 'logged_out' ? 'danger' : 'warning';

  return <div className="page whatsapp-page">
    <PageTitle eyebrow="Notificaciones del sistema" title="WhatsApp" description="Conecta el número exclusivo de AI Marketing Manager y selecciona el grupo global que recibirá las notificaciones." />
    <div className="dashboard-grid">
      <Card className="chart-card">
        <div className="card-heading"><div><h2>Conexión de WhatsApp</h2><p>Vincula el dispositivo mediante un código QR.</p></div><span className={`status-pill status-${statusColor}`}>{labels[connection?.status] || 'Consultando'}</span></div>
        <div className="whatsapp-connection">
          {connection?.qr && !connected ? <div className="whatsapp-qr"><img src={connection.qr} alt="Código QR para vincular WhatsApp" /><p>Abre WhatsApp en tu teléfono y escanea este código desde Dispositivos vinculados.</p></div> :
            <div className="whatsapp-placeholder"><Smartphone size={36} /><strong>{connected ? 'Número vinculado' : 'Esperando conexión'}</strong><span>{connected ? connection.phoneNumber || 'Dispositivo conectado' : 'Genera un QR para vincular el número dedicado.'}</span></div>}
        </div>
        <div className="button-row">
          {!connected ? <button className="button-primary" disabled={busy || ['connecting', 'qr_required', 'reconnecting'].includes(connection?.status)} onClick={() => run(() => request('/connect', { method: 'POST' }), 'Solicitud de conexión iniciada.')}> <Wifi size={16}/> Conectar WhatsApp</button> :
            <button className="button-secondary" disabled={busy} onClick={() => run(() => request('/disconnect', { method: 'POST' }), 'WhatsApp desconectado.')}><WifiOff size={16}/> Desconectar</button>}
          <button className="button-secondary" disabled={busy} onClick={loadStatus}><RefreshCw size={16}/> Actualizar estado</button>
        </div>
      </Card>
      <Card className="chart-card">
        <div className="card-heading"><div><h2>Grupo global</h2><p>Todos los avisos del sistema se enviarán únicamente a este grupo.</p></div><Users size={20}/></div>
        {selectedGroup && <div className="selected-whatsapp-group"><strong>Grupo configurado</strong><span>{selectedGroup.name}</span></div>}
        <div className="button-row">
          <button className="button-secondary" disabled={!connected || busy} onClick={loadGroups}>Consultar mis grupos</button>
        </div>
        {groups.length > 0 && <div className="form-field"><label htmlFor="whatsapp-group">Selecciona el grupo destinatario</label><select id="whatsapp-group" value={groupId} onChange={event => setGroupId(event.target.value)}><option value="">Seleccionar grupo...</option>{groups.map(group => <option key={group.id} value={group.id}>{group.subject} ({group.size} participantes)</option>)}</select><button className="button-primary" disabled={!groupId || busy} onClick={saveGroup}>Guardar grupo</button></div>}
        <div className="whatsapp-test"><button className="button-secondary" disabled={!connected || !selectedGroup || busy} onClick={() => run(() => request('/test', { method: 'POST' }), 'Mensaje de prueba enviado al grupo.') }><Send size={16}/> Enviar mensaje de prueba</button></div>
      </Card>
    </div>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    {message && <div className="alert alert-success" role="status">{message}</div>}
    <Card className="chart-card whatsapp-notice"><MessageCircle size={20}/><div><strong>Integración de solo envío</strong><p>AI Marketing Manager no leerá mensajes, participantes ni conversaciones. Baileys es una integración comunitaria no oficial y su uso puede implicar restricciones de WhatsApp.</p></div></Card>
  </div>;
}
