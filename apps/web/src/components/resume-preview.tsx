import { Check, Lightbulb, Target } from 'lucide-react';
export function ResumePreview() {
  return (
    <div className="relative mx-auto max-w-xl">
      <div className="absolute -inset-8 -z-10 rounded-full bg-gradient-to-br from-indigo-300/35 to-violet-300/25 blur-3xl" />
      <div className="glass rounded-3xl p-3 shadow-2xl shadow-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-700">
          <div className="flex gap-1.5">
            <i className="size-2.5 rounded-full bg-rose-400" />
            <i className="size-2.5 rounded-full bg-amber-400" />
            <i className="size-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-slate-500">Modern template</span>
        </div>
        <div className="grid gap-3 p-3 sm:grid-cols-[1fr_150px]">
          <article className="min-h-96 rounded-lg bg-white p-6 text-slate-800 shadow-sm">
            <div className="border-b-2 border-indigo-500 pb-4">
              <h3 className="text-xl font-black">Maya Sharma</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                Product Designer
              </p>
              <p className="mt-2 text-[7px] text-slate-500">
                Bengaluru · maya@example.com · portfolio.dev
              </p>
            </div>
            <ResumeBlock title="Profile" lines={[90, 75]} />
            <ResumeBlock title="Experience" lines={[95, 88, 70]} />
            <ResumeBlock title="Skills" lines={[85, 63]} />
          </article>
          <aside className="space-y-3">
            <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-950/40">
              <div className="mx-auto grid size-20 place-items-center rounded-full border-[7px] border-emerald-500 text-xl font-black text-emerald-700 dark:text-emerald-300">
                86<span className="text-[9px]">/100</span>
              </div>
              <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Strong ATS score
              </p>
            </div>
            <Tip
              icon={<Target size={14} />}
              title="3 keywords missing"
              text="Roadmapping, SQL, B2B"
            />
            <Tip
              icon={<Lightbulb size={14} />}
              title="Quick improvement"
              text="Quantify your latest impact"
            />
            <Tip icon={<Check size={14} />} title="Formatting" text="Clean and ATS-readable" />
          </aside>
        </div>
      </div>
    </div>
  );
}
function ResumeBlock({ title, lines }: { title: string; lines: number[] }) {
  return (
    <section className="mt-5">
      <h4 className="mb-2 text-[8px] font-black uppercase tracking-widest text-indigo-600">
        {title}
      </h4>
      {lines.map((w, i) => (
        <div
          key={i}
          className="mb-1.5 h-1.5 rounded-full bg-slate-200"
          style={{ width: `${w}%` }}
        />
      ))}
    </section>
  );
}
function Tip({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-left dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800 dark:text-slate-100">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{text}</p>
    </div>
  );
}
