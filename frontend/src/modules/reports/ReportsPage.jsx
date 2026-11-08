import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowRight, CalendarDays, FileBarChart2, Filter, Search, TrendingUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { FollowersChart, InteractionsChart, ViewsChart } from '../../components/charts/AnalyticsCharts.jsx';
import { Card, CardHeading, ChannelBadge, PageTitle } from '../../components/common/UI.jsx';
import TablePagination from '../../components/common/TablePagination.jsx';
import { channels, posts } from '../../mock/marketingData.js';
import { usePeriod } from '../../app/providers/PeriodProvider.jsx';

export default function ReportsPage() {
  const location = useLocation();
  const [channel, setChannel] = useState('all');
  const [reportTab, setReportTab] = useState('overview');
  const [search, setSearch] = useState(location.state?.searchQuery || '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { period, customDays } = usePeriod();
  const channelPosts = useMemo(() => posts
    .filter((post) => channel === 'all' || post.channel === channel)
    .filter((post) => `${post.caption} ${channels[post.channel].name}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.views - a.views), [channel, search]);
  const pageCount = Math.max(1, Math.ceil(channelPosts.length / pageSize));
  const pagePosts = channelPosts.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [channel, search, period]);
  useEffect(() => {
    if (location.state?.searchQuery) setSearch(location.state.searchQuery);
  }, [location.state]);
  return <div className="page reports-page">
    <PageTitle eyebrow="Visión en contexto" title="Reportes" description="Explora el rendimiento de tu contenido y comunidad en un mismo espacio." action={<button className="button-secondary" onClick={() => window.alert('La exportación estará disponible en una fase futura.')}><ArrowDownToLine size={16} />Exportar reporte</button>} />
    <div className="report-summary-row"><div className="report-summary-card"><span className="report-summary-icon blue-soft"><FileBarChart2 size={18} /></span><div><small>PERÍODO SELECCIONADO</small><strong>{period === '7d' ? 'Últimos 7 días' : period === '90d' ? 'Últimos 90 días' : period === '180d' ? 'Últimos 6 meses' : period === 'custom' ? `${customDays} ${customDays === 1 ? 'día' : 'días'}` : 'Últimos 30 días'}</strong></div><CalendarDays size={16} className="summary-corner" /></div><div className="report-summary-card"><span className="report-summary-icon green-soft"><TrendingUp size={18} /></span><div><small>CANALES CON DATOS</small><strong>3 plataformas activas</strong></div><span className="summary-check">●</span></div><div className="report-summary-card"><span className="report-summary-icon purple-soft"><Filter size={18} /></span><div><small>REPORTE ACTUAL</small><strong>{channel === 'all' ? 'Vista general' : channels[channel].name}</strong></div><span className="report-summary-meta">Simulado</span></div></div>
    <div className="report-controls"><div className="metric-tabs" role="tablist" aria-label="Tipo de reporte">{[['overview', 'Vista general'], ['audience', 'Audiencia'], ['content', 'Contenido']].map(([id, label]) => <button key={id} role="tab" aria-selected={reportTab === id} className={reportTab === id ? 'active' : ''} onClick={() => setReportTab(id)}>{label}</button>)}</div><label className="select-field"><span className="sr-only">Filtrar por canal</span><select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="all">Todos los canales</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select></label></div>
    <div className="reports-chart-grid"><Card className="chart-card"><CardHeading title={reportTab === 'audience' ? 'Evolución de seguidores' : reportTab === 'content' ? 'Visualizaciones de contenido' : 'Crecimiento de seguidores'} subtitle="Tendencia durante el período seleccionado" />{reportTab === 'content' ? <ViewsChart channel={channel === 'all' ? undefined : channel} /> : <FollowersChart channel={channel === 'all' ? undefined : channel} />}</Card><Card className="chart-card"><CardHeading title="Interacciones" subtitle="Actividad en tus publicaciones" action={<span className="report-period-chip"><CalendarDays size={13} />{period === '7d' ? '7 días' : period === '90d' ? '90 días' : period === '180d' ? '6 meses' : period === 'custom' ? `${customDays} ${customDays === 1 ? 'día' : 'días'}` : '30 días'}</span>} /><InteractionsChart channel={channel === 'all' ? undefined : channel} /></Card></div>
    <Card className="report-posts-card"><CardHeading title="Rendimiento de publicaciones" subtitle="Contenido con mayor alcance en tus canales" action={<button className="subtle-link" onClick={() => setReportTab('content')}>Ver análisis de contenido <ArrowRight size={14} /></button>} /><label className="table-search report-search"><Search size={15} /><input aria-label="Buscar publicaciones" placeholder="Buscar publicación o canal" value={search} onChange={(event) => setSearch(event.target.value)} /></label><div className="table-scroll"><table className="data-table report-table"><thead><tr><th>PUBLICACIÓN</th><th>CANAL</th><th>FECHA</th><th>VISUALIZACIONES</th><th>INTERACCIONES</th><th>ENGAGEMENT</th></tr></thead><tbody>{pagePosts.map((post) => <tr key={post.id}><td><div className="table-post"><img src={post.image} alt="" /><span>{post.caption}</span></div></td><td><ChannelBadge channel={post.channel} /></td><td>{post.date}</td><td>{post.views.toLocaleString('es-GT')}</td><td>{(post.likes + post.comments + post.shares).toLocaleString('es-GT')}</td><td><span className="table-engagement">{((post.likes + post.comments + post.shares) / post.views * 100).toFixed(1)}%</span></td></tr>)}</tbody></table>{channelPosts.length === 0 && <p className="empty-copy">No hay publicaciones en este filtro.</p>}</div><TablePagination page={page} pageSize={pageSize} pageCount={pageCount} total={channelPosts.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /></Card>
    <div className="report-footnote"><span>i</span> Los reportes son simulaciones basadas en datos de demostración. No representan estadísticas de cuentas reales.</div>
  </div>;
}
