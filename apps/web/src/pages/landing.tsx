import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Check,
  FileCheck2,
  Gauge,
  LayoutTemplate,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@resumind/ui';
import { Header } from '../components/header';
import { Logo } from '../components/logo';
import { ResumePreview } from '../components/resume-preview';
const features = [
  {
    icon: Bot,
    title: 'AI resume writer',
    text: 'Turn your experience into clear, credible achievements while staying in control of every edit.',
  },
  {
    icon: Gauge,
    title: 'Explainable ATS feedback',
    text: 'See what helps your score, what hurts it, and which change will make the greatest difference.',
  },
  {
    icon: LayoutTemplate,
    title: 'Real-time preview',
    text: 'Shape your content and design side by side, with clean layouts made for recruiters and ATS tools.',
  },
];
const faqs = [
  [
    'Is the ATS score official?',
    'No. It is an explainable internal estimate based on common parsing and hiring criteria.',
  ],
  [
    'Will AI overwrite my resume?',
    'Never. Suggestions stay separate until you explicitly accept them.',
  ],
  [
    'Can I download without a watermark?',
    'Yes. The Free plan includes watermark-free basic PDF export.',
  ],
  [
    'Is my resume private?',
    'Resumes are private by default. Sharing is opt-in and can be disabled or expired.',
  ],
];
export function Landing() {
  return (
    <div className="min-h-screen bg-[var(--page)]">
      <Header />
      <main>
        <section className="overflow-hidden py-20 lg:py-28">
          <div className="container-shell grid items-center gap-16 lg:grid-cols-[.9fr_1.1fr]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                <Sparkles size={14} /> Your smarter path to the shortlist
              </span>
              <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-6xl dark:text-white">
                Build a Resume That <span className="gradient-text">Gets You Hired</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Create a professional resume in minutes with the power of AI. Get ATS-optimized
                content, real-time feedback, and a higher chance of landing your dream job.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/register">
                    Build my resume <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <a href="#how">See how it works</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-500">
                {['No credit card', 'Private by default', 'You approve every AI edit'].map((x) => (
                  <span className="flex items-center gap-1.5" key={x}>
                    <Check size={16} className="text-emerald-500" />
                    {x}
                  </span>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <ResumePreview />
            </motion.div>
          </div>
        </section>
        <section className="border-y border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
          <div className="container-shell grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {[
              ['10 min', 'to a polished first draft'],
              ['6', 'original ATS-ready templates'],
              ['100%', 'review before applying AI'],
              ['24/7', 'resume workspace access'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-2xl font-black text-slate-950 dark:text-white">{n}</div>
                <div className="text-xs text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        </section>
        <section id="features" className="py-24">
          <SectionTitle
            eyebrow="Work smarter"
            title="Everything you need to make every word count"
          />
          <div className="container-shell mt-12 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="glass rounded-3xl p-7">
                <span className="grid size-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  <Icon />
                </span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="ats" className="bg-slate-950 py-24 text-white">
          <div className="container-shell grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-300">
                From vague to valuable
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">
                Feedback you can actually act on.
              </h2>
              <p className="mt-5 leading-7 text-slate-300">
                Every recommendation explains the problem, why it matters, and the likely score
                impact—without keyword stuffing or inventing experience.
              </p>
            </div>
            <div className="space-y-3">
              <Compare bad>Responsible for improving onboarding</Compare>
              <Compare>
                Reduced new-user setup time by 32% by redesigning the onboarding flow
              </Compare>
            </div>
          </div>
        </section>
        <section id="how" className="py-24">
          <SectionTitle eyebrow="Simple process" title="A stronger resume in three focused steps" />
          <div className="container-shell mt-12 grid gap-6 md:grid-cols-3">
            {[
              ['01', 'Add your story', 'Start fresh or bring your existing experience.'],
              ['02', 'Improve with evidence', 'Review targeted AI and ATS recommendations.'],
              ['03', 'Tailor and export', 'Match a role, choose a template, and download.'],
            ].map(([n, t, d]) => (
              <div
                key={n}
                className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="text-sm font-black text-indigo-600">{n}</span>
                <h3 className="mt-8 text-xl font-bold">{t}</h3>
                <p className="mt-2 text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        </section>
        <section id="templates" className="bg-white py-24 dark:bg-slate-950">
          <SectionTitle
            eyebrow="Original templates"
            title="Designed to read beautifully—by people and software"
          />
          <div className="container-shell mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {['Modern', 'Professional', 'Minimal', 'Executive', 'Creative', 'Technical'].map(
              (x, i) => (
                <div
                  key={x}
                  className="group rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div
                    className={`aspect-[.707] rounded-lg ${['bg-indigo-50', 'bg-slate-100', 'bg-stone-50', 'bg-blue-50', 'bg-violet-50', 'bg-cyan-50'][i]} p-3`}
                  >
                    <div className="h-2 w-1/2 rounded bg-slate-700" />
                    <div className="mt-3 h-px bg-indigo-400" />
                    <div className="mt-3 space-y-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className="h-1 rounded bg-slate-300"
                          style={{ width: `${100 - n * 7}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-center text-sm font-bold">{x}</p>
                </div>
              ),
            )}
          </div>
        </section>
        <section id="pricing" className="py-24">
          <SectionTitle
            eyebrow="Straightforward pricing"
            title="Start free. Upgrade when your job search does."
          />
          <div className="container-shell mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <Price
              name="Free"
              price="₹0"
              items={[
                '2 active resumes',
                'Basic ATS analysis',
                'Limited monthly AI credits',
                'Basic PDF exports',
              ]}
            />
            <Price
              featured
              name="Pro"
              price="₹499"
              items={[
                'Unlimited active resumes*',
                'Advanced ATS and job matching',
                'All premium templates',
                'Version history and sharing',
              ]}
            />
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            *Subject to fair-use limits. Final billing terms are shown before purchase.
          </p>
        </section>
        <section className="bg-white py-24 dark:bg-slate-950">
          <SectionTitle eyebrow="Questions, answered" title="Know what to expect" />
          <div className="container-shell mt-10 max-w-3xl divide-y divide-slate-200 dark:divide-slate-800">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="cursor-pointer list-none font-bold">
                  {q}
                  <span className="float-right text-indigo-500 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-7 text-slate-500">{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="py-24">
          <div className="container-shell rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-16 text-center text-white shadow-2xl shadow-indigo-600/20">
            <WandSparkles className="mx-auto" />
            <h2 className="mt-4 text-4xl font-black">Your best work deserves a better resume.</h2>
            <p className="mx-auto mt-4 max-w-xl text-indigo-100">
              Build a focused, honest, recruiter-ready story with ResuMind AI.
            </p>
            <Button asChild size="lg" className="mt-8 bg-white text-indigo-700 hover:bg-indigo-50">
              <Link to="/register">Create my resume</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="container-shell text-center">
      <p className="text-sm font-black uppercase tracking-widest text-indigo-600">{eyebrow}</p>
      <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 dark:text-white">
        {title}
      </h2>
    </div>
  );
}
function Compare({ bad, children }: { bad?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${bad ? 'border-rose-900 bg-rose-950/30 text-slate-400 line-through' : 'border-emerald-700 bg-emerald-950/40'}`}
    >
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
        {bad ? <FileCheck2 size={16} /> : <Check size={16} />} {bad ? 'Before' : 'After'}
      </span>
      {children}
    </div>
  );
}
function Price({
  name,
  price,
  items,
  featured,
}: {
  name: string;
  price: string;
  items: string[];
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-8 ${featured ? 'border-indigo-500 bg-slate-950 text-white shadow-xl' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
    >
      <p className="font-bold">{name}</p>
      <p className="mt-4 text-4xl font-black">
        {price}
        <span className="text-sm font-normal text-slate-500">/month</span>
      </p>
      <ul className="my-8 space-y-3">
        {items.map((x) => (
          <li className="flex gap-2 text-sm" key={x}>
            <Check size={18} className="text-emerald-500" />
            {x}
          </li>
        ))}
      </ul>
      <Button asChild className="w-full" variant={featured ? 'primary' : 'secondary'}>
        <Link to="/register">Get started</Link>
      </Button>
    </article>
  );
}
function Footer() {
  return (
    <footer className="border-t border-slate-200 py-12 dark:border-slate-800">
      <div className="container-shell flex flex-col justify-between gap-8 md:flex-row">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            Thoughtful tools for honest, effective resumes.
          </p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-slate-500" aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/refund-policy">Refund policy</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
      <p className="container-shell mt-8 text-xs text-slate-400">
        © 2026 ResuMind AI. All rights reserved.
      </p>
    </footer>
  );
}
