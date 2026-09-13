import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@resumind/ui';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
const links = [
  ['Templates', '#templates'],
  ['Features', '#features'],
  ['ATS Checker', '#ats'],
  ['Pricing', '#pricing'],
];
export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
      <div className="container-shell flex h-18 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {links.map(([label, to]) => (
            <a
              key={label}
              href={to}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Build my resume</Link>
          </Button>
        </div>
        <button
          className="grid size-10 place-items-center md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="container-shell grid gap-2 pb-5 md:hidden" aria-label="Mobile">
          {links.map(([label, to]) => (
            <a
              key={label}
              href={to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 font-medium"
            >
              {label}
            </a>
          ))}
          <Link to="/login" className="rounded-lg px-3 py-2 font-medium">
            Log in
          </Link>
          <Button asChild>
            <Link to="/register">Build my resume</Link>
          </Button>
        </nav>
      )}
    </header>
  );
}
