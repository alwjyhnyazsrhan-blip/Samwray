import { AndroidFile, ProjectConfig } from '../types/androidProject';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, "\\'");
}

export function generateBuildAndResourceFiles(config: ProjectConfig): AndroidFile[] {
  const safeAppName = escapeXml(config.appName.trim() || 'Samurai Shift Monitor');
  const pkg = config.packageName.trim() || 'com.samurai.shiftmonitor';
  const targetPkg = config.targetAppPackage.trim() || 'com.samurai.courier';

  const githubWorkflow = `name: Build Android APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Assemble Debug & Unsigned Release APKs
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'

      - name: Set up Gradle 8.10.2
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.10.2'

      - name: Build Debug APK
        run: gradle assembleDebug --stacktrace --no-daemon

      - name: Build Unsigned Release APK
        run: gradle assembleRelease --stacktrace --no-daemon

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: SamuraiShiftMonitor-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk
          retention-days: 30

      - name: Upload Unsigned Release APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: SamuraiShiftMonitor-release-unsigned-apk
          path: app/build/outputs/apk/release/app-release-unsigned.apk
          retention-days: 30
`;

  const gitignore = `*.iml
.gradle
/local.properties
/.idea/
.DS_Store
/build
/app/build
/captures
.externalNativeBuild
.cxx
*.jks
*.keystore
`;

  const gradleProperties = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`;

  const settingsGradle = `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "SamuraiShiftMonitor"
include(":app")
`;

  const rootBuildGradle = `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`;

  const libsVersionsToml = `[versions]
agp = "8.7.3"
kotlin = "2.0.21"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.12.01"
coroutines = "1.9.0"
okhttp = "4.12.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-compose-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }
okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`;

  const appBuildGradle = `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "${pkg}"
    compileSdk = 35

    defaultConfig {
        applicationId = "${pkg}"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.okhttp)
}
`;

  const proguardRules = `-keep class okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
`;

  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission
        android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

    <queries>
        <package android:name="${targetPkg}" />
    </queries>

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.SamuraiShiftMonitor"
        android:usesCleartextTraffic="true"
        tools:targetApi="35">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.ShiftMonitorService"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Precision shift release countdown and booking trigger" />
        </service>

        <service
            android:name=".service.FloatingOverlayService"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Floating target coordinate calibration and live countdown overlay" />
        </service>

        <service
            android:name=".accessibility.SamuraiAccessibilityService"
            android:exported="true"
            android:label="@string/accessibility_service_label"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <receiver
            android:name=".receiver.AlarmTriggerReceiver"
            android:exported="false" />

    </application>
</manifest>
`;

  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${safeAppName}</string>
    <string name="accessibility_service_label">${safeAppName} — أتمتة الحجز</string>
    <string name="accessibility_service_description">يراقب واجهة تطبيق ساموراي في التوقيت المحدد ويضغط زر حجز الشفت تلقائياً بأقصى سرعة ممكنة.</string>
</resources>
`;

  const themesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.SamuraiShiftMonitor" parent="android:Theme.Material.NoActionBar" />
</resources>
`;

  const accessibilityConfigXml = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged|typeWindowContentChanged|typeViewClicked"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagReportViewIds|flagRetrieveInteractiveWindows|flagIncludeNotImportantViews"
    android:canPerformGestures="true"
    android:canRetrieveWindowContent="true"
    android:description="@string/accessibility_service_description"
    android:notificationTimeout="10" />
`;

  const icBoltTimerXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M11,21h-1l1,-7H7.5c-0.58,0 -0.57,-0.32 -0.38,-0.66c0.19,-0.34 0.05,-0.08 0.07,-0.12C8.48,10.94 10.42,7.54 13,3h1l-1,7h3.5c0.49,0 0.56,0.33 0.47,0.51l-0.07,0.15C12.96,17.55 11,21 11,21z" />
</vector>
`;

  const icLauncherBgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0B0F14"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#161F2E"
        android:pathData="M18,18h72v72h-72z" />
</vector>
`;

  const icLauncherFgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#F59E0B"
        android:pathData="M56,24 L38,56 L52,56 L48,84 L70,50 L56,50 Z" />
</vector>
`;

  const icLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`;

  const readmeMd = `# ${config.appName}

نظام أتمتة ومراقبة حجز الشفتات والمواعيد لتطبيق **ساموراي (Samurai)** على أندرويد بدقة أجزاء الثانية (Millisecond Precision).

