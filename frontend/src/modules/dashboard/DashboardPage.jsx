import { Link } from 'react-router-dom';
import { ArrowRight, PlugZap } from 'lucide-react';
import { Card, CardHeading, PageTitle, EmptyState } from '../../components/common/UI.jsx';
export default function DashboardPage() {
  return <div className="page page-dashboard">
    <PageTitle eyebrow="Resumen general" title="Dashboard" description="Tus indicadores aparecerán aquí cuando conectes tus cuentas y se complete la primera sincronización." action={<Link className="button-primary" to="/connections"><PlugZap size={16} />Conectar cuentas</Link>} />
    <Card className="chart-card"><EmptyState icon={PlugZap} title="Todavía no hay datos reales" description="No mostramos cifras de ejemplo. Conecta una cuenta de Meta y sincroniza sus datos para comenzar a visualizar tus resultados." /><div className="empty-state"><Link className="subtle-link" to="/connections">Ir a Conexiones <ArrowRight size={14} /></Link></div></Card>
    <Card><CardHeading title="¿Qué aparecerá aquí?" subtitle="La información se cargará desde las cuentas autorizadas." /><div className="empty-state"><p>Seguidores, alcance, visualizaciones, interacciones, evolución por período, publicaciones y actividad reciente estarán disponibles cuando existan datos sincronizados.</p></div></Card>
  </div>;
}
