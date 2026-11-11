const services = [
  { icon: 'community', title: <>Community<br />Management</> },
  { icon: 'campaign', title: <>Gestión de<br />Campañas</> },
  { icon: 'camera', title: <>Fotografía<br />Comercial</> },
  { icon: 'content', title: <>Creación de<br />Contenido</> },
  { icon: 'analytics', title: <>Análisis de<br />Mercado</> },
  { icon: 'target', title: <>Segmentación<br />de Clientes</> },
];

const packages = [
  {
    name: 'Plan Starter',
    subtitle: 'Ideal para emprendedores',
    icon: 'leaf',
    featured: false,
    items: [
      'Administración de una red social.',
      'Calendario de publicaciones.',
      'Diseño de contenido.',
      'Gestión básica de comunidad.',
      'Reporte mensual.',
    ],
  },
  {
    name: 'Plan Growth',
    subtitle: 'Para negocios en crecimiento',
    icon: 'growth',
    featured: false,
    items: [
      'Administración de Facebook e Instagram.',
      'Creación de contenido.',
      'Fotografía comercial.',
      'Gestión de campañas publicitarias.',
      'Segmentación de audiencias.',
      'Análisis de resultados.',
    ],
  },
  {
    name: 'Plan Premium',
    subtitle: 'Estrategia integral',
    icon: 'rocket',
    featured: true,
    items: [
      'Administración de múltiples redes.',
      'Estrategia de marketing mensual.',
      'Fotografía y contenido audiovisual.',
      'Campañas publicitarias.',
      'Análisis de competencia y mercado.',
      'Optimización de audiencias.',
      'Informes estratégicos y seguimiento.',
    ],
  },
];

function Brand({ footer = false }) {
  return (
    <a className={footer ? 'brand brand-footer' : 'brand'} href="#inicio" aria-label="JL Creative Studio, inicio">
      <span className="brand-monogram">JL<span>.</span></span>
      <span className="brand-name">Creative<br />Studio</span>
      <span className="brand-divider" />
      <span className="brand-specialty">Marketing Digital<br />&amp; Estrategia</span>
    </a>
  );
}

function ServiceIcon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.65, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    community: <><circle cx="12" cy="8" r="3.2" /><circle cx="5" cy="10" r="2.2" /><circle cx="19" cy="10" r="2.2" /><path d="M5 20v-1.5a7 7 0 0 1 14 0V20M1.5 19v-1a4 4 0 0 1 4-4M22.5 19v-1a4 4 0 0 0-4-4" /></>,
    campaign: <><path d="M3 10v4h4l11 5V5L7 10H3Z" /><path d="m7 14 2 6h4l-2.5-5.1M21 9l2-2M21 15l2 2" /></>,
    camera: <><path d="M3 8h4l2-3h6l2 3h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13.5" r="4" /></>,
    content: <><path d="M13 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="m10 14 9-9 3 3-9 9-4 1 1-4Z" /></>,
    analytics: <><path d="M3 20V11h4v9M10 20V5h4v15M17 20V2h4v18" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /><path d="m13 11 7-7M16 4h4v4" /></>,
    leaf: <><path d="M20 4C9 4 4 9 4 16a4 4 0 0 0 4 4c7 0 12-5 12-16Z" /><path d="M4 20 15 9" /></>,
    growth: <><path d="M3 20h18M5 17v-5h4v5M11 17V8h4v9M17 17V3h4v14" /></>,
    rocket: <><path d="M5 15c-2 1-3 3-3 6 3 0 5-1 6-3M8 13l4 4c4-2 8-7 9-15-8 1-13 5-15 9Z" /><circle cx="15" cy="9" r="2" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>{paths[name]}</svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L3 20l1.2-4.8a8.2 8.2 0 1 1 16-3.5Z" /><path d="M8.2 7.8c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.7c-.2.2-.2.4 0 .7.5.9 1.3 1.6 2.2 2.1.3.2.5.2.7-.1l.8-.9c.2-.2.4-.3.7-.2l1.7.8c.3.1.4.3.4.5 0 .3-.2 1.2-.8 1.6-.5.4-1.1.6-1.8.5-1.1-.2-2.5-.8-3.9-2.1-1.2-1.1-2.1-2.5-2.4-3.5-.3-.9 0-1.8.5-2.5Z" /></svg>;
}

