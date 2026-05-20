import { useEffect } from 'react';

function AboutPage() {
  useEffect(() => {
    document.title = 'About Us — Outta Town Donuts';
  }, []);

  return (
    <>
      {/* Intro */}
      <div className="otd-about-intro">
        <h1>About Us</h1>
        <hr className="otd-divider" />
        <p>Outta Town Donuts is a small, independent donut operation based in Woodbury, Tennessee. Every donut is hand-shaped, individually weighed, and made fresh each morning using high-quality, locally sourced ingredients whenever possible.</p>
      </div>

      {/* Story Section */}
      <div className="otd-section otd-section-alt">
        <div className="container">
          <div className="otd-section-header">
            <h2>Our Story</h2>
            <hr className="otd-divider" />
          </div>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <p style={{ color: 'var(--otd-cream-dark)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                We started making donuts the way most good things start &mdash; by just doing it. No business plan written in a co-working space. No branding agency. Just a kitchen, some flour, and the belief that you can still make something real without asking permission.
              </p>
              <p style={{ color: 'var(--otd-cream-dark)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                Every morning, we weigh, shape, and finish each donut by hand. No molds, no stamping machines, no mass production. The result is something slightly imperfect and entirely intentional. Each one weighing between 70 and 80 grams &mdash; enough structure to do it right, enough freedom to
                keep it real.
              </p>
              <p style={{ color: 'var(--otd-cream-dark)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                We sell directly through our local flea market booth in Woodbury, packaging each order by hand. What you&rsquo;re buying hasn&rsquo;t traveled far, and it hasn&rsquo;t been abstracted into a system you can&rsquo;t see.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote */}
      <div className="otd-section">
        <div className="container">
          <div className="col-lg-8 mx-auto">
            <div className="otd-quote">We make donuts by hand every morning. No molds. No shortcuts. Just enough structure to do it right, and enough freedom to keep it real.</div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="otd-section otd-section-alt">
        <div className="container">
          <div className="otd-section-header">
            <h2>What We Stand For</h2>
            <hr className="otd-divider" />
          </div>
          <div className="otd-values">
            <div className="otd-value-item">
              <h3>Handcrafted</h3>
              <p>Individually shaped, not stamped. Every donut shows the hand that made it. Visible human variation isn&rsquo;t a flaw &mdash; it&rsquo;s the whole point.</p>
            </div>
            <div className="otd-value-item">
              <h3>Local</h3>
              <p>Ingredients sourced locally when possible. Made in a cottage kitchen. Sold face-to-face at the booth. No abstraction layer between us and you.</p>
            </div>
            <div className="otd-value-item">
              <h3>Honest</h3>
              <p>We show our real process, in our real workspace. Nothing staged, nothing polished beyond what it actually is.</p>
            </div>
            <div className="otd-value-item">
              <h3>Independent</h3>
              <p>This isn&rsquo;t a franchise. It&rsquo;s not optimized for scale. It&rsquo;s a quiet proof that alternatives work &mdash; that you can still make things locally, by people who are actually there.</p>
            </div>
          </div>
        </div>
      </div>

      {/* NWA Connection */}
      <div className="otd-section">
        <div className="container">
          <div className="col-lg-8 mx-auto otd-text-center">
            <h2>Part of Something Bigger</h2>
            <hr className="otd-divider" />
            <p
              style={{
                color: 'var(--otd-cream-dark)',
                lineHeight: 1.8,
                fontSize: '1.05rem',
                maxWidth: 600,
                margin: '0 auto',
              }}
            >
              Outta Town Donuts is part of New Weird America, a broader effort to build practical, sustainable systems at the community level. This isn&rsquo;t just about donuts &mdash; it&rsquo;s about showing what&rsquo;s possible when things are made locally, by people who choose to participate
              instead of outsource.
            </p>
            <p className="otd-mt-2" style={{ color: 'var(--otd-text-muted)', fontStyle: 'italic' }}>
              It&rsquo;s not a protest. It&rsquo;s just proof.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="otd-section otd-section-alt">
        <div className="container otd-text-center">
          <h2>Ready to Try?</h2>
          <hr className="otd-divider" />
          <p className="otd-text-muted" style={{ maxWidth: 400, margin: '0 auto 1.5rem' }}>
            Available until sold out. Made fresh every morning.
          </p>
          <a className="otd-btn otd-btn-primary otd-btn-large" href="/shop/pickup">
            Order for Pickup
          </a>
        </div>
      </div>
    </>
  );
}

export default AboutPage;
