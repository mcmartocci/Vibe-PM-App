# Project Management App

A Kanban-style project management application with multi-project support, custom columns, task archiving, and stale card tracking.

## Tech Stack

- **Framework**: Next.js 16.1 with React 19
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Drag & Drop**: @dnd-kit/core and @dnd-kit/sortable
- **Icons**: lucide-react
- **IDs**: nanoid

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard (protected)
│   ├── login/              # Authentication
│   ├── admin/              # Admin panel
│   └── auth/callback/      # Supabase auth callback
├── components/
│   ├── kanban/             # Kanban board components
│   │   ├── KanbanBoard.tsx # Main board with drag-drop
│   │   ├── KanbanColumn.tsx
│   │   ├── TaskCard.tsx
│   │   └── MoveTaskModal.tsx
│   ├── archive/            # Archived tasks panel
│   ├── settings/           # Settings components
│   │   ├── SettingsPanel.tsx       # Global settings (theme)
│   │   ├── ProjectSettingsPanel.tsx # Per-project settings
│   │   └── ColumnManager.tsx       # Column CRUD UI
│   └── projects/           # Project sidebar
├── hooks/
│   ├── useTasks.ts         # Task CRUD + archiving
│   ├── useProjects.ts      # Project CRUD + settings
│   └── useColumns.ts       # Column CRUD + reordering
├── lib/
│   ├── supabase/           # Supabase client setup
│   └── utils.ts            # Utilities (cn, generateId)
├── types/
│   └── index.ts            # TypeScript type definitions
└── contexts/
    └── ThemeContext.tsx    # Dark/light theme
```

## Key Features

1. **Custom Columns**: Projects have configurable columns (not hardcoded). Columns can be renamed (double-click), reordered (drag), added, and deleted.

2. **Auto-Archive**: Tasks moved to a "done" column (marked with `isDoneColumn: true`) are automatically archived with timestamp.

3. **Stale Card Tracking**: Each project has a `stale_threshold_hours` setting. Cards exceeding time-in-stage show warning badges.

4. **Task Changelog**: All task changes (status, priority) are tracked in a changelog array for history and time-in-stage calculation.

## Database Schema

Key tables in `supabase-schema.sql`:
- `projects` - Projects with `stale_threshold_hours`
- `project_columns` - Custom columns per project with order, color, `is_done_column`
- `tasks` - Tasks with `archived_at` timestamp
- `task_changelog` - Change history for tasks

## Development

```bash
npm run dev    # Start dev server on localhost:3000
npm run build  # Production build
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Conventions

- Use `cn()` utility from `@/lib/utils` for conditional classNames
- Use `generateId()` for creating unique IDs (nanoid)
- Hooks handle all Supabase interactions - components stay presentational
- Task status values are dynamic (column slugs), not hardcoded enum
- Color palette uses semantic names: `text`, `text-muted`, `surface`, `elevated`, `line`, `amber`, `sage`, `coral`, `mist`
## Common Tasks

### Adding a New Feature
1. Create the UI component in appropriate folder
2. Add any new hooks in /hooks
3. Update types in /types/index.ts
4. Test drag-drop interactions manually

### Debugging Supabase Issues
- Check browser console for RLS policy errors
- Verify auth state in Supabase dashboard
- Common fix: Clear browser cache and re-login

## Gotchas
- Supabase RLS policies must allow operations or they fail silently
- Task status must match a valid column slug
- Column reordering requires updating all column orders in sequence