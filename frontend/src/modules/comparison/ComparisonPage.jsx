import { useState } from 'react';
import { BarChart3, Check, Info, Sparkles } from 'lucide-react';
import { ChannelBarsChart, ChannelComparisonChart } from '../../components/charts/AnalyticsCharts.jsx';
import { ChannelLegend } from '../../components/cards/ContentCards.jsx';
import { Card, CardHeading, ChannelMark, PageTitle } from '../../components/common/UI.jsx';
import { channels } from '../../mock/marketingData.js';
import { usePeriod } from '../../app/providers/PeriodProvider.jsx';

const metricChoices = [
  { id: 'followers', label: 'Seguidores', unit: 'cuentas', note: 'Personas que siguen cada perfil.' },
  { id: 'views', label: 'Visualizaciones', unit: 'reproducciones', note: 'Reproducciones acumuladas en cada plataforma.' },
  { id: 'interactions', label: 'Interacciones', unit: 'acciones', note: 'Acciones que cada plataforma agrupa para este mock.' },
  { id: 'engagement', label: 'Engagement', unit: 'porcentaje', note: 'Tasas calculadas con convenciones distintas; sirven como referencia por canal.' },
];

export default function ComparisonPage() {
  const [metric, setMetric] = useState('views');
  const [notice, setNotice] = useState('');
  const { period, customDays } = usePeriod();
  const active = metricChoices.find((item) => item.id === metric);
  const valueFor = (channel) => {
    const prop = metric === 'views' ? 'views' : metric === 'followers' ? 'followers' : metric === 'interactions' ? 'interactions' : 'engagement';
    return channels[channel][prop];
  };
  const summary = ['facebook', 'instagram', 'tiktok'].map((channel) => ({ key: channel, ...channels[channel], value: valueFor(channel) })).sort((a, b) => b.value - a.value);
  const best = summary[0];
  const display = (value) => metric === 'engagement' ? `${value.toFixed(1)}%` : value.toLocaleString('es-GT');
  return <div className="page comparison-page">
    <PageTitle eyebrow="Vista multicanal" title="Comparación de canales" description="Entiende el rendimiento de cada plataforma con sus propias métricas." action={<button className="button-secondary" onClick={() => { setMetric('views'); setNotice('Vista general: visualizaciones comparadas por plataforma.'); }}><BarChart3 size={16} />Vista general</button>} />
    {notice && <div className="inline-notice" role="status"><span>i</span>{notice}<button onClick={() => setNotice('')}>Cerrar</button></div>}
    <div className="comparison-highlight"><span className="comparison-highlight-mark"><Sparkles size={19} /></span><div><span className="highlight-eyebrow">MEJOR RENDIMIENTO · {active.label.toUpperCase()}</span><strong>{best.name} <small>lidera con {display(best.value)} {active.unit}</small></strong><p>Una lectura orientativa para este período simulado.</p></div><span className="highlight-growth">↑ {best.growth}%</span></div>
    <div className="metric-tabs" role="tablist" aria-label="Métrica a comparar">{metricChoices.map((choice) => <button key={choice.id} role="tab" aria-selected={metric === choice.id} className={metric === choice.id ? 'active' : ''} onClick={() => setMetric(choice.id)}>{choice.label}</button>)}</div>
    <div className="comparison-metric-grid">{summary.map((item, index) => <Card key={item.key} className={`comparison-metric-card ${index === 0 ? 'is-leading' : ''}`}><div className="comparison-metric-head"><span className="comparison-rank">0{index + 1}</span><ChannelMark channel={item.key} size={32} /><strong>{item.name}</strong>{index === 0 && <span className="leading-pill"><Check size={12} />Líder</span>}</div><div className="comparison-number">{display(item.value)}</div><div className="comparison-foot"><span>{active.unit}</span><span className="delta positive">↑ {item.growth}%</span></div><div className="comparison-progress"><span style={{ width: `${Math.max(item.value / best.value * 100, 10)}%`, background: item.color }} /></div></Card>)}</div>
    <div className="comparison-chart-grid"><Card className="chart-card"><CardHeading title="Evolución de la comunidad" subtitle="Seguidores por canal a lo largo del período" /><ChannelLegend /><ChannelComparisonChart height={300} /></Card><Card className="chart-card"><CardHeading title={`${active.label} por canal`} subtitle={`${active.note}`} /><ChannelBarsChart metricKey={metric} height={270} /><div className="chart-note"><Info size={15} /><span>{metric === 'engagement' ? 'Las tasas de engagement son orientativas y no deben leerse como definiciones equivalentes entre plataformas.' : 'Valores simulados en la unidad indicada; el período se controla desde el selector superior.'}</span></div></Card></div>
    <Card className="comparison-note"><span className="note-icon"><Info size={17} /></span><div><strong>Compara con contexto</strong><p>Las definiciones de alcance, visualizaciones e interacciones varían por plataforma. Los datos se muestran por separado y no representan métricas normalizadas.</p></div><span className="period-stamp">{period === '7d' ? '7 días' : period === '90d' ? '90 días' : period === '180d' ? '6 meses' : period === 'custom' ? `${customDays} ${customDays === 1 ? 'día' : 'días'}` : '30 días'}</span></Card>
  </div>;
}
