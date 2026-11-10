import { Facebook, Instagram, Music2, MessageCircle, ShieldCheck } from 'lucide-react';
import { Card, PageTitle } from '../../components/common/UI.jsx';
const providers = [
  { id: 'facebook', name: 'Facebook', detail: 'Páginas, publicaciones e insights', Icon: Facebook },
  { id: 'instagram', name: 'Instagram', detail: 'Cuenta profesional, contenido e insights', Icon: Instagram },
  { id: 'tiktok', name: 'TikTok', detail: 'La integración estará disponible en una fase posterior', Icon: Music2 },
  { id: 'whatsapp', name: 'WhatsApp Business', detail: 'Mensajería empresarial; requiere configuración independiente', Icon: MessageCircle },
];
export default function ConnectionsPage() {
  return <div className="page connections-page"><PageTitle eyebrow="Integraciones" title="Conexiones" description="Aquí se mostrarán únicamente las cuentas cuya autorización y conexión hayan sido confirmadas por el servidor." />
    <div className="connection-grid">{providers.map(({ id, name, detail, Icon }) => <Card className="connection-card" key={id}>
      <div className="connection-card-top"><span className="channel-mark"><Icon size={24} /></span><span className="status-pill status-disconnected"><i />Sin conectar</span></div><h2>{name}</h2><p>{detail}</p>
      {id === 'facebook' || id === 'instagram' ? <p className="empty-copy">La autorización Meta está preparada en el backend. Para iniciar OAuth se requiere seleccionar un comercio autorizado; el estado se actualizará cuando el servidor confirme la conexión.</p> : <p className="empty-copy">Integración pendiente. No se presenta como conectada.</p>}
    </Card>)}</div>
    <Card className="connection-security-note"><span className="note-icon"><ShieldCheck size={16} /></span><div><strong>Estado verificado</strong><p>Una cuenta solo aparecerá conectada después de completar su autorización y guardar la conexión en el servidor. No se utilizan estados locales simulados.</p></div></Card>
  </div>;
}
