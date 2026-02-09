import React, { useState } from 'react';
import { MoreHorizontal, Calendar, User, Clock, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Task, Language } from '../../PMSApp';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

interface KanbanViewProps {
  language: Language;
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updatedTask: Partial<Task>) => void;
}

const translations = {
  ko: {
    title: '칸반 보드',
    todo: '할 일',
    inProgress: '진행 중',
    done: '완료',
    noTasks: '작업이 없습니다',
    totalTasks: '총',
    tasks: '작업',
    edit: '수정',
    duplicate: '복제',
    delete: '삭제',
    priority: '우선순위',
    low: '낮음',
    medium: '보통',
    high: '높음',
  },
  en: {
    title: 'Kanban Board',
    todo: 'To Do',
    inProgress: 'In Progress',
    done: 'Done',
    noTasks: 'No tasks',
    totalTasks: 'Total',
    tasks: 'tasks',
    edit: 'Edit',
    duplicate: 'Duplicate',
    delete: 'Delete',
    priority: 'Priority',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  },
};

export function KanbanView({ language, tasks, onDeleteTask, onUpdateTask }: KanbanViewProps) {
  const t = translations[language];
  const locale = language === 'ko' ? ko : enUS;

  const statusGroups: Array<{ key: 'todo' | 'in-progress' | 'done'; label: string; color: string }> = [
    { key: 'todo', label: t.todo, color: '#94a3b8' },
    { key: 'in-progress', label: t.inProgress, color: '#3b82f6' },
    { key: 'done', label: t.done, color: '#10b981' },
  ];

  const getGroupedTasks = () => {
    const groups: { [key: string]: Task[] } = {
      'todo': [],
      'in-progress': [],
      'done': []
    };

    tasks.forEach(task => {
      const status = task.status as string;
      if (groups[status]) {
        groups[status].push(task);
      } else if (['on-track', 'at-risk', 'delayed'].includes(status)) {
        groups['in-progress'].push(task);
      }
    });

    return groups;
  };

  const groupedTasks = getGroupedTasks();

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: t.low,
      medium: t.medium,
      high: t.high,
    };
    return labels[priority as keyof typeof labels] || t.medium;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const handleStatusChange = (taskId: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    onUpdateTask(taskId, { status: newStatus });
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: task.color }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{t.edit}</DropdownMenuItem>
              <DropdownMenuItem>{t.duplicate}</DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDeleteTask(task.id)}
              >
                {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {task.category}
          </Badge>
          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{language === 'ko' ? '진행률' : 'Progress'}</span>
            <span className="font-medium">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-1.5" />
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1.5" />
            {format(task.startDate, 'MM-dd HH:mm', { locale })} - {format(task.endDate, 'HH:mm', { locale })}
          </div>
          
          {task.assignee && (
            <div className="flex items-center text-xs text-muted-foreground">
              <User className="w-3 h-3 mr-1.5" />
              {task.assignee}
            </div>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
            {task.description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        <div className="text-sm text-muted-foreground">
          {t.totalTasks}: {tasks.length} {t.tasks}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-h-0">
        <div className="flex space-x-6 h-full min-w-max pb-4 px-1">
          {statusGroups.map(group => {
            const groupTasks = groupedTasks[group.key];
            
            return (
              <div key={group.key} className="w-80 flex flex-col h-full">
                {/* Column Header */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-t-xl border border-slate-200 border-b-0 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: group.color }}
                    />
                    <h3 className="font-bold text-slate-700">{group.label}</h3>
                    <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center px-1 bg-white border-slate-200">
                      {groupTasks.length}
                    </Badge>
                  </div>
                </div>

                {/* Task List */}
                <div className="flex-1 p-3 bg-slate-50/50 border border-slate-200 rounded-b-xl overflow-y-auto shadow-inner">
                  {groupTasks.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-10 italic border-2 border-dashed border-slate-200 rounded-lg">
                      {t.noTasks}
                    </div>
                  ) : (
                    groupTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