## المميزات الأساسية
- **مزامنة التوقيت الذري (SNTP)**: قياس فارق التوقيت بين ساعة الهاتف وخادم \`${config.ntpServerHost}\` لتجنب أي تأخير ناتج عن عدم دقة ساعة الجهاز.
- **منبه الاستيقاظ الدقيق + Spin-Lock**: استخدام \`AlarmManager.setExactAndAllowWhileIdle\` مع \`WakeLock\` وحلقة انتظار نانوية (\`elapsedRealtimeNanos\`) في آخر 400 مللي ثانية.
- **وضع التشغيل المزدوج (Hybrid Engine)**:
  1. **التفاعل مع الواجهة (AccessibilityService)**: البحث التلقائي في شجرة الواجهة بالكلمات المفتاحية أو \`View ID\` + النقر المباشر بالإحداثيات (\`dispatchGesture\`).
  2. **محرك الشبكة السريع (OkHttp Burst)**: تسخين اتصال TLS مسبقاً قبل الموعد بـ 5 ثوانٍ وإرسال دفعات طلبات متزامنة.
- **نافذة عائمة لتحديد موضع الزر (Floating Crosshair)**: أداة عائمة فوق تطبيق ساموراي لحفظ إحداثيات زر الحجز \`(X, Y)\` بدقة.

## بناء ملف APK تلقائياً عبر GitHub Actions (بدون أدوات محلية)
1. أنشئ مستودعاً جديداً (Repository) على GitHub.
2. ارفع كافة ملفات ومجلدات هذا المشروع إلى الفرع الرئيسي \`main\`.
3. انتقل إلى تبويب **Actions** في المستودع؛ سيبدأ سير عمل \`Build Android APK\` تلقائياً.
4. بعد اكتمال البناء (حوالي 3 دقائق)، قم بتحميل \`SamuraiShiftMonitor-debug-apk\` من قسم **Artifacts** وفك الضغط لتجد ملف \`app-debug.apk\`.
`;

  return [
    {
      path: '.github/workflows/build-apk.yml',
      name: 'build-apk.yml',
      language: 'yaml',
      category: 'github',
      description: 'ملف أتمتة GitHub Actions لبناء APK تلقائياً باستخدام JDK 17 و Gradle 8.10.2 دون الحاجة لأي أدوات محلية.',
      content: githubWorkflow,
    },
    {
      path: '.gitignore',
      name: '.gitignore',
      language: 'properties',
      category: 'docs',
      description: 'تجاهل ملفات البناء المؤقتة ومفاتيح التوقيع عند الرفع لـ GitHub.',
      content: gitignore,
    },
    {
      path: 'README.md',
      name: 'README.md',
      language: 'markdown',
      category: 'docs',
      description: 'دليل المشروع وخطوات البناء التلقائي عبر GitHub Actions.',
      content: readmeMd,
    },
    {
      path: 'gradle.properties',
      name: 'gradle.properties',
      language: 'properties',
      category: 'gradle',
      description: 'إعدادات الذاكرة و AndroidX و Kotlin الرسمية لـ Gradle.',
      content: gradleProperties,
    },
    {
      path: 'settings.gradle.kts',
      name: 'settings.gradle.kts',
      language: 'gradle',
      category: 'gradle',
      description: 'تعريف مستودعات Google/Maven وتضمين موديول app.',
      content: settingsGradle,
    },
    {
      path: 'build.gradle.kts',
      name: 'build.gradle.kts',
      language: 'gradle',
      category: 'gradle',
      description: 'ملف Gradle الرئيسي للمشروع.',
      content: rootBuildGradle,
    },
    {
      path: 'gradle/libs.versions.toml',
      name: 'libs.versions.toml',
      language: 'toml',
      category: 'gradle',
      description: 'جدول إصدارات المكتبات (AGP 8.7.3, Kotlin 2.0.21, Compose BOM, OkHttp 4.12).',
      content: libsVersionsToml,
    },
    {
      path: 'app/build.gradle.kts',
      name: 'app/build.gradle.kts',
      language: 'gradle',
      category: 'gradle',
      description: 'إعدادات تطبيق الأندرويد (compileSdk 35, minSdk 26, Jetpack Compose, OkHttp).',
      content: appBuildGradle,
    },
    {
      path: 'app/proguard-rules.pro',
      name: 'proguard-rules.pro',
      language: 'proguard',
      category: 'gradle',
      description: 'قواعد الحفاظ على كلاسات الشبكة في بناء Release.',
      content: proguardRules,
    },
    {
      path: 'app/src/main/AndroidManifest.xml',
      name: 'AndroidManifest.xml',
      language: 'xml',
      category: 'manifest',
      description: 'تصريح الصلاحيات والخدمات (AccessibilityService, ForegroundService, ExactAlarm, Overlay).',
      content: androidManifest,
    },
    {
      path: 'app/src/main/res/values/strings.xml',
      name: 'strings.xml',
      language: 'xml',
      category: 'resources',
      description: 'النصوص العربية لاسم التطبيق ووصف خدمة الوصول.',
      content: stringsXml,
    },
    {
      path: 'app/src/main/res/values/themes.xml',
      name: 'themes.xml',
      language: 'xml',
      category: 'resources',
      description: 'السمة الأساسية المتوافقة مع Jetpack Compose.',
      content: themesXml,
    },
    {
      path: 'app/src/main/res/xml/accessibility_service_config.xml',
      name: 'accessibility_service_config.xml',
      language: 'xml',
      category: 'resources',
      description: 'تفعيل استرجاع محتوى النوافذ وتنفيذ الإيماءات (canPerformGestures) بأسرع استجابة.',
      content: accessibilityConfigXml,
    },
    {
      path: 'app/src/main/res/drawable/ic_bolt_timer.xml',
      name: 'ic_bolt_timer.xml',
      language: 'xml',
      category: 'resources',
      description: 'أيقونة متجهية لإشعار الخدمة المستمرة في الخلفية.',
      content: icBoltTimerXml,
    },
    {
      path: 'app/src/main/res/drawable/ic_launcher_background.xml',
      name: 'ic_launcher_background.xml',
      language: 'xml',
      category: 'resources',
      description: 'خلفية أيقونة التطبيق التكيفية (Adaptive Icon).',
      content: icLauncherBgXml,
    },
    {
      path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
      name: 'ic_launcher_foreground.xml',
      language: 'xml',
      category: 'resources',
      description: 'الطبقة الأمامية المتجهية لأيقونة التطبيق.',
      content: icLauncherFgXml,
    },
    {
      path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
      name: 'ic_launcher.xml',
      language: 'xml',
      category: 'resources',
      description: 'تعريف أيقونة التطبيق القياسية لـ Android 8+.',
      content: icLauncherXml,
    },
    {
      path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
      name: 'ic_launcher_round.xml',
      language: 'xml',
      category: 'resources',
      description: 'تعريف أيقونة التطبيق الدائرية لـ Android 8+.',
      content: icLauncherXml,
    },
  ];
}
