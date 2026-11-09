export const periods = [
  { id: '7d', label: 'Últimos 7 días' },
  { id: '30d', label: 'Últimos 30 días' },
  { id: '90d', label: 'Últimos 90 días' },
  { id: '180d', label: 'Últimos 6 meses' },
  { id: 'custom', label: 'Personalizado' },
];

export const channels = {
  facebook: {
    name: 'Facebook', shortName: 'Facebook', handle: 'Amor Studio', color: '#1877F2', icon: 'facebook',
    description: 'Comunidad y contenido de marca', followers: 28420, reach: 168400, views: 412800,
    interactions: 18920, engagement: 4.8, visits: 12300, growth: 3.4,
  },
  instagram: {
    name: 'Instagram', shortName: 'Instagram', handle: '@amor.studio', color: '#D946A8', icon: 'instagram',
    description: 'Historias visuales de la marca', followers: 46280, reach: 286100, views: 936400,
    interactions: 38640, engagement: 6.2, visits: 28400, growth: 8.7,
  },
  tiktok: {
    name: 'TikTok', shortName: 'TikTok', handle: '@amorstudio', color: '#171717', icon: 'tiktok',
    description: 'Video corto y comunidad', followers: 31860, reach: 426800, views: 1840000,
    interactions: 72800, likes: 61200, comments: 3300, shares: 8300, engagement: 9.1, visits: 41600, growth: 12.5,
  },
};

export const periodMetrics = {
  '7d': { followers: 106560, views: 618200, reach: 289400, interactions: 28460, engagement: 6.8, visits: 24600, delta: [2.8, 12.4, 8.2, 9.6, 0.6, 11.1] },
  '30d': { followers: 106560, views: 3189200, reach: 881300, interactions: 110360, engagement: 6.7, visits: 82300, delta: [4.6, 18.2, 11.8, 14.5, 0.8, 16.4] },
  '90d': { followers: 101870, views: 8421600, reach: 2410800, interactions: 302400, engagement: 6.4, visits: 231600, delta: [8.9, 26.1, 19.6, 20.8, 0.5, 24.1] },
  '180d': { followers: 94620, views: 15840000, reach: 4912300, interactions: 602800, engagement: 6.1, visits: 428900, delta: [14.2, 37.8, 31.4, 29.1, 0.4, 35.7] },
  custom: { followers: 106560, views: 2943600, reach: 804200, interactions: 101820, engagement: 6.5, visits: 76800, delta: [3.9, 15.7, 9.1, 12.8, 0.4, 13.2] },
};

