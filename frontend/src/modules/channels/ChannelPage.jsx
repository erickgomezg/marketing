import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, ExternalLink, Sparkles, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { FollowersChart, InteractionsChart, ViewsChart } from '../../components/charts/AnalyticsCharts.jsx';
import { PostGrid, TopPostList } from '../../components/cards/ContentCards.jsx';
import { Card, CardHeading, ChannelMark, KpiCard, PageTitle } from '../../components/common/UI.jsx';
import { channels, metricCards, posts } from '../../mock/marketingData.js';
import { usePeriod } from '../../app/providers/PeriodProvider.jsx';

const periodScale = { '7d': .24, '30d': 1, '90d': 2.8, '180d': 5.4, custom: .91 };

export default function ChannelPage() {
  const { channel: slug } = useParams();
  const [notice, setNotice] = useState('');
  const channel = channels[slug] ? slug : 'facebook';
  const info = channels[channel];
  const { period, customDays, customRange } = usePeriod();
  const scale = period === 'custom' ? customDays / 30 : periodScale[period] || 1;
  const channelPosts = useMemo(() => posts.filter((post) => post.channel === channel), [channel]);
  const values = {
    followers: info.followers,
    views: Math.round(info.views * scale),
    reach: Math.round(info.reach * scale),
    interactions: Math.round(info.interactions * scale),
    likes: Math.round((info.likes || Math.round(info.interactions * .72)) * scale),
    comments: Math.round((info.comments || Math.round(info.interactions * .12)) * scale),
    shares: Math.round((info.shares || Math.round(info.interactions * .16)) * scale),
    engagement: info.engagement,
    visits: Math.round(info.visits * scale),
  };
  const kpis = channel === 'tiktok' ? [
    metricCards[0], metricCards[1],
    { key: 'likes', label: 'Me gusta', icon: 'heart', format: 'compact', hint: 'Likes en videos' },
    { key: 'comments', label: 'Comentarios', icon: 'comments', format: 'compact', hint: 'Respuestas recibidas' },
    { key: 'shares', label: 'Compartidos', icon: 'shares', format: 'compact', hint: 'Veces compartido' },
    metricCards[4], metricCards[5],
  ] : metricCards;
  const formattedNumber = (value) => value.toLocaleString('es-GT');
  return <div className="page channel-page">
    <PageTitle eyebrow="Canal conectado" title={<span className="channel-title"><ChannelMark channel={channel} size={36} />{info.name}</span>} description={`${info.description} · ${info.handle}`} action={<button className="button-secondary" onClick={() => setNotice(`El perfil ${info.handle} se muestra como referencia; no se abre una cuenta real.`)}><ExternalLink size={16} />Abrir perfil</button>} />
    {notice && <div className="inline-notice" role="status"><span>i</span>{notice}<button onClick={() => setNotice('')}>Cerrar</button></div>}
    <div className="channel-summary-strip"><div><span className="connection-dot" />Conectado y sincronizado</div><span>Última sincronización hace 8 min</span><span className="strip-divider" /><span><CalendarDays size={14} />{period === 'custom' ? `${customRange.from} — ${customRange.to}` : period === '7d' ? 'Últimos 7 días' : period === '90d' ? 'Últimos 90 días' : period === '180d' ? 'Últimos 6 meses' : 'Últimos 30 días'}</span></div>
    <div className="kpi-grid channel-kpi-grid">{kpis.map((metric, index) => <KpiCard key={metric.key} label={metric.label} value={values[metric.key]} delta={index === 0 ? info.growth : info.growth * (index % 2 ? .82 : 1.2)} hint={metric.key === 'followers' ? 'Comunidad actual' : metric.hint} icon={metric.icon} format={metric.format} />)}</div>
    <div className="dashboard-chart-grid channel-charts-grid"><Card className="chart-card"><CardHeading title="Crecimiento de seguidores" subtitle={`Evolución de ${info.name} en el período`} /><FollowersChart channel={channel} /></Card><Card className="chart-card"><CardHeading title="Alcance y visualizaciones" subtitle="Actividad estimada de tu audiencia" /><ViewsChart channel={channel} /></Card></div>
    <div className="channel-lower-grid"><Card className="chart-card"><CardHeading title="Interacciones" subtitle="Respuestas a tu contenido" /><InteractionsChart channel={channel} /></Card><Card className="channel-insight-panel"><CardHeading title="Lectura del canal" subtitle="Una perspectiva basada en tus métricas" /><div className="channel-insight"><span><Sparkles size={17} /></span><div><strong>{info.growth > 8 ? 'Tu comunidad está acelerando' : 'Crecimiento constante'}</strong><p>{info.name} creció {info.growth}% durante el período. Las publicaciones visuales están impulsando las conversaciones.</p></div></div><div className="channel-insight-stat"><span><UsersRound size={16} /> Comunidad actual</span><strong>{formattedNumber(info.followers)}</strong></div><Link className="subtle-link" to="/ai">Ver todos los insights <ArrowRight size={14} /></Link></Card></div>
    <div className="section-heading-row"><div><span className="section-label">PUBLICACIONES</span><span className="section-label-caption">· Rendimiento de {info.name}</span></div><Link className="subtle-link" to="/reports">Abrir reportes <ArrowRight size={14} /></Link></div>
    <Card className="posts-panel"><CardHeading title="Contenido reciente" subtitle="Publicaciones y videos de este canal" action={<span className="muted-count">{channelPosts.length} publicaciones</span>} /><PostGrid items={channelPosts} limit={3} showChannel={false} />{channelPosts.length === 0 && <p className="empty-copy">Todavía no hay publicaciones simuladas para este canal.</p>}</Card>
    <Card className="top-posts-panel channel-top-posts"><CardHeading title="Mejor rendimiento" subtitle="Contenido con más visualizaciones" action={<span className="text-chip">Top {Math.min(channelPosts.length, 3)}</span>} /><TopPostList items={channelPosts.slice().sort((a, b) => b.views - a.views)} /></Card>
  </div>;
}
