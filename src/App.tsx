import { ErrorBoundary } from './components/ErrorBoundary';
import { DragProvider } from './contexts/DragContext';
import { Sidebar } from './components/layout/Sidebar';
import { Timeline } from './components/schedule/Timeline';
import { WeekOverview } from './components/schedule/WeekOverview';
import { useCloudSync } from './hooks/useCloudSync';
import { useTicketSync } from './hooks/useTicketSync';

function AppInner() {
  const { switchToCode } = useCloudSync();
  useTicketSync();
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <Sidebar switchToCode={switchToCode} />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0">
          <Timeline />
        </div>
        <WeekOverview />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DragProvider>
        <AppInner />
      </DragProvider>
    </ErrorBoundary>
  );
}
