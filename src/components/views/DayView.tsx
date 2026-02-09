import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, User, Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Task, PMSSettings, Language } from '../../PMSApp';
import { format, addDays, subDays, isSameDay, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { enUS } from 'date-fns/locale/en-US';
import { ProjectResources } from '../ProjectResources';
import { TeamMember } from '../../PMSApp';

interface DayViewProps {
  language: Language;
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updatedTask: Partial<Task>) => void;
  settings: PMSSettings;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  members: TeamMember[];
}

const translations = {
  ko: {
    title: '일간 보기',
    today: '오늘',
    noTasks: '이 날짜에 작업이 없습니다',
    assignee: '담당자',
    progress: '진행률',
    status: '상태',
    priority: '우선순위',
    statusTodo: '할 일',
    statusInProgress: '진행 중',
    statusDone: '완료',
    priorityLow: '낮음',
    priorityMedium: '보통',
    priorityHigh: '높음',
  },
  en: {
    title: 'Day View',
    today: 'Today',
    noTasks: 'No tasks for this day',
    assignee: 'Assignee',
    progress: 'Progress',
    status: 'Status',
    priority: 'Priority',
    statusTodo: 'To Do',
    statusInProgress: 'In Progress',
    statusDone: 'Done',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
  },
};

export function DayView({
 language, tasks, onDeleteTask, onUpdateTask, settings, currentDate, onDateChange, members }: DayViewProps) {
  const t = translations[language];
  const locale = language === 'ko' ? ko : enUS;

  const getMemberByName = (name: string) => members.find(m => m.name === name);

  
  const hours = Array.from({ length: 24 }, (_, i) => i);


  const getTasksForDay = () => {
    if (!settings.showTasks) return [];
    return tasks.filter(task => 
      isWithinInterval(currentDate, { start: task.startDate, end: task.endDate })
    );
  };

  const getTasksForHour = (hour: number) => {
    const hourStart = new Date(currentDate);
    hourStart.setHours(hour, 0, 0, 0);

    return getTasksForDay().filter(task => 
      isWithinInterval(hourStart, { start: new Date(task.startDate), end: new Date(task.endDate) })
    );
  };

  const dayTasks = getTasksForDay();

  const getStatusLabel = (status: string) => {
    const labels = {
      'todo': t.statusTodo,
      'in-progress': t.statusInProgress,
      'done': t.statusDone,
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      'low': t.priorityLow,
      'medium': t.priorityMedium,
      'high': t.priorityHigh,
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'todo': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return colors[status as keyof typeof colors] || colors['todo'];
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">
            {format(currentDate, language === 'ko' ? 'yyyy년 M월 d일 (E)' : 'EEEE, MMMM d, yyyy', { locale })}
          </h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(subDays(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(new Date())}
            >
              {t.today}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(addDays(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {dayTasks.length} {language === 'ko' ? '개의 작업' : 'tasks'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              {hours.map((hour) => {
                const hourTasks = getTasksForHour(hour);
                return (
                  <div key={hour} className="flex border-b border-slate-50 last:border-b-0 group/hour">
                    <div className="w-20 p-4 border-r border-slate-50 bg-slate-50/30 text-[11px] font-medium text-slate-400 flex justify-center items-start group-hover/hour:text-blue-500 transition-colors">
                      {format(new Date().setHours(hour, 0), 'HH:mm')}
                    </div>
                    <div className="flex-1 p-3 space-y-3 bg-white group-hover/hour:bg-slate-50/20 transition-colors min-h-[100px]">
                      {hourTasks.length === 0 ? (
                        <div className="h-full flex items-center justify-center opacity-0 group-hover/hour:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="text-[10px] h-7 text-slate-300 hover:text-blue-500 border border-dashed border-slate-200">
                             + 일정 추가
                          </Button>
                        </div>
                      ) : (
                        hourTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden group/task"
                            onClick={() => onUpdateTask(task.id, {})}
                          >
                            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: task.color }} />
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-bold bg-slate-100 text-slate-500 border-none uppercase tracking-wider">
                                    {task.category}
                                  </Badge>
                                  <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover/task:text-blue-600 transition-colors line-clamp-1">{task.title}</h4>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {format(task.startDate, 'HH:mm')} - {format(task.endDate, 'HH:mm')}
                                    </span>
                                  </div>
                                  {task.assignee && (
                                    <div className="flex items-center gap-1 text-slate-500 bg-slate-100/80 pr-2 pl-0.5 py-0.5 rounded-full">
                                      <div 
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shadow-sm"
                                        style={{ backgroundColor: getMemberByName(task.assignee)?.color || '#cbd5e1' }}
                                      >
                                        {task.assignee.substring(0, 2)}
                                      </div>
                                      <span>{task.assignee}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge className={`text-[10px] h-5 border-none shadow-none font-bold ${getPriorityColor(task.priority)}`}>
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                                <div className="text-[10px] font-bold text-slate-500">
                                  {task.progress}%
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-none bg-slate-50/50 rounded-2xl overflow-hidden ring-1 ring-slate-200/50">
            <CardHeader className="pb-4 bg-white/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-500" />
                  {language === 'ko' ? '오늘의 주요 지표' : 'Today\'s Focus'}
                </CardTitle>
                <Badge className="bg-slate-800 text-white border-none">{dayTasks.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {dayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-3 italic">
                  <Calendar size={40} opacity={0.2} />
                  <p className="text-xs font-medium">{t.noTasks}</p>
                </div>
              ) : (
                dayTasks.map((task) => (
                  <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-slate-100 transition-all group">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: task.color }} />
                      <h4 className="font-extrabold text-xs text-slate-700 truncate flex-1 group-hover:text-blue-600">{task.title}</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-slate-400">{t.progress}</span>
                        <span className="text-slate-600">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-1.5 bg-slate-100" style={{'--progress-foreground': task.color} as any} />
                      <div className="flex justify-between items-center pt-1">
                        <div className="flex -space-x-1.5">
                           <div className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold">JD</div>
                           <div className="w-5 h-5 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-blue-600">SK</div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{format(task.endDate, 'HH:mm')} 마감</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden group">
             <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
             <h4 className="text-sm font-bold mb-1 opacity-80">전체 달성률</h4>
             <div className="text-3xl font-black mb-4">
                {dayTasks.length > 0 ? Math.round(dayTasks.reduce((acc, t) => acc + t.progress, 0) / dayTasks.length) : 0}%
             </div>
             <p className="text-[11px] font-medium leading-relaxed opacity-90">
                오늘 예정된 {dayTasks.length}개의 작업이 정상적으로 진행되고 있습니다.
             </p>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold text-slate-800">Project Knowledge Base</h3>
          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px]">Insight</Badge>
        </div>
        <p className="text-sm text-slate-500 mb-6">프로젝트 자산과 문서를 한눈에 관리하고 공유하세요.</p>
        <ProjectResources />
      </div>
    </div>
  );
}

