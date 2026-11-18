export type ExecutionMode = 'HYBRID' | 'ACCESSIBILITY_ONLY' | 'API_ONLY';

export interface ProjectConfig {
  appName: string;
  packageName: string;
  targetAppPackage: string;
  targetHour: number;
  targetMinute: number;
  targetSecond: number;
  preFireOffsetMs: number;
  executionMode: ExecutionMode;
  targetKeywords: string;
  targetViewId: string;
  apiEndpointUrl: string;
  apiHttpMethod: 'POST' | 'PUT' | 'GET';
  apiHeadersJson: string;
  apiPayloadJson: string;
  burstCount: number;
  burstIntervalMs: number;
  ntpServerHost: string;
}

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  appName: 'Samurai Shift Monitor',
  packageName: 'com.samurai.shiftmonitor',
  targetAppPackage: 'com.samurai.courier',
  targetHour: 6,
  targetMinute: 0,
  targetSecond: 0,
  preFireOffsetMs: 120,
  executionMode: 'HYBRID',
  targetKeywords: 'حجز, تأكيد, قبول الشفت, احجز الآن, Book, Claim, Confirm',
  targetViewId: '',
  apiEndpointUrl: 'https://api.samurai-courier.example/v1/shifts/book',
  apiHttpMethod: 'POST',
  apiHeadersJson: '{\n  "Authorization": "Bearer YOUR_TOKEN_HERE",\n  "Content-Type": "application/json",\n  "Accept": "application/json"\n}',
  apiPayloadJson: '{\n  "action": "book_shift",\n  "autoConfirm": true\n}',
  burstCount: 3,
  burstIntervalMs: 45,
  ntpServerHost: 'time.google.com',
};

export type FileCategory = 'github' | 'gradle' | 'manifest' | 'kotlin' | 'resources' | 'docs';

export interface AndroidFile {
  path: string;
  name: string;
  language: 'kotlin' | 'xml' | 'yaml' | 'gradle' | 'toml' | 'properties' | 'markdown' | 'proguard';
  category: FileCategory;
  description: string;
  content: string;
}