const series = {
  '7d': [
    { name: 'Lun', Facebook: 27980, Instagram: 45190, TikTok: 30920, visualizaciones: 64100, interacciones: 3100 },
    { name: 'Mar', Facebook: 28020, Instagram: 45380, TikTok: 31060, visualizaciones: 77200, interacciones: 3610 },
    { name: 'Mié', Facebook: 28080, Instagram: 45510, TikTok: 31230, visualizaciones: 89300, interacciones: 4180 },
    { name: 'Jue', Facebook: 28140, Instagram: 45730, TikTok: 31380, visualizaciones: 75200, interacciones: 3560 },
    { name: 'Vie', Facebook: 28200, Instagram: 45940, TikTok: 31560, visualizaciones: 102400, interacciones: 4830 },
    { name: 'Sáb', Facebook: 28280, Instagram: 46110, TikTok: 31720, visualizaciones: 118000, interacciones: 5500 },
    { name: 'Dom', Facebook: 28420, Instagram: 46280, TikTok: 31860, visualizaciones: 97700, interacciones: 4680 },
  ],
  '30d': [
    { name: '1 oct', Facebook: 27460, Instagram: 42580, TikTok: 28260, visualizaciones: 790000, interacciones: 24300 },
    { name: '5 oct', Facebook: 27600, Instagram: 43140, TikTok: 29120, visualizaciones: 860000, interacciones: 27700 },
    { name: '10 oct', Facebook: 27800, Instagram: 43810, TikTok: 30140, visualizaciones: 920000, interacciones: 31900 },
    { name: '15 oct', Facebook: 27920, Instagram: 44540, TikTok: 30720, visualizaciones: 1050000, interacciones: 35700 },
    { name: '20 oct', Facebook: 28080, Instagram: 45170, TikTok: 31260, visualizaciones: 1110000, interacciones: 38400 },
    { name: '25 oct', Facebook: 28220, Instagram: 45780, TikTok: 31640, visualizaciones: 1190000, interacciones: 41600 },
    { name: '31 oct', Facebook: 28420, Instagram: 46280, TikTok: 31860, visualizaciones: 1280000, interacciones: 45300 },
  ],
  '90d': [
    { name: 'Ago', Facebook: 26100, Instagram: 39800, TikTok: 25400, visualizaciones: 5200000, interacciones: 174000 },
    { name: 'Ago 15', Facebook: 26700, Instagram: 40800, TikTok: 26900, visualizaciones: 6120000, interacciones: 210000 },
    { name: 'Sep', Facebook: 27000, Instagram: 41700, TikTok: 27800, visualizaciones: 7050000, interacciones: 246000 },
    { name: 'Sep 15', Facebook: 27400, Instagram: 43000, TikTok: 29100, visualizaciones: 7510000, interacciones: 260000 },
    { name: 'Oct', Facebook: 27900, Instagram: 44500, TikTok: 30700, visualizaciones: 7920000, interacciones: 281000 },
    { name: 'Oct 15', Facebook: 28200, Instagram: 45700, TikTok: 31600, visualizaciones: 8150000, interacciones: 290000 },
    { name: 'Hoy', Facebook: 28420, Instagram: 46280, TikTok: 31860, visualizaciones: 8421600, interacciones: 302400 },
  ],
  '180d': [
    { name: 'May', Facebook: 23800, Instagram: 35200, TikTok: 18600, visualizaciones: 3900000, interacciones: 130000 },
    { name: 'Jun', Facebook: 24700, Instagram: 36800, TikTok: 21400, visualizaciones: 4400000, interacciones: 149000 },
    { name: 'Jul', Facebook: 25500, Instagram: 38300, TikTok: 23600, visualizaciones: 5100000, interacciones: 172000 },
    { name: 'Ago', Facebook: 26400, Instagram: 40100, TikTok: 26000, visualizaciones: 5900000, interacciones: 202000 },
    { name: 'Sep', Facebook: 27300, Instagram: 42900, TikTok: 29100, visualizaciones: 7100000, interacciones: 247000 },
    { name: 'Oct', Facebook: 27900, Instagram: 45100, TikTok: 31000, visualizaciones: 9600000, interacciones: 361000 },
    { name: 'Hoy', Facebook: 28420, Instagram: 46280, TikTok: 31860, visualizaciones: 15840000, interacciones: 602800 },
  ],
  custom: [
    { name: '1 oct', Facebook: 27580, Instagram: 42900, TikTok: 28900, visualizaciones: 710000, interacciones: 21000 },
    { name: '6 oct', Facebook: 27700, Instagram: 43500, TikTok: 29700, visualizaciones: 805000, interacciones: 26400 },
    { name: '11 oct', Facebook: 27860, Instagram: 44080, TikTok: 30300, visualizaciones: 916000, interacciones: 31200 },
    { name: '16 oct', Facebook: 28000, Instagram: 44720, TikTok: 30900, visualizaciones: 1023000, interacciones: 34200 },
    { name: '21 oct', Facebook: 28180, Instagram: 45350, TikTok: 31380, visualizaciones: 1088000, interacciones: 37900 },
    { name: '26 oct', Facebook: 28300, Instagram: 45890, TikTok: 31700, visualizaciones: 1175000, interacciones: 40800 },
    { name: '31 oct', Facebook: 28420, Instagram: 46280, TikTok: 31860, visualizaciones: 1264000, interacciones: 42600 },
  ],
};

export function getSeries(period, customRange, customDays = 30) {
  if (period !== 'custom') return series[period] || series['30d'];
  const baseline = series.custom;
  const scale = customDays / 30;
  const start = new Date(`${customRange?.from || '2026-10-01'}T00:00:00Z`);
  const end = new Date(`${customRange?.to || '2026-10-31'}T00:00:00Z`);
  const dateLabel = (date) => new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
  if (customDays === 1) {
    const row = baseline.at(-1);
    return [{
      ...row,
      name: dateLabel(start),
      visualizaciones: Math.round(row.visualizaciones / 30),
      interacciones: Math.round(row.interacciones / 30),
    }];
  }
  return baseline.map((row, index) => {
    const date = new Date(start.getTime() + (end.getTime() - start.getTime()) * index / Math.max(1, baseline.length - 1));
    return { ...row, name: dateLabel(date), visualizaciones: Math.round(row.visualizaciones * scale), interacciones: Math.round(row.interacciones * scale) };
  });
}

export const metricCards = [
  { key: 'followers', label: 'Seguidores totales', icon: 'users', format: 'compact', hint: 'En todos tus canales' },
  { key: 'views', label: 'Visualizaciones', icon: 'eye', format: 'compact', hint: 'Reproducciones totales' },
  { key: 'reach', label: 'Alcance', icon: 'radio', format: 'compact', hint: 'Personas alcanzadas' },
  { key: 'interactions', label: 'Interacciones', icon: 'heart', format: 'compact', hint: 'Me gusta, comentarios y más' },
  { key: 'engagement', label: 'Engagement', icon: 'sparkles', format: 'percent', hint: 'Tasa promedio' },
  { key: 'visits', label: 'Visitas al perfil', icon: 'mouse', format: 'compact', hint: 'Visitas a tus perfiles' },
];

