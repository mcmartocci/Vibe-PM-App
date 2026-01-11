import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TodoList } from '@/components/todo/TodoList';
import { NotesPanel } from '@/components/notes/NotesPanel';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-void via-midnight to-void">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-sage/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative h-screen flex flex-col p-8 lg:p-10">
        {/* Header */}
        <header className="mb-10 animate-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-end gap-3">
            <h1 className="font-[family-name:var(--font-display)] text-3xl lg:text-4xl font-medium tracking-tight text-text">
              Vibe Board
            </h1>
            <span className="text-amber text-lg font-[family-name:var(--font-display)] italic opacity-80 mb-1">
              /
            </span>
            <p className="text-text-muted text-sm tracking-wide mb-1.5">
              for the flow state
            </p>
          </div>
          <div className="mt-3 h-px w-32 bg-gradient-to-r from-amber/60 to-transparent" />
        </header>

        {/* Main Content */}
        <div className="flex-1 flex gap-8 min-h-0">
          {/* Kanban Board */}
          <main className="flex-1 min-w-0 animate-in" style={{ animationDelay: '100ms' }}>
            <KanbanBoard />
          </main>

          {/* Sidebar */}
          <aside className="w-80 flex-shrink-0 flex flex-col gap-6">
            <div
              className="flex-1 min-h-0 glass rounded-2xl p-5 animate-in"
              style={{ animationDelay: '200ms' }}
            >
              <TodoList />
            </div>
            <div
              className="flex-1 min-h-0 glass rounded-2xl p-5 animate-in"
              style={{ animationDelay: '300ms' }}
            >
              <NotesPanel />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
