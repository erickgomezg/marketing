import { Link } from 'react-router-dom';
import { FileBarChart2 } from 'lucide-react';
import { Card, EmptyState, PageTitle } from '../../components/common/UI.jsx';
export default function ReportsPage() {
  return <div className="page reports-page"><PageTitle eyebrow="Visión en contexto" title="Reportes" description="Consulta y exporta reportes basados en información real de tus cuentas." />
    <Card className="chart-card"><EmptyState icon={FileBarChart2} title="No hay reportes disponibles" description="Los reportes se habilitarán cuando existan métricas y publicaciones sincronizadas desde tus cuentas conectadas." /><div className="empty-state"><Link className="button-primary" to="/connections">Conectar cuentas</Link></div></Card>
  </div>;
}
