import { useEffect } from 'react';
import { Layers } from 'lucide-react';
import { OpenUSDCertificationCoach } from './components/OpenUSDCertificationCoach';

export default function OpenUSDApp() {
  useEffect(() => {
    document.title = 'OpenUSD Learning Journey';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 border-b border-cyan-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-950 text-white shadow-sm">
            <Layers size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-black tracking-tight text-gray-900 sm:text-lg">OpenUSD Playground</h1>
              <span className="hidden rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 sm:inline-flex">
                Beginner guide
              </span>
            </div>
            <p className="truncate text-xs font-medium text-gray-500">Visual lessons for Learn OpenUSD and certification prep.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <OpenUSDCertificationCoach />
      </main>
    </div>
  );
}
