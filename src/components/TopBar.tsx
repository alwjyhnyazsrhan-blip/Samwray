import { Download } from 'lucide-react';

export type ActiveView = 'explorer' | 'config' | 'simulator' | 'github';

interface TopBarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onDownloadZip: () => void;
  isExporting: boolean;
}

const NAV_ITEMS: { id: ActiveView; label: string }[] = [
  { id: 'explorer', label: 'ملفات المشروع' },
  { id: 'config', label: 'تخصيص الإعدادات' },
  { id: 'simulator', label: 'محاكي التوقيت' },
  { id: 'github', label: 'بناء APK عبر GitHub' },
];

export function TopBar({
  activeView,
  onSelectView,
  onDownloadZip,
  isExporting,
}: TopBarProps) {
  return (
    <header className="border-b border-slate-800/90 bg-[#0E141D]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        <button
          type="button"
          onClick={() => onSelectView('explorer')}
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
        >
          ساموراي أوتو بيلدر
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`whitespace-nowrap shrink-0 py-1.5 transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  active
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'جاري التجهيز...' : 'تحميل المشروع (ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation strip */}
      <nav className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-slate-800/80 px-4 py-2 text-xs font-medium">
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                active
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
