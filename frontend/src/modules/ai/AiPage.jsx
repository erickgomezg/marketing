import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Card, EmptyState, PageTitle } from '../../components/common/UI.jsx';
export default function AiPage() {
  return <div className="page ai-page"><PageTitle eyebrow="Inteligencia aplicada" title="Inteligencia Artificial" description="Análisis y recomendaciones generados a partir del rendimiento real de tus canales." />
    <Card className="chart-card"><EmptyState icon={Sparkles} title="La IA todavía no tiene datos para analizar" description="Primero conecta tus cuentas y sincroniza métricas e información de contenido. No generaremos recomendaciones a partir de datos ficticios." /><div className="empty-state"><Link className="button-primary" to="/connections">Conectar cuentas</Link></div></Card>
  </div>;
}
