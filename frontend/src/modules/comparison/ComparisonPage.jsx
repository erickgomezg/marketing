import { Link } from 'react-router-dom';
import { GitCompareArrows } from 'lucide-react';
import { Card, EmptyState, PageTitle } from '../../components/common/UI.jsx';
export default function ComparisonPage() {
  return <div className="page comparison-page"><PageTitle eyebrow="Vista multicanal" title="Comparación de canales" description="Compara el rendimiento de tus cuentas con métricas obtenidas directamente de las plataformas." />
    <Card className="chart-card"><EmptyState icon={GitCompareArrows} title="Aún no hay información para comparar" description="Cuando conectes tus cuentas y se sincronicen sus métricas, podrás comparar seguidores, alcance, visualizaciones e interacciones. No utilizamos cifras simuladas." /><div className="empty-state"><Link className="button-primary" to="/connections">Conectar cuentas</Link></div></Card>
  </div>;
}
