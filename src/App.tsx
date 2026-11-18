import { useMemo, useState } from 'react';
import {
  downloadProjectZip,
  generateAllProjectFiles,
} from './androidTemplate/generateProjectFiles';
import { CodeExplorerView } from './components/CodeExplorerView';
import { ConfiguratorView } from './components/ConfiguratorView';
import { GithubGuideView } from './components/GithubGuideView';
import { TimingSimulatorView } from './components/TimingSimulatorView';
import { ActiveView, TopBar } from './components/TopBar';
import { DEFAULT_PROJECT_CONFIG, ProjectConfig } from './types/androidProject';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('explorer');
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [isExporting, setIsExporting] = useState(false);

  const files = useMemo(() => generateAllProjectFiles(config), [config]);

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      await downloadProjectZip(config);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F14] text-slate-100">
      <TopBar
        activeView={activeView}
        onSelectView={setActiveView}
        onDownloadZip={handleDownloadZip}
        isExporting={isExporting}
      />

      <main className="flex-1">
        {activeView === 'explorer' && (
          <CodeExplorerView
            files={files}
            onGoToConfig={() => setActiveView('config')}
          />
        )}
        {activeView === 'config' && (
          <ConfiguratorView
            config={config}
            onChange={setConfig}
            onReset={() => setConfig(DEFAULT_PROJECT_CONFIG)}
            onPreviewCode={() => setActiveView('explorer')}
          />
        )}
        {activeView === 'simulator' && <TimingSimulatorView config={config} />}
        {activeView === 'github' && (
          <GithubGuideView onDownloadZip={handleDownloadZip} />
        )}
      </main>
    </div>
  );
}
