import React from 'react';
import { Task, PMSSettings, Language, TeamMember } from '../PMSApp';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { KanbanView } from './views/KanbanView';
import { TableView } from './views/TableView';
import { GanttView } from './views/GanttView';
import { SalesDashboardView } from './views/SalesDashboardView';

interface PMSContentProps {
  language: Language;
  view: 'sales' | 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt';
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updatedTask: Partial<Task>) => Promise<boolean> | boolean;
  onCreateTask: (task: Omit<Task, 'id'>) => Promise<boolean> | boolean;
  settings: PMSSettings;
  viewDate: Date;
  onViewDateChange: (date: Date) => void;
  members: TeamMember[];
  categories: Array<{ name: string; color: string }>;
}

export function PMSContent({
  language,
  view,
  tasks,
  onDeleteTask,
  onUpdateTask,
  onCreateTask,
  settings,
  viewDate,
  onViewDateChange,
  members,
  categories,
}: PMSContentProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {view === 'month' && (
        <MonthView 
          language={language}
          tasks={tasks}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
          settings={settings}
          currentDate={viewDate}
          onDateChange={onViewDateChange}
        />
      )}
      {view === 'week' && (
        <WeekView
          language={language}
          tasks={tasks}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
          settings={settings}
          currentDate={viewDate}
          onDateChange={onViewDateChange}
        />
      )}
      {view === 'day' && (
        <DayView
          language={language}
          tasks={tasks}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
          settings={settings}
          currentDate={viewDate}
          onDateChange={onViewDateChange}
          members={members}
        />
      )}
      {view === 'kanban' && (
        <KanbanView
          language={language}
          tasks={tasks}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
          members={members}
        />
      )}
      {view === 'table' && (
        <TableView
          language={language}
          tasks={tasks}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
        />
      )}
      {view === 'gantt' && (
        <GanttView
          language={language}
          tasks={tasks}
          onDeleteTask={onDeleteTask}
          onUpdateTask={onUpdateTask}
        />
      )}
      {view === 'sales' && (
        <SalesDashboardView
          language={language}
          tasks={tasks}
          members={members}
          categories={categories}
          onCreateTask={onCreateTask}
          onUpdateTask={onUpdateTask}
        />
      )}
    </div>
  );
}
