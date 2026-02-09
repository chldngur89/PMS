import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Task, PMSSettings, Language } from '../../PMSApp';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

interface MonthViewProps {
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
    today: '오늘',
    sunday: '일',
    monday: '월',
    tuesday: '화',
    wednesday: '수',
    thursday: '목',
    friday: '금',
    saturday: '토',
    noTasks: '작업 없음',
    moreTasks: '개 더보기',
    deadline: '마감일',
    milestone: '마일스톤',
  },
  en: {
    today: 'Today',
    sunday: 'Sun',
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    noTasks: 'No tasks',
    moreTasks: 'more',
    deadline: 'Deadline',
    milestone: 'Milestone',
  },
};

export function MonthView({ language, tasks, onDeleteTask, onUpdateTask, settings, currentDate, onDateChange }: MonthViewProps) {
  const t = translations[language];
  const locale = language === 'ko' ? ko : enUS;
  
  const monthStart = startOfMonth(currentDate);

  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const weekDays = [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday];

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => 
      isWithinInterval(date, { start: task.startDate, end: task.endDate })
    );
  };

  const getDeadlinesForDay = (date: Date) => {
    if (!settings.showDeadlines) return [];
    return tasks.filter(task => 
      isSameDay(task.endDate, date) && task.priority === 'high'
    );
  };

  const getMilestonesForDay = (date: Date) => {
    if (!settings.showMilestones) return [];
    return tasks.filter(task => 
      isSameDay(task.endDate, date) && task.status === 'done'
    );
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">
            {format(currentDate, language === 'ko' ? 'yyyy년 M월' : 'MMMM yyyy', { locale })}
          </h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(subMonths(currentDate, 1))}
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
              onClick={() => onDateChange(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-muted-foreground">
        {weekDays.map((day, index) => (
          <div key={day} className={`p-2 font-medium ${index === 0 || index === 6 ? 'text-red-500' : ''}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-rows-[repeat(auto-fit,minmax(0,1fr))] gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const dayTasks = getTasksForDay(day);
              const deadlines = getDeadlinesForDay(day);
              const milestones = getMilestonesForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              
              return (
                <Card 
                  key={day.toString()} 
                  className={`min-h-[120px] p-2 ${
                    !isCurrentMonth ? 'opacity-50' : ''
                  } ${isToday ? 'ring-2 ring-primary' : ''} ${
                    isWeekend ? 'bg-muted/30' : ''
                  }`}
                >
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        isToday ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : 
                        isWeekend ? 'text-red-500' : ''
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {(dayTasks.length > 0 || deadlines.length > 0 || milestones.length > 0) && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">
                                {format(day, language === 'ko' ? 'M월 d일' : 'MMM d', { locale })}
                              </h4>
                              {dayTasks.map(task => (
                                <div
                                  key={task.id}
                                  className="p-2 rounded border border-border hover:bg-muted"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: task.color }}
                                        />
                                        <span className="text-sm font-medium">{task.title}</span>
                                      </div>
                                      {task.assignee && (
                                        <div className="flex items-center space-x-1 mt-1 text-xs text-muted-foreground">
                                          <User className="w-3 h-3" />
                                          <span>{task.assignee}</span>
                                        </div>
                                      )}
                                    </div>
                                    <Badge variant="secondary" className="text-xs ml-2">
                                      {task.progress}%
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 overflow-y-auto">
                      {settings.showDeadlines && deadlines.map((task) => (
                        <div
                          key={`deadline-${task.id}`}
                          className="text-xs px-1 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 truncate"
                          title={`${t.deadline}: ${task.title}`}
                        >
                          🚨 {task.title}
                        </div>
                      ))}

                      {settings.showMilestones && milestones.map((task) => (
                        <div
                          key={`milestone-${task.id}`}
                          className="text-xs px-1 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 truncate"
                          title={`${t.milestone}: ${task.title}`}
                        >
                          🎯 {task.title}
                        </div>
                      ))}

                      {settings.showTasks && dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className="text-xs px-1 py-0.5 rounded truncate"
                          style={{ 
                            backgroundColor: `${task.color}20`,
                            color: task.color
                          }}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      
                      {dayTasks.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayTasks.length - 2} {t.moreTasks}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
