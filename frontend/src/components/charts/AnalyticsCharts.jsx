import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { channels, getSeries } from '../../mock/marketingData.js';
import { usePeriod } from '../../app/providers/PeriodProvider.jsx';

const colors = { Facebook: '#4B8BF5', Instagram: '#D946A8', TikTok: '#27272A' };
const money = (value) => new Intl.NumberFormat('es-GT', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const tooltipStyle = { border: '1px solid #e9ebef', borderRadius: 12, boxShadow: '0 10px 30px #1d1d1f12', fontSize: 12, padding: '10px 13px' };
const tooltipContent = { contentStyle: tooltipStyle, labelStyle: { color: '#737780', marginBottom: 5 }, itemStyle: { padding: '2px 0' }, formatter: (value, name) => [money(value), name] };

export function FollowersChart({ channel, height = 270 }) {
  const { period, customRange, customDays } = usePeriod(); const data = getSeries(period, customRange, customDays);
  const keys = channel ? [[channels[channel].name === 'Facebook' ? 'Facebook' : channels[channel].name === 'Instagram' ? 'Instagram' : 'TikTok', channels[channel].color]] : Object.entries(colors);
  return <ResponsiveContainer width="100%" height={height}><LineChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
    <CartesianGrid stroke="#eef0f3" vertical={false} />
    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9a9da5', fontSize: 11 }} dy={10} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9a9da5', fontSize: 11 }} tickFormatter={money} />
    <Tooltip {...tooltipContent} /><Legend iconType="circle" iconSize={7} wrapperStyle={{ paddingTop: 18, fontSize: 11, color: '#6d717a' }} />
    {keys.map(([key, color]) => <Line key={key} type="monotone" dataKey={key} name={key} stroke={color} strokeWidth={2.4} dot={data.length === 1 ? { r: 4 } : false} activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff' }} />)}
  </LineChart></ResponsiveContainer>;
}

export function ViewsChart({ channel, height = 270 }) {
  const { period, customRange, customDays } = usePeriod(); const data = getSeries(period, customRange, customDays);
  const chartData = data.map((row, index) => ({ ...row, views: channel ? Math.round(row.visualizaciones * ({ facebook: .22, instagram: .34, tiktok: .44 }[channel]) / 1.3) : row.visualizaciones, key: index }));
  return <ResponsiveContainer width="100%" height={height}><AreaChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
    <defs><linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={channel ? channels[channel].color : '#2773F5'} stopOpacity={.19} /><stop offset="100%" stopColor={channel ? channels[channel].color : '#2773F5'} stopOpacity={0} /></linearGradient></defs>
    <CartesianGrid stroke="#eef0f3" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9a9da5', fontSize: 11 }} dy={10} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9a9da5', fontSize: 11 }} tickFormatter={money} /><Tooltip {...tooltipContent} />
    <Area type="monotone" dataKey="views" name="Visualizaciones" stroke={channel ? channels[channel].color : '#2773F5'} strokeWidth={2.5} fill="url(#viewsFill)" dot={data.length === 1 ? { r: 4 } : false} activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff' }} />
  </AreaChart></ResponsiveContainer>;
}

export function InteractionsChart({ channel, height = 245 }) {
  const { period, customRange, customDays } = usePeriod(); const data = getSeries(period, customRange, customDays);
  const chartData = data.map((row) => ({ ...row, total: channel ? Math.round(row.interacciones * ({ facebook: .18, instagram: .34, tiktok: .48 }[channel])) : row.interacciones }));
  return <ResponsiveContainer width="100%" height={height}><BarChart data={chartData} margin={{ top: 12, right: 4, left: -18, bottom: 0 }}>
    <CartesianGrid stroke="#eef0f3" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9a9da5', fontSize: 11 }} dy={10} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9a9da5', fontSize: 11 }} tickFormatter={money} /><Tooltip {...tooltipContent} />
    <Bar dataKey="total" name="Interacciones" fill={channel ? channels[channel].color : '#27B7F5'} radius={[5, 5, 0, 0]} maxBarSize={36} />
  </BarChart></ResponsiveContainer>;
}

export function ChannelComparisonChart({ height = 300 }) {
  const { period, customRange, customDays } = usePeriod(); const data = getSeries(period, customRange, customDays);
  return <ResponsiveContainer width="100%" height={height}><LineChart data={data} margin={{ top: 12, right: 14, left: -18, bottom: 0 }}>
    <CartesianGrid stroke="#eef0f3" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9a9da5', fontSize: 11 }} dy={10} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9a9da5', fontSize: 11 }} tickFormatter={money} /><Tooltip {...tooltipContent} />
    {['Facebook', 'Instagram', 'TikTok'].map((key) => <Line key={key} type="monotone" dataKey={key} name={`${key} · seguidores`} stroke={colors[key]} strokeWidth={2.4} dot={data.length === 1 ? { r: 4 } : false} activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff' }} />)}
  </LineChart></ResponsiveContainer>;
}

export function ChannelBarsChart({ metricKey = 'views', height = 240 }) {
  const { period, customDays } = usePeriod();
  const values = {
    views: [{ name: 'Facebook', value: channels.facebook.views, fill: colors.Facebook }, { name: 'Instagram', value: channels.instagram.views, fill: colors.Instagram }, { name: 'TikTok', value: channels.tiktok.views, fill: colors.TikTok }],
    followers: [{ name: 'Facebook', value: channels.facebook.followers, fill: colors.Facebook }, { name: 'Instagram', value: channels.instagram.followers, fill: colors.Instagram }, { name: 'TikTok', value: channels.tiktok.followers, fill: colors.TikTok }],
    interactions: [{ name: 'Facebook', value: channels.facebook.interactions, fill: colors.Facebook }, { name: 'Instagram', value: channels.instagram.interactions, fill: colors.Instagram }, { name: 'TikTok', value: channels.tiktok.interactions, fill: colors.TikTok }],
    engagement: [{ name: 'Facebook', value: channels.facebook.engagement, fill: colors.Facebook }, { name: 'Instagram', value: channels.instagram.engagement, fill: colors.Instagram }, { name: 'TikTok', value: channels.tiktok.engagement, fill: colors.TikTok }],
  };
  const scale = period === '7d' ? .24 : period === '90d' ? 2.8 : period === '180d' ? 5.4 : period === 'custom' ? customDays / 30 : 1;
  const data = (values[metricKey] || values.views).map((item) => ({ ...item, value: ['followers', 'engagement'].includes(metricKey) ? item.value : Math.round(item.value * scale) }));
  const format = metricKey === 'engagement' ? (value) => `${value}%` : money;
  return <ResponsiveContainer width="100%" height={height}><BarChart data={data} margin={{ top: 12, right: 12, left: -15, bottom: 0 }}>
    <CartesianGrid stroke="#eef0f3" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#777b84', fontSize: 11 }} dy={9} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9a9da5', fontSize: 10 }} tickFormatter={format} /><Tooltip {...tooltipContent} formatter={(value, name) => [metricKey === 'engagement' ? `${value}%` : money(value), name]} />
    <Bar dataKey="value" name={metricKey === 'views' ? 'Visualizaciones' : metricKey === 'followers' ? 'Seguidores' : metricKey === 'interactions' ? 'Interacciones' : 'Engagement'} radius={[6, 6, 0, 0]} maxBarSize={54}>{data.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Bar>
  </BarChart></ResponsiveContainer>;
}
