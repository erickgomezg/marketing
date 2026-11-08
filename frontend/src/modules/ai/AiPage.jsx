import { useState } from 'react';
import { ArrowUp, Clock3, Lightbulb, MessageSquareText, Sparkles, WandSparkles } from 'lucide-react';
import { InsightCards } from '../../components/cards/ContentCards.jsx';
import { Avatar, Card, CardHeading, PageTitle } from '../../components/common/UI.jsx';

const suggestedPrompts = ['¿Qué contenido funcionó mejor?', 'Dame ideas para esta semana', '¿Cómo creció mi audiencia?'];

export default function AiPage() {
  const [draft, setDraft] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [messages, setMessages] = useState([{ id: 1, side: 'assistant', text: '¡Hola, Sofía! 👋 Puedo ayudarte a explorar los datos simulados de tus canales. ¿Qué te gustaría descubrir hoy?' }]);
  const send = (message = draft) => {
    if (!message.trim()) return;
    const question = message.trim();
    setMessages((items) => [...items, { id: Date.now(), side: 'user', text: question }, { id: Date.now() + 1, side: 'assistant', text: 'Según los datos de demostración, TikTok lidera en visualizaciones y las publicaciones de Instagram por la tarde generan más interacción. Prueba distintos formatos y horarios para encontrar qué conecta mejor con tu audiencia.' }]);
    setDraft('');
  };
  return <div className="page ai-page">
    <PageTitle eyebrow="Ideas que impulsan" title="Inteligencia Artificial" description="Una lectura más inteligente de lo que sucede en tus canales." />
    <div className="ai-hero"><div className="ai-hero-orbit orbit-one" /><div className="ai-hero-orbit orbit-two" /><span className="ai-hero-icon"><WandSparkles size={23} /></span><div className="ai-hero-copy"><span>AI INSIGHTS · DEMO</span><h2>Tu próxima gran idea<br />empieza con una señal.</h2><p>Explora tendencias, oportunidades y recomendaciones basadas en datos simulados de tu marca.</p></div><div className="ai-hero-foot"><span><i /> Análisis actualizado</span><span>3 canales analizados</span></div></div>
    <div className="ai-stat-row"><Card><span className="report-summary-icon purple-soft"><Sparkles size={18} /></span><div><small>INSIGHTS DISPONIBLES</small><strong>03 recomendaciones</strong></div></Card><Card><span className="report-summary-icon blue-soft"><Clock3 size={18} /></span><div><small>ÚLTIMO ANÁLISIS</small><strong>Hoy, 09:30</strong></div></Card><Card><span className="report-summary-icon green-soft"><Lightbulb size={18} /></span><div><small>OPORTUNIDAD DESTACADA</small><strong>Contenido de video corto</strong></div></Card></div>
    <div className="ai-content-grid"><div><div className="section-heading-row"><div><span className="section-label">TUS INSIGHTS</span><span className="section-label-caption">· Ideas generadas para ti</span></div><span className="text-chip">Este período</span></div><InsightCards /><Card className="ai-trends-card"><CardHeading title="Tendencias que observamos" subtitle="Señales detectadas en el contenido reciente" /><div className="trend-list">{[['↑', 'El video corto tiene más alcance', 'Los clips de menos de 30 segundos retienen mejor a tu audiencia.', '+24%', 'trend-green'], ['◉', 'Más guardados en carruseles', 'El contenido paso a paso impulsa guardados en Instagram.', '+38%', 'trend-purple'], ['◷', 'Mayor actividad por la tarde', 'Tu comunidad responde entre las 17:00 y las 20:00.', '17–20 h', 'trend-blue']].map(([icon, title, text, stat, color]) => <div className="trend-row" key={title}><span className={`trend-icon ${color}`}>{icon}</span><div><strong>{title}</strong><p>{text}</p></div><b>{stat}</b></div>)}</div></Card></div>
      <div className="ai-right-column"><Card className="ai-chat-card"><CardHeading title="Explora tus datos" subtitle="Una conversación de demostración" /><div className="chat-disclaimer">✦ Las respuestas se generan localmente con contenido de ejemplo.</div><div className="ai-chat-messages">{messages.map((message) => <div className={`ai-chat-row ${message.side}`} key={message.id}>{message.side === 'assistant' ? <span className="ai-chat-avatar"><Sparkles size={14} /></span> : <Avatar initials="SR" color="lavender" size="small" />}<p>{message.text}</p></div>)}</div><div className="prompt-suggestions">{suggestedPrompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)}>{prompt}</button>)}</div><form className="chat-input-row" onSubmit={(event) => { event.preventDefault(); send(); }}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Pregunta sobre tus canales…" /><button aria-label="Enviar mensaje" disabled={!draft.trim()}><ArrowUp size={17} /></button></form></Card><Card className="analysis-history"><CardHeading title="Actividad de análisis" action={<button type="button" className="text-action" onClick={() => setHistoryExpanded((value) => !value)}>{historyExpanded ? 'Ver menos' : 'Ver todo'}</button>} />{[
        ['Resumen semanal', 'Hoy · 09:30 · 3 canales', MessageSquareText],
        ['Análisis de contenido', 'Ayer · 16:20 · Instagram', Sparkles],
        ...(historyExpanded ? [['Tendencias de audiencia', '28 oct · 11:05 · 3 canales', Lightbulb], ['Rendimiento de publicaciones', '26 oct · 15:40 · Facebook', MessageSquareText]] : []),
      ].map(([label, detail, Icon]) => <div className="history-item" key={label}><span className="history-icon"><Icon size={15} /></span><div><strong>{label}</strong><small>{detail}</small></div><span className="history-status">Listo</span></div>)}</Card></div></div>
  </div>;
}
