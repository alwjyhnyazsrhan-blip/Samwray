import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Square } from 'lucide-react';
import { ProjectConfig } from '../types/androidProject';

interface TimingSimulatorViewProps {
  config: ProjectConfig;
}

interface SimEvent {
  id: number;
  offsetLabel: string;
  title: string;
  detail: string;
  triggerAtRemainingMs: number;
}

export function TimingSimulatorView({ config }: TimingSimulatorViewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(10_000);
  const [logs, setLogs] = useState<{ time: string; text: string }[]>([]);
  const rafRef = useRef<number | null>(null);
  const startPerfRef = useRef<number>(0);
  const firedIdsRef = useRef<Set<number>>(new Set());

  const preFire = Math.max(0, config.preFireOffsetMs);

  const stages: SimEvent[] = [
    {
      id: 1,
      offsetLabel: 'T - 10.000s',
      title: 'مزامنة التوقيت الذري (SNTP)',
      detail: `قياس فرق ساعة الهاتف أمام ${config.ntpServerHost} وحجز Partial WakeLock`,
      triggerAtRemainingMs: 10_000,
    },
    {
      id: 2,
      offsetLabel: 'T - 5.000s',
      title: 'تسخين اتصال الشبكة (TLS Pre-Warm)',
      detail: 'إنشاء جلسة HTTPS/TLS مسبقة في OkHttp ConnectionPool لتفادي تأخير المصافحة',
      triggerAtRemainingMs: 5_000,
    },
    {
      id: 3,
      offsetLabel: 'T - 2.500s',
      title: 'استحضار تطبيق ساموراي للمقدمة',
      detail: `تشغيل الحزمة ${config.targetAppPackage} والتأكد من جاهزية شاشة الشفتات`,
      triggerAtRemainingMs: 2_500,
    },
    {
      id: 4,
      offsetLabel: 'T - 0.400s',
      title: 'حلقة الانتظار النانوية (Nano Spin-Lock)',
      detail: 'التحول من Coroutine delay إلى SystemClock.elapsedRealtimeNanos() بدقة أجزاء المللي ثانية',
      triggerAtRemainingMs: 400,
    },
    {
      id: 5,
      offsetLabel: `T - ${(preFire / 1000).toFixed(3)}s`,
      title: 'لحظة الإطلاق المتزامن',
      detail:
        config.executionMode === 'API_ONLY'
          ? `إرسال ${config.burstCount} طلبات API بفاصل ${config.burstIntervalMs}ms`
          : config.executionMode === 'ACCESSIBILITY_ONLY'
            ? 'تفعيل مراقب شجرة الواجهة (Accessibility) + النقر التلقائي على زر الحجز'
            : `تشغيل نافذة مراقبة Accessibility بالتوازي مع إرسال ${config.burstCount} طلبات API`,
      triggerAtRemainingMs: preFire,
    },
  ];

  const stopSimulation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsRunning(false);
  };

  const resetSimulation = () => {
    stopSimulation();
    firedIdsRef.current.clear();
    setRemainingMs(10_000);
    setLogs([]);
  };

  const startSimulation = () => {
    resetSimulation();
    setIsRunning(true);
    startPerfRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startPerfRef.current;
      const nextRemaining = Math.max(0, 10_000 - elapsed);
      setRemainingMs(nextRemaining);

      stages.forEach((stage) => {
        if (nextRemaining <= stage.triggerAtRemainingMs && !firedIdsRef.current.has(stage.id)) {
          firedIdsRef.current.add(stage.id);
          const formattedOffset = `T - ${(nextRemaining / 1000).toFixed(3)}s`;
          setLogs((prev) => [
            { time: formattedOffset, text: `${stage.title} — ${stage.detail}` },
            ...prev,
          ]);
        }
      });

      if (nextRemaining <= 0) {
        setIsRunning(false);
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const paddedHour = String(config.targetHour).padStart(2, '0');
  const paddedMinute = String(config.targetMinute).padStart(2, '0');
  const paddedSecond = String(config.targetSecond).padStart(2, '0');

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-800/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            محاكي آلية التوقيت والتنفيذ (آخر 10 ثوانٍ)
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            تجربة تفاعلية في المتصفح توضّح التسلسل الزمني الفعلي لخدمة{' '}
            <span dir="ltr" className="font-mono text-slate-300">ShiftMonitorService.kt</span>{' '}
            قبل الساعة {paddedHour}:{paddedMinute}:{paddedSecond}.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isRunning ? (
            <button
              type="button"
              onClick={stopSimulation}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 whitespace-nowrap shrink-0"
            >
              <Square className="h-3.5 w-3.5" />
              <span>إيقاف المحاكاة</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startSimulation}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5" />
              <span>بدء المحاكاة (10 ثوانٍ)</span>
            </button>
          )}

          <button
            type="button"
            onClick={resetSimulation}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#111722] px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>إعادة تعيين</span>
          </button>
        </div>
      </div>

      {/* Countdown & Pipeline Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-slate-800 bg-[#111722] p-6">
            <div className="text-xs font-medium text-slate-400">
              الوقت المتبقي على لحظة فتح الشفتات
            </div>
            <div
              dir="ltr"
              className="mt-2 font-mono text-4xl font-bold tracking-tight text-amber-400 tabular-nums"
            >
              00:00:{(remainingMs / 1000).toFixed(3).padStart(6, '0')}
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-amber-500 transition-none"
                style={{ width: `${((10_000 - remainingMs) / 10_000) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>الهدف: {paddedHour}:{paddedMinute}:{paddedSecond}.000</span>
              <span aria-hidden="true">·</span>
              <span>التعويض المسبق: {preFire}ms</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#111722] p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-100">
              سجل المحاكاة الزمني
            </h2>
            {logs.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                اضغط على «بدء المحاكاة» لمشاهدة توقيت إطلاق كل مرحلة بدقة.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                {logs.map((entry, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-800 bg-[#0B0F14] p-3"
                  >
                    <div
                      dir="ltr"
                      className="text-left font-mono text-[11px] text-emerald-400 tabular-nums"
                    >
                      {entry.time}
                    </div>
                    <div className="mt-1 text-xs text-slate-200">{entry.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#111722] p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-100">
            مراحل خط التنفيذ في الأندرويد
          </h2>
          <div className="divide-y divide-slate-800">
            {stages.map((stage) => {
              const executed = remainingMs <= stage.triggerAtRemainingMs && (isRunning || remainingMs < 10_000);
              return (
                <div key={stage.id} className="flex items-start justify-between gap-4 py-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        dir="ltr"
                        className="font-mono text-xs font-semibold text-amber-400 tabular-nums"
                      >
                        {stage.offsetLabel}
                      </span>
                      <span className="text-sm font-semibold text-slate-100">
                        {stage.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{stage.detail}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium whitespace-nowrap ${
                      executed ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {executed ? 'تم التنفيذ' : 'بانتظار الموعد'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
