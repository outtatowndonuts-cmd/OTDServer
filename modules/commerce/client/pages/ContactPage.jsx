import { useState, useEffect, useRef } from 'react';

function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState([]);
  const recaptchaRef = useRef(null);
  const widgetId = useRef(null);

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  const sitekey = document.querySelector('meta[name="recaptcha-sitekey"]')?.getAttribute('content') || '';
  const isKnownUser = document.querySelector('meta[name="is-known-user"]')?.getAttribute('content') === 'true';

  useEffect(() => {
    document.title = 'Contact — Outta Town Donuts';
  }, []);

  // Explicitly render the reCAPTCHA widget so it works reliably in an SPA
  useEffect(() => {
    if (!sitekey || !recaptchaRef.current) return;

    const renderWidget = () => {
      if (recaptchaRef.current && widgetId.current === null) {
        try {
          widgetId.current = grecaptcha.enterprise.render(recaptchaRef.current, {
            sitekey,
            theme: 'dark',
          });
        } catch {
          // Already rendered
        }
      }
    };

    const doRender = () => {
      if (typeof grecaptcha !== 'undefined' && grecaptcha.enterprise) {
        grecaptcha.enterprise.ready(renderWidget);
      }
    };

    if (typeof grecaptcha !== 'undefined' && grecaptcha.enterprise) {
      doRender();
    } else {
      // Script not loaded yet — load it with explicit render mode
      const SCRIPT_SRC = 'https://www.google.com/recaptcha/enterprise.js?render=explicit';
      if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
        const script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        script.onload = doRender;
        document.head.appendChild(script);
      } else {
        // Tag exists but hasn't fired onload yet — wait for it
        const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
        existing.addEventListener('load', doRender, { once: true });
      }
    }
  }, [sitekey]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate reCAPTCHA if widget was rendered
    if (sitekey && widgetId.current !== null) {
      const token = grecaptcha.enterprise.getResponse(widgetId.current);
      if (!token) {
        setErrors([{ msg: 'Please check the reCAPTCHA box before submitting.' }]);
        return;
      }
    }

    setErrors([]);
    setSubmitting(true);

    const body = { message };
    if (!isKnownUser) {
      body.name = name;
      body.email = email;
    }

    try {
      const res = await fetch('/shop/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || [{ msg: 'An error occurred. Please try again.' }]);
        if (widgetId.current !== null) grecaptcha.enterprise.reset(widgetId.current);
      } else {
        setSuccess(true);
        setName('');
        setEmail('');
        setMessage('');
        if (widgetId.current !== null) grecaptcha.enterprise.reset(widgetId.current);
      }
    } catch {
      setErrors([{ msg: 'An error occurred. Please try again.' }]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="otd-section">
      <div className="container">
        <div className="otd-contact">
          <h1>Contact Us</h1>
          <p>Got a question, special request, or just want to say hey? We&rsquo;d love to hear from you.</p>
          <hr className="otd-divider" />

          {success && <div className="otd-alert otd-alert-success">Your message has been sent. Thank you!</div>}

          {errors.length > 0 && (
            <div className="otd-alert otd-alert-error">
              {errors.map((err, i) => (
                <div key={i}>{err.msg}</div>
              ))}
            </div>
          )}

          <form id="contactForm" onSubmit={handleSubmit}>
            {!isKnownUser && (
              <>
                <div className="otd-form-group">
                  <label className="otd-label" htmlFor="name">
                    Name
                  </label>
                  <input id="name" className="otd-input" type="text" name="name" autoComplete="name" required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="otd-form-group">
                  <label className="otd-label" htmlFor="email">
                    Email
                  </label>
                  <input id="email" className="otd-input" type="email" name="email" autoComplete="email" required placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </>
            )}

            <div className="otd-form-group">
              <label className="otd-label" htmlFor="message">
                Message
              </label>
              <textarea id="message" className="otd-textarea" name="message" rows={6} required placeholder="What&#x2019;s on your mind?" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            {sitekey && (
              <div className="otd-form-group">
                <div ref={recaptchaRef} />
              </div>
            )}

            <div className="otd-form-group">
              <button className="otd-btn otd-btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>

          {/* Location info */}
          <div className="otd-mt-4" style={{ borderTop: '1px solid var(--otd-border)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Find Us</h3>
            <p className="otd-text-muted">We sell our donuts at the flea market in Woodbury, Tennessee. Swing by and grab some fresh.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
