import { ArrowRight, ArrowUpRight, Eye, Lightbulb, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FollowersChart, InteractionsChart, ViewsChart, ChannelBarsChart } from '../../components/charts/AnalyticsCharts.jsx';
import { ActivityFeed, ChannelLegend, InsightCards, PostGrid, TopPostList } from '../../components/cards/ContentCards.jsx';
import { Card, CardHeading, KpiCard } from '../../components/common/UI.jsx';
import { metricCards, periodMetrics, posts } from '../../mock/marketingData.js';
import { usePeriod } from '../../app/providers/PeriodProvider.jsx';

export default function DashboardPage() {
  const { period, customDays } = usePeriod();
  const metrics = period === 'custom' ? { ...periodMetrics.custom, views: Math.round(periodMetrics.custom.views * customDays / 30), reach: Math.round(periodMetrics.custom.reach * customDays / 30), interactions: Math.round(periodMetrics.custom.interactions * customDays / 30), visits: Math.round(periodMetrics.custom.visits * customDays / 30) } : periodMetrics[period] || periodMetrics['30d'];
  return <div className="page page-dashboard">
    <div className="dashboard-welcome"><div><div className="welcome-kicker"><span className="welcome-spark">✦</span> Tu espacio de marketing</div><h1>Buenos días, Sofía <span>👋</span></h1><p>Así se están moviendo tus canales. Aquí tienes el resumen de tu marca.</p></div><Link className="button-primary" to="/connections"><Plus size={17} />Gestionar canales</Link><div className="welcome-decoration welcome-orb-one" /><div className="welcome-decoration welcome-orb-two" /></div>
    <div className="section-label-row"><div><span className="section-label">RESUMEN GENERAL</span><span className="section-label-caption">· Canales conectados</span></div><div className="freshness"><i /> Datos actualizados hace 8 min</div></div>
    <div className="kpi-grid">{metricCards.map((metric, index) => <KpiCard key={metric.key} label={metric.label} value={metrics[metric.key]} delta={metrics.delta[index]} hint={metric.hint} icon={metric.icon} format={metric.format} />)}</div>

    <div className="dashboard-chart-grid">
      <Card className="chart-card followers-card"><CardHeading title="Crecimiento de seguidores" subtitle="Comunidad total por canal" action={<Link className="subtle-link" to="/comparison">Ver comparación <ArrowRight size={14} /></Link>} /><ChannelLegend /><FollowersChart /></Card>
      <Card className="chart-card views-card"><CardHeading title="Visualizaciones" subtitle="Reproducciones en todos los canales" action={<span className="chart-summary"><Eye size={15} />{metrics.views.toLocaleString('es-GT')}</span>} /><ViewsChart height={245} /></Card>
    </div>

    <div className="dashboard-secondary-grid">
      <Card className="chart-card"><CardHeading title="Interacciones" subtitle="Cómo responde tu audiencia" /><InteractionsChart /></Card>
      <Card className="chart-card performance-card"><CardHeading title="Rendimiento por canal" subtitle="Visualizaciones en el período" action={<Link className="subtle-link" to="/comparison">Detalles <ArrowRight size={14} /></Link>} /><ChannelBarsChart metricKey="views" height={228} /><div className="performance-note"><span className="performance-award"><Sparkles size={15} /></span><p><strong>TikTok lidera</strong> en visualizaciones durante este período.</p><Link to="/channels/tiktok"><ArrowUpRight size={16} /></Link></div></Card>
    </div>

    <div className="section-heading-row"><div><span className="section-label">CONTENIDO</span><span className="section-label-caption">· Lo que está conectando</span></div><Link className="subtle-link" to="/reports">Ver reportes <ArrowRight size={14} /></Link></div>
    <Card className="posts-panel"><CardHeading title="Publicaciones recientes" subtitle="Una mirada rápida a tu contenido" action={<Link className="subtle-link" to="/reports">Ver todas <ArrowRight size={14} /></Link>} /><PostGrid items={posts.slice(0, 3)} limit={3} /></Card>

    <div className="dashboard-bottom-grid">
      <Card className="top-posts-panel"><CardHeading title="Más destacadas" subtitle="Publicaciones con mejor rendimiento" action={<Link className="subtle-link" to="/reports">Ver ranking <ArrowRight size={14} /></Link>} /><TopPostList items={posts.slice().sort((a, b) => b.views - a.views)} /></Card>
      <Card className="activity-panel"><CardHeading title="Actividad reciente" subtitle="Lo que sucede con tus canales" /><ActivityFeed /></Card>
    </div>

    <div className="section-heading-row ai-section-heading"><div><span className="section-label">PERSPECTIVA INTELIGENTE</span><span className="section-label-caption">· Ideas para crecer</span></div><Link className="subtle-link" to="/ai">Ver análisis <ArrowRight size={14} /></Link></div>
    <div className="ai-banner"><span className="ai-banner-mark"><Lightbulb size={18} /></span><div><strong>Una nueva perspectiva para tus canales</strong><p>Insights simulados basados en el rendimiento de tus publicaciones.</p></div><Link to="/ai">Explorar insights <ArrowRight size={15} /></Link></div>
    <InsightCards compact />
  </div>;
}
