import React from 'react';
import { GanttChart } from '../gantt/GanttChart';
import { Language } from '../../PMSApp';

interface GanttViewProps {
  language: Language;
  tasks: any[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updatedTask: any) => void;
}

export function GanttView({ language }: GanttViewProps) {
  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
      <GanttChart className="border-none shadow-sm" />
    </div>
  );
}
