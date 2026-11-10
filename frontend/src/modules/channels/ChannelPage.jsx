import { Link, useParams } from 'react-router-dom';
import { PlugZap } from 'lucide-react';
import { Card, PageTitle, ChannelMark, EmptyState } from '../../components/common/UI.jsx';
import { channels } from '../../mock/marketingData.js';
export default function ChannelPage() {
  const { channel: slug } = useParams(); const info = channels[slug];
  if (!info) return <div className="page"><PageTitle title="Canal no disponible" description="La plataforma solicitada no está configurada." /></div>;
  return <div className="page"><PageTitle eyebrow="Canal social" title={info.name} description={info.description} action={<Link className="button-secondary" to="/connections">Ver conexiones</Link>} />
    <Card className="chart-card"><ChannelMark channel={slug} size={48} /><EmptyState icon={PlugZap} title="Sin cuenta conectada" description={`Conecta una cuenta de ${info.name} para consultar sus métricas y publicaciones reales. No se muestran datos de demostración.`} /><div className="empty-state"><Link className="button-primary" to="/connections">Ir a Conexiones</Link></div></Card>
  </div>;
}