export default function HomePage() {
  return (
    <main id="inicio">
      <header className="site-header">
        <Brand />
        <nav className="main-nav" aria-label="Navegación principal">
          <a className="active" href="#inicio">Inicio</a>
          <a href="#servicios">Servicios</a>
          <a href="#paquetes">Paquetes</a>
          <a href="#portafolio">Portafolio</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="header-whatsapp" href="https://wa.me/50238165229" target="_blank" rel="noreferrer"><WhatsAppIcon /><span>(502) 3816-5229</span></a>
      </header>

      <section className="hero">
        <div className="hero-photo" role="img" aria-label="Cámara profesional sobre un escritorio creativo" />
        <div className="hero-shade" />
        <div className="hero-rings"><i /><i /></div>
        <div className="hero-content">
          <p className="hero-kicker">CREATIVIDAD CON PROPÓSITO</p>
          <h1>Haz que tu negocio<br />destaque en el<br /><em>mundo digital</em></h1>
          <p className="hero-description">Te ayudo a construir, gestionar y hacer crecer tu presencia<br className="desktop-break" /> en línea con estrategia, creatividad y análisis de resultados.</p>
          <div className="hero-actions">
            <a className="pill pill-gold" href="#servicios">Conoce nuestros servicios <span>→</span></a>
            <a className="pill pill-outline" href="https://wa.me/50238165229" target="_blank" rel="noreferrer"><WhatsAppIcon /> ¡Hablemos!</a>
          </div>
        </div>
        <div className="hero-pagination"><span className="selected" /><span /><span /></div>
      </section>

      <section className="services-strip" id="servicios">
        <div className="services-heading">
          <p className="section-label">SERVICIOS</p>
          <h2>Soluciones para el<br />crecimiento de tu negocio</h2>
        </div>
        <div className="services-list">
          {services.map((service) => (
            <article className="service-item" key={service.icon}>
              <ServiceIcon name={service.icon} />
              <h3>{service.title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="packages-section" id="paquetes">
        <div className="packages-heading">
          <p className="section-label">PAQUETES</p>
          <h2>Planes pensados<br />para tu negocio</h2>
          <span className="heading-rule" />
        </div>
        <div className="package-grid">
          {packages.map((plan) => (
            <article className={plan.featured ? 'package-card package-featured' : 'package-card'} key={plan.name}>
              <div className="package-top">
                <ServiceIcon name={plan.icon} />
                <div><h3>{plan.name}</h3><p>{plan.subtitle}</p></div>
              </div>
              <ul>{plan.items.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="portfolio-section" id="portafolio">
        <div className="portfolio-heading">
          <p className="section-label">PORTAFOLIO</p>
          <h2>Conoce algunos<br />de nuestros trabajos</h2>
        </div>
        <div className="portfolio-gallery">
          <div className="portfolio-image food" role="img" aria-label="Fotografía gastronómica" />
          <div className="portfolio-image product" role="img" aria-label="Fotografía de producto" />
          <div className="portfolio-image architecture" role="img" aria-label="Fotografía de arquitectura" />
          <div className="portfolio-image coffee" role="img" aria-label="Fotografía de café" />
        </div>
        <a className="portfolio-link" href="https://www.instagram.com/_jlcreativestudio/" target="_blank" rel="noreferrer">Ver portafolio <span>→</span></a>
      </section>

      <section className="about-section" id="nosotros">
        <div><p className="section-label">NOSOTROS</p><h2>Ideas que cuentan<br />historias. Estrategias<br /><em>que generan resultados.</em></h2></div>
        <p>En JL Creative Studio combinamos creatividad, estrategia y análisis para ayudar a las marcas a construir una presencia digital auténtica y crecer con intención.</p>
      </section>

      <footer className="site-footer" id="contacto">
        <Brand footer />
        <div className="footer-message">¡Hablemos de tu proyecto!</div>
        <a className="footer-whatsapp" href="https://wa.me/50238165229" target="_blank" rel="noreferrer"><WhatsAppIcon /><span>(502) 3816-5229</span></a>
        <div className="social-links" aria-label="Redes sociales">
          <a href="https://www.instagram.com/_jlcreativestudio/" target="_blank" rel="noreferrer" aria-label="Instagram">◎</a>
          <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a>
          <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok">♪</a>
        </div>
      </footer>
    </main>
  );
}