const captions = [
  'Pequeños momentos, grandes historias ✨', 'Una nueva forma de ver lo cotidiano.', 'Detrás de cada detalle hay una historia.',
  'Inspiración para todos los días ☀️', 'Lo que nos mueve, nos conecta.', 'Diseñado para acompañarte siempre.',
];
const metrics = [
  { views: 18400, likes: 2180, comments: 86, shares: 143, channel: 'instagram' },
  { views: 42600, likes: 3870, comments: 143, shares: 612, channel: 'tiktok' },
  { views: 12800, likes: 940, comments: 54, shares: 118, channel: 'facebook' },
  { views: 31700, likes: 2630, comments: 98, shares: 376, channel: 'instagram' },
  { views: 96800, likes: 8240, comments: 304, shares: 1280, channel: 'tiktok' },
  { views: 21900, likes: 1740, comments: 71, shares: 229, channel: 'facebook' },
];
export const posts = captions.map((caption, index) => ({
  id: `post-${index + 1}`, caption, image: `/mock/posts/post-0${index + 1}.svg`,
  date: ['Hoy, 10:42', 'Ayer, 18:20', '28 oct, 12:15', '26 oct, 09:34', '24 oct, 19:10', '22 oct, 11:05'][index],
  ...metrics[index],
}));

export const activities = [
  { id: 1, title: 'Nuevo máximo de visualizaciones', detail: 'TikTok · Video “Un día con nosotros”', time: 'Hace 28 min', type: 'up' },
  { id: 2, title: 'Tu comunidad creció', detail: 'Instagram · +482 seguidores esta semana', time: 'Hace 2 h', type: 'user' },
  { id: 3, title: 'Publicación con alto engagement', detail: 'Facebook · 8.4% de interacción', time: 'Ayer', type: 'heart' },
];

export const aiInsights = [
  { id: 1, type: 'oportunidad', title: 'El video corto impulsa tu crecimiento', text: 'Tus videos en TikTok generaron 2.4× más interacciones que el promedio de los otros canales durante este período.', tag: 'TikTok', change: '+24%' },
  { id: 2, type: 'contenido', title: 'Tu audiencia está más activa por la tarde', text: 'Las publicaciones compartidas entre las 17:00 y las 20:00 alcanzaron más personas. Considera probar ese horario esta semana.', tag: 'Todos los canales', change: '17:00 — 20:00' },
  { id: 3, type: 'tendencia', title: 'Los carruseles generan más guardados', text: 'El formato carrusel obtuvo 38% más interacciones guardadas que las imágenes individuales en Instagram.', tag: 'Instagram', change: '+38%' },
];

export const connections = [
  { id: 'facebook', name: 'Facebook', description: 'Páginas, publicaciones y estadísticas de tu comunidad.', connected: true, lastSync: 'Hace 12 min', color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', description: 'Contenido, alcance e interacción de tu perfil profesional.', connected: true, lastSync: 'Hace 8 min', color: '#D946A8' },
  { id: 'tiktok', name: 'TikTok', description: 'Videos, crecimiento y rendimiento de tu perfil.', connected: true, lastSync: 'Hace 19 min', color: '#171717' },
  { id: 'whatsapp', name: 'WhatsApp', description: 'Mensajería y aprobaciones de tu equipo.', connected: false, lastSync: 'Nunca', color: '#20B56B' },
];

export const initialUsers = [
  { id: 1, name: 'Josseline Lemus', email: 'josseline@amorstudio.com', role: 'Administradora', status: 'Activo', joined: '12 feb, 2025', initials: 'JL', color: 'lavender' },
  { id: 2, name: 'Daniel Méndez', email: 'daniel@amorstudio.com', role: 'Editor', status: 'Activo', joined: '08 mar, 2025', initials: 'DM', color: 'peach' },
  { id: 3, name: 'Lucía Herrera', email: 'lucia@amorstudio.com', role: 'Analista', status: 'Activo', joined: '21 abr, 2025', initials: 'LH', color: 'mint' },
  { id: 4, name: 'Mateo Cruz', email: 'mateo@amorstudio.com', role: 'Viewer', status: 'Invitado', joined: '02 oct, 2025', initials: 'MC', color: 'blue' },
];

export const conversations = [
  { id: 1, name: 'Ana Martínez', initials: 'AM', preview: '¡Me encanta el nuevo producto!', time: '10:42', unread: 2, color: 'peach' },
  { id: 2, name: 'Carlos López', initials: 'CL', preview: '¿Cuándo vuelve a estar disponible?', time: '09:18', unread: 0, color: 'mint' },
  { id: 3, name: 'Valeria Ruiz', initials: 'VR', preview: 'Muchas gracias por la atención 🙌', time: 'Ayer', unread: 0, color: 'lavender' },
];

export const chatMessages = [
  { id: 1, side: 'them', text: 'Hola, vi su publicación y me gustaría saber más del producto. ¿Tienen más colores?', time: '10:36' },
  { id: 2, side: 'me', text: '¡Hola Ana! Claro que sí 😊 Tenemos varios colores disponibles. ¿Cuál te interesa?', time: '10:38' },
  { id: 3, side: 'them', text: 'El azul se ve increíble en la foto.', time: '10:40' },
  { id: 4, side: 'them', text: '¡Me encanta el nuevo producto!', time: '10:42' },
];
