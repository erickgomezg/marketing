export default function HomePage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/" aria-label="JL Creative Studio, inicio">
          <span className="brand-mark">JL</span>
          <span>CREATIVE STUDIO</span>
        </a>
        <div className="nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#estudio">El estudio</a>
          <a className="nav-cta" href="#contacto">Hablemos <span aria-hidden="true">↗</span></a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> ESTRATEGIA · CREATIVIDAD · CRECIMIENTO</p>
          <h1>Ideas que conectan.<br /><em>Marcas que avanzan.</em></h1>
          <p className="hero-description">
            Impulsamos negocios a través de estrategia digital, comunicación
            creativa y experiencias que convierten ideas en oportunidades.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#contacto">Conversemos sobre tu proyecto <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="#servicios">Descubre lo que hacemos <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className="hero-art" aria-label="Composición gráfica abstracta de marca">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-core">JL<span>®</span></div>
          <div className="art-caption">CREATIVITY<br />WITH PURPOSE</div>
          <div className="art-index">01 / 03</div>
        </div>
      </section>

      <section className="intro" id="estudio">
        <p className="eyebrow">01 — EL ESTUDIO</p>
        <h2>Tu marca merece una estrategia tan <em>única</em> como su visión.</h2>
        <p>Unimos pensamiento estratégico y ejecución creativa para ayudarte a conectar con las personas correctas y hacer crecer tu negocio.</p>
      </section>

      <section className="services" id="servicios">
        <div className="section-heading">
          <div><p className="eyebrow">02 — LO QUE HACEMOS</p><h2>Creatividad con <em>dirección.</em></h2></div>
          <p>Soluciones pensadas para construir presencia, generar confianza y abrir nuevas oportunidades.</p>
        </div>
        <div className="service-grid">
          <article><span>01</span><h3>Estrategia digital</h3><p>Planificación, análisis y dirección para comunicar con intención.</p></article>
          <article><span>02</span><h3>Contenido & redes</h3><p>Ideas, fotografía y contenido que dan personalidad a tu marca.</p></article>
          <article><span>03</span><h3>Identidad & creatividad</h3><p>Conceptos visuales y mensajes coherentes con tu propuesta de valor.</p></article>
        </div>
      </section>

      <section className="contact" id="contacto">
        <p className="eyebrow">03 — EMPECEMOS</p>
        <h2>Hagamos algo <em>extraordinario.</em></h2>
        <p>Cuéntanos qué tienes en mente. Estamos listos para conocer tu proyecto.</p>
        <a className="button button-light" href="mailto:hola@jlcreativestudio.agency?subject=Quiero%20conversar%20sobre%20mi%20proyecto">Solicitar información <span aria-hidden="true">↗</span></a>
      </section>

      <footer className="footer">
        <a className="brand" href="/"><span className="brand-mark">JL</span><span>CREATIVE STUDIO</span></a>
        <p>© {new Date().getFullYear()} JL Creative Studio. Todos los derechos reservados.</p>
        <a href="#inicio" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Volver arriba ↑</a>
      </footer>
    </main>
  );
}
