import { ErrorBoundary } from './components/ErrorBoundary';
import { DragProvider } from './contexts/DragContext';
import { Sidebar } from './components/layout/Sidebar';
import { Timeline } from './components/schedule/Timeline';
import { WeekOverview } from './components/schedule/WeekOverview';

export default function App() {
  return (
    <ErrorBoundary>
      <DragProvider>
      <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <Timeline />
          </div>
          <WeekOverview />
        </main>
      </div>
      </DragProvider>
    </ErrorBoundary>
  );
}
