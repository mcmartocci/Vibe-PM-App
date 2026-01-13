'use client';

import { useState } from 'react';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { useTodos } from '@/hooks/useTodos';
import { cn } from '@/lib/utils';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const { todos, loading, createTodo, toggleTodo, deleteTodo } = useTodos();
  const [newTodo, setNewTodo] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim() && !isAdding) {
      setIsAdding(true);
      await createTodo(newTodo.trim());
      setNewTodo('');
      setIsAdding(false);
    }
  };

  const handleToggle = async (id: string) => {
    await toggleTodo(id);
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
  };

  const pendingCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber" />
          <h2 className="font-[family-name:var(--font-display)] text-text text-base font-medium">
            Quick Todos
          </h2>
        </div>
        {todos.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-text-secondary">{pendingCount}</span>
            <span className="text-text-muted">/</span>
            <span className="text-text-muted">{todos.length}</span>
          </div>
        )}
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a quick task..."
          disabled={isAdding}
          className={cn(
            'flex-1 px-3 py-2 rounded-lg text-sm',
            'bg-elevated/50 border border-line-subtle',
            'text-text placeholder:text-text-muted',
            'disabled:opacity-50',
            'transition-all duration-200'
          )}
        />
        <button
          type="submit"
          disabled={!newTodo.trim() || isAdding}
          className={cn(
            'p-2 rounded-lg',
            'bg-amber/10 text-amber',
            'hover:bg-amber/20',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            'transition-all duration-150'
          )}
        >
          {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        </button>
      </form>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-elevated/50 rounded-lg animate-pulse-soft" />
            <div className="h-8 bg-elevated/50 rounded-lg animate-pulse-soft" style={{ animationDelay: '100ms' }} />
          </div>
        ) : todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center mb-3">
              <Sparkles size={18} className="text-text-muted" />
            </div>
            <p className="text-text-muted text-sm">No todos yet</p>
            <p className="text-text-muted/60 text-xs mt-1">Add one above</p>
          </div>
        ) : (
          <>
            {todos.filter(t => !t.completed).map((todo, i) => (
              <div
                key={todo.id}
                className="animate-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <TodoItem
                  todo={{ id: todo.id, text: todo.text, completed: todo.completed, createdAt: new Date(todo.created_at).getTime() }}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              </div>
            ))}
            {completedCount > 0 && (
              <>
                <div className="flex items-center gap-2 py-2 mt-2">
                  <div className="h-px flex-1 bg-line-subtle" />
                  <span className="text-text-muted text-xs">completed</span>
                  <div className="h-px flex-1 bg-line-subtle" />
                </div>
                {todos.filter(t => t.completed).map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={{ id: todo.id, text: todo.text, completed: todo.completed, createdAt: new Date(todo.created_at).getTime() }}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
