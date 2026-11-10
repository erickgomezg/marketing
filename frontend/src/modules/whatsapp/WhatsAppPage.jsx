import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Card, EmptyState, PageTitle } from '../../components/common/UI.jsx';
export default function WhatsAppPage() {
  return <div className="page whatsapp-page"><PageTitle eyebrow="Mensajería empresarial" title="WhatsApp" description="Las conversaciones reales aparecerán cuando se configure la integración oficial de WhatsApp Business." />
    <Card className="chart-card"><EmptyState icon={MessageCircle} title="WhatsApp no está conectado" description="No hay conversaciones ni números asociados. Esta sección permanecerá vacía hasta configurar y autorizar la integración de WhatsApp Business." /><div className="empty-state"><Link className="button-secondary" to="/connections">Ver conexiones</Link></div></Card>
  </div>;
}
