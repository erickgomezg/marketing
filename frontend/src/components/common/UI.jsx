import { ArrowDownRight, ArrowUpRight, Eye, Heart, MessageCircle, MousePointer2, Radio, Share2, Sparkles, UsersRound } from 'lucide-react';
import { channels } from '../../mock/marketingData.js';

const metricIcons = { users: UsersRound, eye: Eye, radio: Radio, heart: Heart, comments: MessageCircle, shares: Share2, sparkles: Sparkles, mouse: MousePointer2 };
export function PageTitle({ eyebrow, title, description, action }) {
  return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-title-action">{action}</div>}</div>;
}

export function Card({ children, className = '', ...props }) { return <section className={`card ${className}`} {...props}>{children}</section>; }

export function CardHeading({ title, subtitle, action }) {
  return <div className="card-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="card-heading-action">{action}</div>}</div>;
}

export function KpiCard({ label, value, delta, hint, icon = 'sparkles', format = 'compact' }) {
  const Icon = metricIcons[icon] || Sparkles;
  const formatted = format === 'percent' ? `${Number(value).toFixed(1)}%` : Number(value).toLocaleString('es-GT', { notation: Number(value) > 9999 ? 'compact' : 'standard', maximumFractionDigits: 1 });
  const positive = Number(delta) >= 0;
  return <Card className="kpi-card">
    <div className="kpi-top"><span>{label}</span><span className="kpi-icon"><Icon size={17} strokeWidth={1.8} /></span></div>
    <div className="kpi-value">{formatted}</div>
    <div className="kpi-bottom"><span className={`delta ${positive ? 'positive' : 'negative'}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(Number(delta)).toFixed(1)}%</span><span>{hint}</span></div>
  </Card>;
}

export function Avatar({ initials, color = 'blue', size = 'normal' }) { return <span className={`avatar avatar-${color} avatar-${size}`}>{initials}</span>; }

export function ChannelMark({ channel, size = 34 }) {
  if (channel === 'whatsapp') return <span className="channel-mark mark-whatsapp" style={{ width: size, height: size }} aria-label="WhatsApp"><MessageCircle size={Math.round(size * .53)} fill="currentColor" /></span>;
  const item = channels[channel];
  if (!item) return <span className="channel-mark" style={{ width: size, height: size }}>AM</span>;
  const letter = channel === 'facebook' ? 'f' : channel === 'instagram' ? '◎' : '♪';
  return <span className={`channel-mark mark-${channel}`} style={{ width: size, height: size }} aria-label={item.name}>{letter}</span>;
}

export function ChannelBadge({ channel, label }) {
  const item = channels[channel];
  return <span className="channel-badge"><ChannelMark channel={channel} size={20} />{label || item?.name}</span>;
}

export function MockImage({ post, className = '' }) {
  return <div role="img" aria-label={`Imagen simulada: ${post.caption}`} className={`mock-image ${className}`} style={{ backgroundImage: `linear-gradient(180deg, transparent 40%, rgba(0,0,0,.36)), url("${post.image}")` }}><span>{post.caption}</span></div>;
}

export function EmptyState({ icon: Icon = Sparkles, title, description }) {
  return <div className="empty-state"><span><Icon size={22} /></span><strong>{title}</strong><p>{description}</p></div>;
}

export function Toggle({ checked, onChange, label }) {
  return <button className={`toggle ${checked ? 'is-on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>;
}

export function MetricChange({ value, suffix = '%' }) {
  return <span className="metric-change"><ArrowUpRight size={14} />{value}{suffix}</span>;
}
