import { Link } from 'react-router-dom';
import { Logo } from '../components/logo';
const content = {
  privacy: [
    'Privacy Policy',
    'We collect only the account, resume, usage, and payment metadata needed to provide the service. Resumes are private by default. This initial policy is a product draft and must receive legal review before production launch.',
  ],
  terms: [
    'Terms and Conditions',
    'Use ResuMind AI lawfully and provide truthful resume information. ATS scores are estimates, not guarantees of employment. Production terms require legal review before launch.',
  ],
  refund: [
    'Refund Policy',
    'If a paid service cannot be delivered, contact support with your payment details. Eligibility and timelines will follow the final plan terms shown at checkout. This policy requires legal review before launch.',
  ],
} as const;
export function ContentPage({ kind }: { kind: keyof typeof content }) {
  const [title, body] = content[kind];
  return (
    <main className="min-h-screen">
      <header className="container-shell py-6">
        <Logo />
      </header>
      <article className="container-shell max-w-3xl py-20">
        <p className="text-sm font-bold text-indigo-600">LEGAL</p>
        <h1 className="mt-2 text-4xl font-black">{title}</h1>
        <p className="mt-8 leading-8 text-slate-600 dark:text-slate-300">{body}</p>
        <p className="mt-8 text-sm text-slate-500">Last updated: September 11, 2026</p>
        <Link className="mt-10 inline-block font-bold text-indigo-600" to="/">
          ← Return home
        </Link>
      </article>
    </main>
  );
}
export function Contact() {
  return (
    <main className="min-h-screen">
      <header className="container-shell py-6">
        <Logo />
      </header>
      <div className="container-shell grid max-w-4xl gap-10 py-20 md:grid-cols-2">
        <div>
          <p className="text-sm font-bold text-indigo-600">CONTACT</p>
          <h1 className="mt-2 text-4xl font-black">How can we help?</h1>
          <p className="mt-4 leading-7 text-slate-500">
            Send a message and the support team will respond when the contact service is enabled.
          </p>
        </div>
        <form className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
          <label className="block text-sm font-bold">
            Name
            <input className="input mt-2" />
          </label>
          <label className="mt-5 block text-sm font-bold">
            Email
            <input className="input mt-2" type="email" />
          </label>
          <label className="mt-5 block text-sm font-bold">
            Message
            <textarea className="input mt-2 min-h-32 resize-y" />
          </label>
          <button
            disabled
            className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white opacity-60"
          >
            Contact service coming soon
          </button>
        </form>
      </div>
    </main>
  );
}
