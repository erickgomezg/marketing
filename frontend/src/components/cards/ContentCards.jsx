import { ArrowUpRight, Eye, Heart, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { activities, aiInsights, channels } from '../../mock/marketingData.js';
import { Avatar, Card, ChannelBadge, MockImage } from '../common/UI.jsx';

export function PostGrid({ items, limit = 3, showChannel = true }) {
  return <div className="post-grid">{items.slice(0, limit).map((post) => <article className="post-card" key={post.id}>
    <MockImage post={post} />
    <div className="post-card-body">{showChannel && <ChannelBadge channel={post.channel} />}<p className="post-caption">{post.caption}</p><div className="post-meta"><span>{post.date}</span><Link to={`/channels/${post.channel}`} aria-label={`Ver ${channels[post.channel].name}`}><ArrowUpRight size={15} /></Link></div>
      <div className="post-stats"><span><Eye size={14} />{post.views.toLocaleString('es-GT')}</span><span><Heart size={14} />{post.likes.toLocaleString('es-GT')}</span><span><MessageCircle size={14} />{post.comments}</span><span><Share2 size={14} />{post.shares}</span></div></div>
  </article>)}</div>;
}

export function TopPostList({ items }) {
  return <div className="top-post-list">{items.slice(0, 4).map((post, index) => <div className="top-post-row" key={post.id}>
    <span className="rank">0{index + 1}</span><img src={post.image} alt="" /><div className="top-post-copy"><strong>{post.caption}</strong><span><ChannelBadge channel={post.channel} /></span></div><div className="top-post-result"><strong>{post.views.toLocaleString('es-GT')}</strong><small>visualizaciones</small></div>
  </div>)}</div>;
}

export function InsightCards({ compact = false }) {
  return <div className={`insight-grid ${compact ? 'insight-grid-compact' : ''}`}>{aiInsights.slice(0, compact ? 2 : 3).map((insight) => <Card className={`insight-card insight-${insight.type}`} key={insight.id}>
    <div className="insight-card-top"><span className="insight-icon"><Sparkles size={17} /></span><span className="insight-pill">{insight.tag}</span></div>
    <h3>{insight.title}</h3><p>{insight.text}</p><div className="insight-footer"><span>Insight simulado · IA</span><strong>{insight.change}</strong></div>
  </Card>)}</div>;
}

export function ActivityFeed() {
  const iconFor = { up: ArrowUpRight, user: Avatar, heart: Heart };
  return <div className="activity-feed">{activities.map((activity) => {
    const Icon = iconFor[activity.type];
    return <div className="activity-row" key={activity.id}><span className={`activity-icon activity-${activity.type}`}>{activity.type === 'user' ? <Icon initials="AM" color="blue" size="small" /> : <Icon size={16} />}</span><div><strong>{activity.title}</strong><p>{activity.detail}</p><small>{activity.time}</small></div></div>;
  })}</div>;
}

export function ChannelLegend({ values = channels }) {
  return <div className="channel-legend">{Object.entries(values).map(([key, item]) => <span key={key}><i style={{ background: item.color }} />{item.name}</span>)}</div>;
}

export function ChannelSnapshot({ channel, value, unit = 'seguidores', growth }) {
  const data = channels[channel];
  return <Card className="channel-snapshot"><div className="snapshot-head"><ChannelBadge channel={channel} /><span className="delta positive"><ArrowUpRight size={14} />{growth ?? data.growth}%</span></div><strong>{(value ?? data.followers).toLocaleString('es-GT')}</strong><small>{unit} · últimos 30 días</small><div className="snapshot-bottom"><span>Frente al período anterior</span><span>↑ {growth ?? data.growth}%</span></div></Card>;
}

export function MiniSectionHeading({ title, action, to }) {
  return <div className="mini-section-heading"><h3>{title}</h3>{to ? <Link to={to}>{action}<ArrowUpRight size={14} /></Link> : action}</div>;
}
