import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';

interface GithubGuideViewProps {
  onDownloadZip: () => void;
}

const GIT_COMMANDS = `git init
git add .
git commit -m "Initial Samurai Shift Monitor Android project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/samurai-shift-monitor.git
git push -u origin main`;

export function GithubGuideView({ onDownloadZip }: GithubGuideViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCommands = async () => {
    await navigator.clipboard.writeText(GIT_COMMANDS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-6 space-y-6">
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold text-slate-100">
          دليل الرفع إلى GitHub وبناء ملف APK تلقائياً
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          تم إعداد ملف <span dir="ltr" className="font-mono text-slate-300">.github/workflows/build-apk.yml</span>{' '}
          بحيث يقوم GitHub بتحميل JDK 17 و Gradle 8.10.2 وبناء ملف التطبيق تلقائياً في السحابة دون الحاجة لتثبيت Android Studio على جهازك.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-[#111722] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                01. تحميل حزمة المشروع المضغوطة (ZIP)
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                تحتوي الحزمة على جميع ملفات Kotlin و Gradle و XML وملف GitHub Actions جاهزة ومرتبة.
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadZip}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <Download className="h-4 w-4" />
              <span>تحميل المشروع الآن</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111722] p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-100">
            02. إنشاء مستودع GitHub ورفع الملفات
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            فك ضغط الملف على جهازك، ثم أنشئ مستودعاً جديداً (New Repository) في حسابك على GitHub. يمكنك رفع المجلد بالكامل عبر أوامر Git التالية أو عبر سحب الملفات وإفلاتها من واجهة الويب (مع التأكد من وجود مجلد <span dir="ltr" className="font-mono text-slate-300">.github</span> المخفي):
          </p>

          <div className="rounded-lg border border-slate-800 bg-[#0B0F14] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
              <span className="font-mono text-xs text-slate-400">Terminal / Git Bash</span>
              <button
                type="button"
                onClick={handleCopyCommands}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>نسخ الأوامر</span>
                  </>
                )}
              </button>
            </div>
            <pre dir="ltr" className="overflow-x-auto p-4 font-mono text-xs leading-6 text-slate-200">
              {GIT_COMMANDS}
            </pre>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111722] p-5 space-y-2">
          <h2 className="text-base font-semibold text-slate-100">
            03. استلام ملف APK الجاهز من GitHub Actions
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            بمجرد رفع الملفات إلى فرع <span dir="ltr" className="font-mono text-slate-300">main</span>، انتقل إلى تبويب <strong className="text-slate-200">Actions</strong> داخل مستودعك في GitHub. ستجد مهمة <span dir="ltr" className="font-mono text-slate-300">Build Android APK</span> قيد التشغيل. عند اكتمالها بالعلامة الخضراء، افتحها وانزل إلى قسم <strong className="text-slate-200">Artifacts</strong> لتحميل ملف <span dir="ltr" className="font-mono text-amber-400">SamuraiShiftMonitor-debug-apk</span> الذي يحتوي على <span dir="ltr" className="font-mono text-slate-200">app-debug.apk</span> جاهزاً للتثبيت على أندرويد.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111722] p-5 space-y-2">
          <h2 className="text-base font-semibold text-slate-100">
            04. إعداد الهاتف بعد تثبيت التطبيق
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-400">
            <li>فعّل <strong className="text-slate-200">خدمة إمكانية الوصول (Accessibility Service)</strong> للتطبيق من إعدادات النظام ليتمكن من قراءة واجهة ساموراي والنقر على زر الحجز.</li>
            <li>امنح صلاحية <strong className="text-slate-200">الظهور فوق التطبيقات</strong> واستخدم الأداة العائمة لوضع علامة التصويب فوق زر الحجز داخل تطبيق ساموراي وحفظ إحداثياته بدقة.</li>
            <li>استثنِ التطبيق من <strong className="text-slate-200">تحسين البطارية (Battery Optimization)</strong> لضمان استيقاظ الخدمة في الخلفية قبل الساعة 6:00 تماماً.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
