import { useEffect } from 'react';
import { BookOpen, ExternalLink, GraduationCap, Layers, Sparkles } from 'lucide-react';
import { OpenUSDCertificationCoach } from './components/OpenUSDCertificationCoach';
import { certificationUrl, learnOpenUSDRepoUrl, learnOpenUSDSourceUrl } from './data/openusdCertification';

export default function OpenUSDApp() {
  useEffect(() => {
    document.title = 'OpenUSD Playground';
  }, []);

  return (
    <div className="min-h-screen bg-cyan-50/50 text-gray-900">
      <header className="sticky top-0 z-30 border-b border-cyan-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-950 text-white shadow-sm">
            <Layers size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-black tracking-tight text-gray-900 sm:text-lg">OpenUSD Playground</h1>
              <span className="hidden rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 sm:inline-flex">
                Learn by building
              </span>
            </div>
            <p className="truncate text-xs font-medium text-gray-500">Tiny worlds, simple words, certification-ready concepts.</p>
          </div>

          <nav className="ml-auto hidden items-center gap-2 md:flex">
            <a
              href={learnOpenUSDSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <BookOpen size={14} /> Learn OpenUSD
            </a>
            <a
              href={certificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <GraduationCap size={14} /> Certification
            </a>
            <a
              href={learnOpenUSDRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-950 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800"
            >
              Contribute <ExternalLink size={13} />
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="mb-5 overflow-hidden rounded-lg border border-cyan-200 bg-white">
          <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_340px] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-700">
                <Sparkles size={14} /> Standalone app
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">
                OpenUSD should feel like building with blocks.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base">
                First, play with a tiny scene. Tap buttons to add a toy, paint it, move it, light it, and try a different version. Then use the roadmap and practice questions when you are ready to study.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-950 p-4 text-white">
              <p className="text-xs font-black uppercase tracking-wide text-cyan-300">What this teaches</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {['Stage', 'Prim', 'Layer', 'Attribute', 'Variant', 'Compose'].map(item => (
                  <div key={item} className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-black">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <OpenUSDCertificationCoach />
      </main>
    </div>
  );
}
