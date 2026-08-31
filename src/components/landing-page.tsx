import Link from 'next/link';
import type { CSSProperties } from 'react';

const sections = [
  {
    title: 'API',
    href: '/api',
    description: 'REST endpoints, authentication, and rate limits.',
    tag: 'Reference',
  },
  {
    title: 'SDK',
    href: '/sdk',
    description: 'Client libraries, install guides, and quickstarts.',
    tag: 'Guides',
  },
  {
    title: 'OWM',
    href: '/owm',
    description: 'Open weight models, including Anxious Model 0.5.',
    tag: 'Models',
  },
  {
    title: 'Research',
    href: '/research',
    description: 'Papers, evals, and experimental notes.',
    tag: 'Notes',
  },
] as const;

export function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-ambient" aria-hidden="true" />

      <section className="landing-hero">
        <p className="landing-kicker">Documentation</p>
        <h1 className="landing-brand">Harc</h1>
        <p className="landing-lede">
          Hierarchical docs for models, SDKs, and APIs — edited in the admin
          panel, served from the root.
        </p>

        <div className="landing-actions">
          <Link href="/owm" className="landing-cta">
            Show docs
          </Link>
          <Link href="/sdk" className="landing-cta-ghost">
            Explore SDK
          </Link>
        </div>
      </section>

      <section className="landing-sections" aria-labelledby="landing-sections-title">
        <div className="landing-sections-head">
          <p className="landing-section-eyebrow">Sections</p>
          <h2 id="landing-sections-title">Browse by section</h2>
          <p>Jump into the guides most teams start with.</p>
        </div>

        <ul className="landing-section-list">
          {sections.map((section, index) => (
            <li
              key={section.href}
              className="landing-section-item"
              style={{ '--index': index } as CSSProperties}
            >
              <Link href={section.href} className="landing-section-link">
                <span className="landing-section-tag">{section.tag}</span>
                <span className="landing-section-title">{section.title}</span>
                <span className="landing-section-desc">{section.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="landing-footer">
        <p>
          Open <code>/admin</code> to edit pages. Content lives under{' '}
          <code>content/docs</code>.
        </p>
      </footer>
    </div>
  );
}
