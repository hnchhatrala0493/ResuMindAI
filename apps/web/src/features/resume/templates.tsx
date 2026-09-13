import { memo } from 'react';
import type { Resume } from '@resumind/shared';
export const templates = [
  ['modern-classic', 'Modern Classic'],
  ['professional', 'Professional'],
  ['minimal', 'Minimal'],
  ['technical', 'Technical'],
  ['executive-pro', 'Executive Pro'],
  ['modern-sidebar', 'Modern Sidebar'],
  ['creative-studio', 'Creative Studio'],
  ['elegant-serif', 'Elegant Serif'],
  ['product-leader', 'Product Leader'],
  ['developer-pro', 'Developer Pro'],
  ['international', 'International'],
  ['compact-pro', 'Compact Pro'],
] as const;
export const ResumeDocument = memo(function ResumeDocument({ resume }: { resume: Resume }) {
  const s = resume.styling ?? {
    pageSize: 'A4',
    layout: 'single-column',
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.45,
    sectionSpacing: 14,
    primaryColor: '#4f46e5',
    textColor: '#0f172a',
    pageMargin: 18,
    showProfileImage: false,
  };
  const personal = resume.personalDetails ?? { firstName: '', lastName: '', email: '' };
  const visible = <T extends { visible: boolean; order: number }>(x: T[] | undefined) =>
    [...(x ?? [])].filter((i) => i.visible).sort((a, b) => a.order - b.order);
  const rendererId = templates.some(([id]) => id === resume.templateId)
    ? resume.templateId
    : 'modern-classic';
  const sectionOrder = resume.sectionOrder ?? [];
  const rank = (key: (typeof sectionOrder)[number]) =>
    ({ order: Math.max(0, sectionOrder.indexOf(key)) }) as React.CSSProperties;
  return (
    <article
      aria-label={`Resume preview with explicit ${s.pageSize} page boundaries`}
      data-page-boundaries="visible"
      className={`resume-paper flex flex-col page-${s.pageSize.toLowerCase()} template-${rendererId} section-title-${s.sectionTitleStyle} ${s.layout === 'two-column' ? 'md:grid md:grid-cols-2 md:content-start md:gap-x-8' : ''}`}
      style={
        {
          '--accent': s.primaryColor,
          '--secondary': s.secondaryColor,
          '--text': s.textColor,
          '--heading': s.headingColor,
          '--space': `${s.sectionSpacing}px`,
          fontFamily: s.fontFamily,
          fontSize: `${s.fontSize}px`,
          lineHeight: s.lineHeight,
          padding: `${s.pageMargin}mm`,
          '--heading-size': `${s.headingSize}px`,
        } as React.CSSProperties
      }
    >
      <header style={rank('personalDetails')}>
        <h1>
          {personal.firstName} {personal.lastName}
        </h1>
        <strong>{personal.professionalTitle}</strong>
        <p>{[personal.email, personal.phone, personal.city].filter(Boolean).join(' · ')}</p>
      </header>
      {resume.professionalSummary && (
        <Section title="Profile" order={rank('professionalSummary')}>
          <p>{resume.professionalSummary}</p>
        </Section>
      )}
      <List
        title="Experience"
        order={rank('workExperience')}
        items={visible(resume.workExperience)}
        render={(x) => (
          <>
            <b>
              {x.jobTitle} — {x.company}
            </b>
            <p>{x.description}</p>
            <ul>
              {(x.achievements ?? []).map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </>
        )}
      />
      <List
        title="Education"
        order={rank('education')}
        items={visible(resume.education)}
        render={(x) => (
          <>
            <b>
              {x.degree}, {x.institution}
            </b>
            <p>{x.fieldOfStudy}</p>
          </>
        )}
      />
      <List
        title="Skills"
        order={rank('skills')}
        items={visible(resume.skills)}
        render={(x) => (
          <span>
            {x.name}
            {x.level ? ` — ${x.level}` : ''}
          </span>
        )}
      />
      <List
        title="Projects"
        order={rank('projects')}
        items={visible(resume.projects)}
        render={(x) => (
          <>
            <b>{x.name}</b>
            <p>{x.description}</p>
          </>
        )}
      />
      <List
        title="Certifications"
        order={rank('certifications')}
        items={visible(resume.certifications)}
        render={(x) => (
          <span>
            {x.name}
            {x.issuer ? ` — ${x.issuer}` : ''}
          </span>
        )}
      />
      <List
        title="Languages"
        order={rank('languages')}
        items={visible(resume.languages)}
        render={(x) => (
          <span>
            {x.name} {x.proficiency}
          </span>
        )}
      />
      <List
        title="Achievements"
        order={rank('achievements')}
        items={visible(resume.achievements)}
        render={(x) => (
          <>
            <b>{x.title}</b>
            <p>{x.description}</p>
          </>
        )}
      />
      <List
        title="Volunteer Experience"
        order={rank('volunteerExperience')}
        items={visible(resume.volunteerExperience)}
        render={(x) => (
          <>
            <b>
              {x.role} — {x.organization}
            </b>
            <p>{x.description}</p>
          </>
        )}
      />
      {visible(resume.customSections).map((x) => (
        <Section key={x.id} title={x.title} order={rank('customSections')}>
          <p>{x.content}</p>
          {x.items && (
            <ul>
              {x.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </Section>
      ))}
    </article>
  );
});
function Section({
  title,
  children,
  order,
}: {
  title: string;
  children: React.ReactNode;
  order?: React.CSSProperties;
}) {
  return (
    <section style={order}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function List<T>({
  title,
  items,
  render,
  order,
}: {
  title: string;
  items: T[];
  render: (x: T) => React.ReactNode;
  order?: React.CSSProperties;
}) {
  return items.length ? (
    <Section title={title} order={order}>
      {items.map((x, i) => (
        <div className="resume-item" key={(x as { id?: string }).id ?? i}>
          {render(x)}
        </div>
      ))}
    </Section>
  ) : null;
}
