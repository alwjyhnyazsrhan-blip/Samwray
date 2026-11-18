import { RotateCcw } from 'lucide-react';
import {
  DEFAULT_PROJECT_CONFIG,
  ExecutionMode,
  ProjectConfig,
} from '../types/androidProject';

interface ConfiguratorViewProps {
  config: ProjectConfig;
  onChange: (next: ProjectConfig) => void;
  onReset: () => void;
  onPreviewCode: () => void;
}

const EXECUTION_MODES: { value: ExecutionMode; title: string; desc: string }[] = [
  {
    value: 'HYBRID',
    title: 'الوضع المزدوج (واجهة + API)',
    desc: 'يشغّل مراقبة زر الواجهة عبر Accessibility بالتوازي مع إرسال دفعات طلبات HTTP في نفس اللحظة.',
  },
  {
    value: 'ACCESSIBILITY_ONLY',
    title: 'التفاعل مع الواجهة فقط (Accessibility)',
    desc: 'يفتح تطبيق ساموراي ويضغط على زر الحجز تلقائياً عبر شجرة العناصر أو الإحداثيات.',
  },
  {
    value: 'API_ONLY',
    title: 'طلبات الشبكة المباشرة (API Burst)',
    desc: 'يسخن اتصال TLS مسبقاً ويرسل طلب الحجز مباشرة دون الحاجة لفتح شاشة التطبيق.',
  },
];

export function ConfiguratorView({
  config,
  onChange,
  onReset,
  onPreviewCode,
}: ConfiguratorViewProps) {
  const update = <K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-800/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            تخصيص إعدادات التطبيق المصدري
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            كل تعديل هنا يتم دمجه مباشرة داخل ملفات <span dir="ltr" className="font-mono text-slate-300">AppConfig.kt</span> و{' '}
            <span dir="ltr" className="font-mono text-slate-300">AndroidManifest.xml</span> و{' '}
            <span dir="ltr" className="font-mono text-slate-300">build.gradle.kts</span> قبل تنزيل ملف الـ ZIP.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#111722] px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>استعادة الافتراضي</span>
          </button>
          <button
            type="button"
            onClick={onPreviewCode}
            className="rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            معاينة الكود المحدّث
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Identity & Timing */}
        <section className="rounded-xl border border-slate-800 bg-[#111722] p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-100">
            01. الهوية والتوقيت الدقيق
          </h2>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              اسم التطبيق على الهاتف
            </label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) => update('appName', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                معرّف الحزمة (Application ID)
              </label>
              <input
                type="text"
                dir="ltr"
                value={config.packageName}
                onChange={(e) => update('packageName', e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                حزمة تطبيق ساموراي المستهدف
              </label>
              <input
                type="text"
                dir="ltr"
                value={config.targetAppPackage}
                onChange={(e) => update('targetAppPackage', e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                الساعة (0-23)
              </label>
              <input
                type="number"
                min={0}
                max={23}
                dir="ltr"
                value={config.targetHour}
                onChange={(e) =>
                  update('targetHour', Math.min(23, Math.max(0, Number(e.target.value) || 0)))
                }
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-sm text-slate-100 tabular-nums focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                الدقيقة
              </label>
              <input
                type="number"
                min={0}
                max={59}
                dir="ltr"
                value={config.targetMinute}
                onChange={(e) =>
                  update('targetMinute', Math.min(59, Math.max(0, Number(e.target.value) || 0)))
                }
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-sm text-slate-100 tabular-nums focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                الثانية
              </label>
              <input
                type="number"
                min={0}
                max={59}
                dir="ltr"
                value={config.targetSecond}
                onChange={(e) =>
                  update('targetSecond', Math.min(59, Math.max(0, Number(e.target.value) || 0)))
                }
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-sm text-slate-100 tabular-nums focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                تعويض الإطلاق المسبق (مللي ثانية)
              </label>
              <input
                type="number"
                min={-1000}
                max={2000}
                dir="ltr"
                value={config.preFireOffsetMs}
                onChange={(e) =>
                  update('preFireOffsetMs', Number(e.target.value) || 0)
                }
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-sm text-slate-100 tabular-nums focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                القيمة الموجبة (مثل 120ms) تطلق الطلب قبل 06:00:00 تماماً لتعويض زمن وصول الشبكة.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                خادم مزامنة الوقت (NTP)
              </label>
              <input
                type="text"
                dir="ltr"
                value={config.ntpServerHost}
                onChange={(e) => update('ntpServerHost', e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Execution Mode & UI Accessibility */}
        <section className="rounded-xl border border-slate-800 bg-[#111722] p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-100">
            02. استراتيجية التنفيذ ومراقبة الواجهة
          </h2>

          <div className="space-y-2">
            {EXECUTION_MODES.map((mode) => {
              const selected = config.executionMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => update('executionMode', mode.value)}
                  className={`w-full rounded-lg border p-3 text-right transition-colors ${
                    selected
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-800 bg-[#0B0F14] hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-100">{mode.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{mode.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              الكلمات المفتاحية للبحث عن زر الحجز (مفصولة بفاصلة)
            </label>
            <input
              type="text"
              value={config.targetKeywords}
              onChange={(e) => update('targetKeywords', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              معرّف الزر اختياري (View Resource ID)
            </label>
            <input
              type="text"
              dir="ltr"
              placeholder={DEFAULT_PROJECT_CONFIG.targetAppPackage + ':id/btn_book_shift'}
              value={config.targetViewId}
              onChange={(e) => update('targetViewId', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </section>

        {/* Direct API Burst Config */}
        <section className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#111722] p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-100">
            03. إعدادات محرك الشبكة السريع (OkHttp Burst Engine)
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-6 space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                رابط طلب الحجز (Endpoint URL)
              </label>
              <input
                type="url"
                dir="ltr"
                value={config.apiEndpointUrl}
                onChange={(e) => update('apiEndpointUrl', e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                نوع الطلب
              </label>
              <select
                dir="ltr"
                value={config.apiHttpMethod}
                onChange={(e) =>
                  update('apiHttpMethod', e.target.value as 'POST' | 'PUT' | 'GET')
                }
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="GET">GET</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                عدد الدفعات
              </label>
              <input
                type="number"
                min={1}
                max={10}
                dir="ltr"
                value={config.burstCount}
                onChange={(e) =>
                  update('burstCount', Math.min(10, Math.max(1, Number(e.target.value) || 1)))
                }
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-sm text-slate-100 tabular-nums focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                الفاصل (ms)
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                dir="ltr"
                value={config.burstIntervalMs}
                onChange={(e) =>
                  update('burstIntervalMs', Math.min(1000, Math.max(0, Number(e.target.value) || 0)))
                }
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] px-3 py-2 font-mono text-sm text-slate-100 tabular-nums focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                الترويسات الافتراضية (Headers JSON)
              </label>
              <textarea
                rows={4}
                dir="ltr"
                value={config.apiHeadersJson}
                onChange={(e) => update('apiHeadersJson', e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] p-3 font-mono text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                جسم الطلب الافتراضي (Payload JSON)
              </label>
              <textarea
                rows={4}
                dir="ltr"
                value={config.apiPayloadJson}
                onChange={(e) => update('apiPayloadJson', e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#0B0F14] p-3 font-mono text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
