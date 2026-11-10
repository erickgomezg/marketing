// Catálogo estructural de plataformas. No contiene métricas, publicaciones ni registros de demostración.
export const periods = [
  { id: '7d', label: 'Últimos 7 días' }, { id: '30d', label: 'Últimos 30 días' },
  { id: '90d', label: 'Últimos 90 días' }, { id: '180d', label: 'Últimos 6 meses' },
  { id: 'custom', label: 'Personalizado' },
];
export const channels = {
  facebook: { name: 'Facebook', shortName: 'Facebook', color: '#1877F2', icon: 'facebook', description: 'Páginas y estadísticas de Facebook' },
  instagram: { name: 'Instagram', shortName: 'Instagram', color: '#D946A8', icon: 'instagram', description: 'Contenido y estadísticas de Instagram' },
  tiktok: { name: 'TikTok', shortName: 'TikTok', color: '#171717', icon: 'tiktok', description: 'Contenido y estadísticas de TikTok' },
  whatsapp: { name: 'WhatsApp', shortName: 'WhatsApp', color: '#20B56B', icon: 'whatsapp', description: 'Mensajería empresarial' },
};
export const metricCards = [
  { key: 'followers', label: 'Seguidores', icon: 'users', format: 'compact', hint: 'Total de las cuentas conectadas' },
  { key: 'views', label: 'Visualizaciones', icon: 'eye', format: 'compact', hint: 'Según las métricas disponibles' },
  { key: 'reach', label: 'Alcance', icon: 'radio', format: 'compact', hint: 'Personas alcanzadas' },
  { key: 'interactions', label: 'Interacciones', icon: 'heart', format: 'compact', hint: 'Interacciones reportadas' },
  { key: 'engagement', label: 'Engagement', icon: 'sparkles', format: 'percent', hint: 'Según definición de plataforma' },
  { key: 'visits', label: 'Visitas al perfil', icon: 'mouse', format: 'compact', hint: 'Visitas reportadas' },
];
export const posts = [];
export const activities = [];
export const aiInsights = [];
export const connections = [];
export const initialUsers = [];
export const conversations = [];
export const chatMessages = [];
