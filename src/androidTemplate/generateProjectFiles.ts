import JSZip from 'jszip';
import { AndroidFile, ProjectConfig } from '../types/androidProject';
import { generateBuildAndResourceFiles } from './buildAndResources';
import { generateKotlinFiles } from './kotlinSources';

export function generateAllProjectFiles(config: ProjectConfig): AndroidFile[] {
  const buildAndResources = generateBuildAndResourceFiles(config);
  const kotlinSources = generateKotlinFiles(config);
  return [...buildAndResources, ...kotlinSources];
}

export async function downloadProjectZip(config: ProjectConfig): Promise<void> {
  const files = generateAllProjectFiles(config);
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const slug = config.appName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'samurai-shift-monitor';

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slug}-android-github.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
