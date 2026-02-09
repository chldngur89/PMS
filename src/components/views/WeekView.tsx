import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Task, PMSSettings, Language } from '../../PMSApp';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { enUS } from 'date-fns/locale/en-US';

interface WeekViewProps {
  language: Language;
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updatedTask: Partial<Task>) => void;
  settings: PMSSettings;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const translations = {
  ko: {
    title: '주간 보기',
    today: '오늘',
    week: '주',
  },
  en: {
    title: 'Week View',
    today: 'Today',
    week: 'Week',
  },
};

export function WeekView({ language, tasks, onDeleteTask, onUpdateTask, settings, currentDate, onDateChange }: WeekViewProps) {
  const t = translations[language];
  const locale = language === 'ko' ? ko : enUS;
  
  const weekStart = startOfWeek(currentDate);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getTasksForDayAndHour = (day: Date, hour: number) => {
    if (!settings.showTasks) return [];
    
    return tasks.filter(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      const hourStart = new Date(day);
      hourStart.setHours(hour, 0, 0, 0);

      const isTaskActiveAtHour = isWithinInterval(hourStart, { start: taskStart, end: taskEnd });
      
      return isTaskActiveAtHour;
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">
            {format(weekStart, language === 'ko' ? 'yyyy년 M월 d일' : 'MMM d, yyyy', { locale })} - {format(addDays(weekStart, 6), language === 'ko' ? 'M월 d일' : 'MMM d', { locale })}
          </h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(subWeeks(currentDate, 1))}
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
              onClick={() => onDateChange(addWeeks(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 border border-border rounded-lg overflow-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-border sticky top-0 bg-background z-10">
            <div className="p-2 border-r border-border bg-muted/30"></div>
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              const isWeekend = index === 0 || index === 6;
              
              return (
                <div 
                  key={day.toString()} 
                  className={`p-2 text-center border-r border-border last:border-r-0 ${
                    isToday ? 'bg-primary text-primary-foreground' : 'bg-muted/30'
                  } ${isWeekend ? 'text-red-500' : ''}`}
                >
                  <div className="font-medium">
                    {format(day, language === 'ko' ? 'E' : 'EEE', { locale })}
                  </div>
                  <div className={`text-sm ${isToday ? '' : 'text-muted-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hour Rows */}
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-border last:border-b-0 min-h-[80px]">
              <div className="p-2 border-r border-border text-xs text-muted-foreground bg-muted/10 flex items-start">
                {format(new Date().setHours(hour, 0), 'HH:mm')}
              </div>
              {weekDays.map((day) => {
                const hourTasks = getTasksForDayAndHour(day, hour);
                
                return (
                  <div 
                    key={`${day}-${hour}`} 
                    className="p-1 border-r border-border last:border-r-0 space-y-1"
                  >
                    {hourTasks.map((task) => (
                      <div
                        key={task.id}
                        className="text-xs p-1 rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: `${task.color}20`,
                          borderColor: task.color,
                        }}
                        title={`${task.title}\n${task.assignee || ''}\n${task.progress}% ${language === 'ko' ? '완료' : 'complete'}`}
                      >
                        <div className="font-medium truncate" style={{ color: task.color }}>
                          {task.title}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          {task.assignee && (
                            <div className="flex items-center space-x-1">
                              <User className="w-2.5 h-2.5" />
                              <span className="text-[10px] truncate max-w-[60px]">{task.assignee}</span>
                            </div>
                          )}
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {task.progress}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
