import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 font-black tracking-tight text-slate-950 dark:text-white"
      aria-label="ResuMind AI home"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
        <Sparkles size={18} />
      </span>
      <span>
        ResuMind <span className="text-indigo-600">AI</span>
      </span>
    </Link>
  );
}
