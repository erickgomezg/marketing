import {
  LayoutDashboard, GitCompareArrows, FileBarChart2, Sparkles, MessageCircle, Share2, UsersRound, Settings2,
  Facebook, Instagram, Music2,
} from 'lucide-react';

export const primaryNavigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, exact: true },
  { label: 'Facebook', to: '/channels/facebook', icon: Facebook, channel: 'facebook' },
  { label: 'Instagram', to: '/channels/instagram', icon: Instagram, channel: 'instagram' },
  { label: 'TikTok', to: '/channels/tiktok', icon: Music2, channel: 'tiktok' },
  { label: 'Comparación', to: '/comparison', icon: GitCompareArrows },
  { label: 'Reportes', to: '/reports', icon: FileBarChart2 },
  { label: 'Inteligencia Artificial', to: '/ai', icon: Sparkles },
  { label: 'WhatsApp', to: '/whatsapp', icon: MessageCircle },
  { label: 'Conexiones', to: '/connections', icon: Share2 },
  { label: 'Usuarios', to: '/users', icon: UsersRound },
  { label: 'Ajustes', to: '/settings', icon: Settings2 },
];

export const pageNames = {
  '/': 'Dashboard', '/comparison': 'Comparación de canales', '/reports': 'Reportes', '/ai': 'Inteligencia Artificial',
  '/whatsapp': 'WhatsApp', '/connections': 'Conexiones', '/users': 'Usuarios', '/settings': 'Ajustes',
  '/channels/facebook': 'Facebook', '/channels/instagram': 'Instagram', '/channels/tiktok': 'TikTok',
};
