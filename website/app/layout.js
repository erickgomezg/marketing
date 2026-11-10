import './globals.css';

export const metadata = {
  metadataBase: new URL('https://jlcreativestudio.agency'),
  title: {
    default: 'JL Creative Studio | Estrategia, creatividad y crecimiento',
    template: '%s | JL Creative Studio',
  },
  description:
    'Estudio creativo enfocado en estrategia digital, contenido y soluciones para impulsar marcas y negocios.',
  openGraph: {
    title: 'JL Creative Studio',
    description: 'Estrategia, creatividad y crecimiento para tu marca.',
    url: 'https://jlcreativestudio.agency',
    siteName: 'JL Creative Studio',
    locale: 'es_GT',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
