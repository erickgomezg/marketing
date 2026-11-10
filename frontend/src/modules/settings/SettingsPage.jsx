import { Link } from 'react-router-dom';
import { Settings, ShieldCheck } from 'lucide-react';
import { Card, EmptyState, PageTitle } from '../../components/common/UI.jsx';
export default function SettingsPage() {
  return <div className="page settings-page"><PageTitle eyebrow="Preferencias" title="Configuración" description="Configuración general del espacio de trabajo y de sus integraciones." />
    <Card className="chart-card"><EmptyState icon={Settings} title="Configuración del espacio pendiente" description="No se precargan nombres de marcas, perfiles, teléfonos ni preferencias ficticias. La configuración se habilitará al contar con un espacio de trabajo real." /></Card>
    <Card className="settings-card"><span className="note-icon"><ShieldCheck size={17} /></span><strong>Seguridad de las integraciones</strong><p>Los tokens de Meta se almacenan cifrados en el backend. Nunca compartas secretos de aplicación ni tokens en el navegador.</p><Link className="subtle-link" to="/connections">Revisar conexiones</Link></Card>
  </div>;
}
