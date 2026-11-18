import { useMemo, useState } from 'react';
import { Check, Copy, FileCode2, Search } from 'lucide-react';
import { AndroidFile, FileCategory } from '../types/androidProject';

interface CodeExplorerViewProps {
  files: AndroidFile[];
  onGoToConfig: () => void;
}

const CATEGORY_FILTERS: { id: 'all' | FileCategory; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'gradle', label: 'Gradle' },
  { id: 'github', label: 'GitHub Actions' },
  { id: 'manifest', label: 'Manifest' },
  { id: 'resources', label: 'XML الموارد' },
];

export function CodeExplorerView({ files, onGoToConfig }: CodeExplorerViewProps) {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | FileCategory>('all');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return files.filter((file) => {
      const matchesCat = categoryFilter === 'all' || file.category === categoryFilter;
      const matchesQuery =
        !q ||
        file.path.toLowerCase().includes(q) ||
        file.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [files, searchQuery, categoryFilter]);

  const activeFile = useMemo(() => {
    return (
      filteredFiles.find((f) => f.path === selectedPath) ||
      files.find((f) => f.path === selectedPath) ||
      filteredFiles[0] ||
      files[0]
    );
  }, [files, filteredFiles, selectedPath]);

  const lines = useMemo(() => {
    return activeFile ? activeFile.content.split('\n') : [];
  }, [activeFile]);

  const handleCopy = async () => {
    if (!activeFile) return;
    await navigator.clipboard.writeText(activeFile.content);
    setCopiedPath(activeFile.path);
    setTimeout(() => setCopiedPath(null), 1800);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6">
      {/* Intro summary header */}
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-800/80 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            مستعرض الكود المصدري لمشروع الأندرويد
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{files.length} ملفاً جاهزاً للبناء</span>
            <span aria-hidden="true">·</span>
            <span>Kotlin 2.0.21</span>
            <span aria-hidden="true">·</span>
            <span>Jetpack Compose Material 3</span>
            <span aria-hidden="true">·</span>
            <span>Target SDK 35</span>
            <span aria-hidden="true">·</span>
            <span>Gradle 8.10.2</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onGoToConfig}
          className="self-start rounded-lg border border-slate-700 bg-[#131A24] px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-amber-500/60 hover:text-amber-300 whitespace-nowrap shrink-0"
        >
          تخصيص التوقيت والـ API قبل التحميل
        </button>
      </div>

      {/* Category filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-lg bg-[#111722] p-1 border border-slate-800/90 w-fit">
        {CATEGORY_FILTERS.map((cat) => {
          const isActive = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Two-pane workspace: File tree + Code viewer */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        {/* File Tree Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col rounded-xl border border-slate-800 bg-[#111722] overflow-hidden">
          <div className="border-b border-slate-800 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن ملف..."
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] py-2 pr-9 pl-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-800/50">
            {filteredFiles.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                لا توجد ملفات مطابقة لنتيجة البحث.
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = activeFile?.path === file.path;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedPath(file.path)}
                    className={`flex w-full items-start gap-2.5 px-3.5 py-2.5 text-right transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <FileCode2
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        isSelected ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        dir="ltr"
                        className="truncate text-left font-mono text-xs font-medium"
                      >
                        {file.name}
                      </div>
                      <div
                        dir="ltr"
                        className="truncate text-left font-mono text-[11px] text-slate-500"
                      >
                        {file.path}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Code Viewport */}
        <section className="lg:col-span-8 xl:col-span-9 flex flex-col rounded-xl border border-slate-800 bg-[#111722] overflow-hidden">
          {activeFile ? (
            <>
              <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div
                    dir="ltr"
                    className="truncate text-left font-mono text-sm font-semibold text-slate-100"
                  >
                    {activeFile.path}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {activeFile.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {lines.length} سطر
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0B0F14] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 whitespace-nowrap shrink-0"
                  >
                    {copiedPath === activeFile.path ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>نسخ الكود</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div
                dir="ltr"
                className="max-h-[640px] flex-1 overflow-auto bg-[#0B0F14] p-4 font-mono text-xs leading-6 text-slate-200"
              >
                <table className="w-full border-collapse">
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index} className="hover:bg-slate-800/30">
                        <td className="w-10 select-none pr-4 text-right text-slate-600 tabular-nums align-top">
                          {index + 1}
                        </td>
                        <td className="whitespace-pre text-slate-200">{line || ' '}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
