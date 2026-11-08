import { useMemo, useState } from 'react';
import { CheckCheck, Clock3, MoreHorizontal, Paperclip, Phone, Search, Send, Settings2, ShieldCheck, Smile, Wifi } from 'lucide-react';
import { Avatar, Card, PageTitle, Toggle } from '../../components/common/UI.jsx';
import { chatMessages as initialMessages, conversations } from '../../mock/marketingData.js';

export default function WhatsAppPage() {
  const [active, setActive] = useState(1);
  const [messagesByConversation, setMessagesByConversation] = useState(() => Object.fromEntries(conversations.map((conversation) => [
    conversation.id,
    conversation.id === 1 ? initialMessages : [
      { id: conversation.id * 10, side: 'them', text: conversation.preview, time: conversation.time },
      { id: conversation.id * 10 + 1, side: 'me', text: '¡Gracias por escribirnos! Estamos aquí para ayudarte 😊', time: '10:45' },
    ],
  ])));
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [autoReply, setAutoReply] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [notice, setNotice] = useState('');
  const selected = conversations.find((conversation) => conversation.id === active) || conversations[0];
  const threadMessages = messagesByConversation[active] || [];
  const filtered = useMemo(() => conversations.filter((conversation) => conversation.name.toLowerCase().includes(search.toLowerCase())), [search]);
  const sendMessage = (event) => {
    event.preventDefault(); if (!draft.trim()) return;
    setMessagesByConversation((current) => ({ ...current, [active]: [...(current[active] || []), { id: Date.now(), side: 'me', text: draft.trim(), time: 'Ahora' }] })); setDraft('');
  };
  return <div className="page whatsapp-page">
    <PageTitle eyebrow="Mensajería" title="WhatsApp" description="Una vista de demostración para tus conversaciones y aprobaciones." action={<span className="status-pill status-connected"><i />Servicio activo</span>} />
    <div className="whatsapp-status-strip"><span className="whatsapp-status-icon"><Wifi size={17} /></span><div><strong>Conexión simulada</strong><span>+502 5555 0198 · Amor Studio</span></div><span className="whatsapp-connection-state"><i />Conectado</span><button className="button-secondary button-small" onClick={() => { document.getElementById('whatsapp-settings')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setNotice('Configuración local de WhatsApp.'); }}><Settings2 size={14} />Configurar</button></div>
    {notice && <div className="inline-notice" role="status"><span>i</span>{notice}<button onClick={() => setNotice('')}>Cerrar</button></div>}
    <div className="whatsapp-overview"><Card><span className="wa-stat-icon green-soft"><span>◌</span></span><div><small>CONVERSACIONES</small><strong>24</strong><span>En el período seleccionado</span></div></Card><Card><span className="wa-stat-icon blue-soft"><CheckCheck size={17} /></span><div><small>MENSAJES RESPONDIDOS</small><strong>96%</strong><span>Tiempo promedio: 8 min</span></div></Card><Card><span className="wa-stat-icon purple-soft"><ShieldCheck size={17} /></span><div><small>APROBACIONES PENDIENTES</small><strong>2</strong><span>Acciones de demostración</span></div></Card></div>
    <div className="whatsapp-workspace"><Card className="conversation-list-card"><div className="conversation-list-heading"><div><h2>Conversaciones</h2><span>24 en total</span></div><button className="icon-button" aria-label="Opciones de conversaciones" onClick={() => setNotice('Las opciones adicionales de conversaciones no están habilitadas en esta demostración.')}><MoreHorizontal size={18} /></button></div><label className="conversation-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar conversación" /></label><div className="conversation-list">{filtered.map((conversation) => <button className={`conversation-row ${active === conversation.id ? 'active' : ''}`} key={conversation.id} onClick={() => setActive(conversation.id)}><Avatar initials={conversation.initials} color={conversation.color} /><span className="conversation-copy"><strong>{conversation.name}</strong><small>{conversation.preview}</small></span><span className="conversation-time">{conversation.time}{conversation.unread > 0 && <i>{conversation.unread}</i>}</span></button>)}</div>{filtered.length === 0 && <p className="empty-copy">No hay conversaciones con ese nombre.</p>}<div className="conversation-list-foot"><span className="online-dot" />Vista local · sin conexión real</div></Card>
      <Card className="conversation-thread"><div className="thread-heading"><Avatar initials={selected.initials} color={selected.color} /><div><strong>{selected.name}</strong><span><i />En línea · datos de ejemplo</span></div><div className="thread-actions"><button className="icon-button" aria-label="Llamar" onClick={() => setNotice('Las llamadas no se realizan desde esta demostración.')}><Phone size={17} /></button><button className="icon-button" aria-label="Más opciones del chat" onClick={() => setNotice('Las opciones del chat son solo una vista de demostración.')}><MoreHorizontal size={19} /></button></div></div><div className="thread-date"><span>HOY · 31 DE OCTUBRE</span></div><div className="message-list">{threadMessages.map((message) => <div className={`message-row ${message.side === 'me' ? 'message-mine' : ''}`} key={message.id}><div className="message-bubble">{message.text}<span>{message.time}{message.side === 'me' && <CheckCheck size={13} />}</span></div></div>)}</div><form className="message-composer" onSubmit={sendMessage}><button type="button" className="icon-button" aria-label="Insertar emoji" onClick={() => setDraft((value) => `${value}${value ? ' ' : ''}😊`)}><Smile size={19} /></button><button type="button" className="icon-button" aria-label="Adjuntar archivo" onClick={() => setNotice('Los archivos adjuntos no se cargan en esta demostración; puedes enviar texto simulado.')}><Paperclip size={18} /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribe un mensaje de demostración…" /><button type="submit" className="send-message" disabled={!draft.trim()} aria-label="Enviar mensaje"><Send size={16} /></button></form></Card>
      <Card className="whatsapp-settings-card" id="whatsapp-settings"><div className="wa-settings-heading"><span><Settings2 size={17} /></span><strong>Configuración</strong></div><div className="wa-setting-row"><div><strong>Respuestas rápidas</strong><p>Activar sugerencias simuladas.</p></div><Toggle checked={autoReply} onChange={setAutoReply} label="Respuestas rápidas" /></div><div className="wa-setting-row"><div><strong>Notificaciones</strong><p>Avisos para nuevos mensajes.</p></div><Toggle checked={notifications} onChange={setNotifications} label="Notificaciones" /></div><div className="wa-number-card"><span><Phone size={15} /></span><div><small>NÚMERO ASOCIADO</small><strong>+502 5555 0198</strong></div></div><div className="wa-safe-note"><Clock3 size={14} /> Última actividad simulada hace 4 min</div></Card></div>
  </div>;
}
