import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Calendar, MoreHorizontal, ChevronDown, ChevronRight, Edit3, Check, X } from 'lucide-react';
import { TaskBar } from './TaskBar';
import { TaskForm } from './TaskForm';
import { ExportMenu } from './ExportMenu';
import { TaskDetailDialog } from './TaskDetailDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { supabase } from '../../lib/supabase';

export type TaskStatus = 'on-track' | 'at-risk' | 'delayed';

export interface TaskIssue {
  id: string;
  description: string;
  createdAt: Date;
  resolved: boolean;
}

export interface Task {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  color: string;
  dependencies?: string[];
  parentId?: string;
  status?: TaskStatus;
  issues?: TaskIssue[];
}

export interface GanttChartProps {
  className?: string;
}

const predefinedColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getSubtaskColor = (parentColor: string, depth: number = 1): string => {
  const hsl = hexToHSL(parentColor);
  const lightnessIncrease = 12 * depth;
  const newLightness = Math.min(80, hsl.l + lightnessIncrease);
  const newSaturation = Math.max(40, hsl.s - (depth * 5));
  return hslToHex(hsl.h, newSaturation, newLightness);
};

const getTaskDepth = (task: Task, allTasks: Task[]): number => {
  let depth = 0;
  let currentTask = task;
  while (currentTask.parentId) {
    depth++;
    const parent = allTasks.find(t => t.id === currentTask.parentId);
    if (!parent) break;
    currentTask = parent;
  }
  return depth;
};

const getRootColor = (task: Task, allTasks: Task[]): string => {
  let currentTask = task;
  while (currentTask.parentId) {
    const parent = allTasks.find(t => t.id === currentTask.parentId);
    if (!parent) break;
    currentTask = parent;
  }
  return currentTask.color;
};

export function GanttChart({ className }: GanttChartProps) {
  const [projectName, setProjectName] = useState('나의 프로젝트 타임라인');
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(projectName);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [inlineFormData, setInlineFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    progress: 0,
    color: predefinedColors[0],
  });
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedTasks = data.map((task: any) => ({
          id: task.id,
          name: task.name,
          startDate: new Date(task.start_date),
          endDate: new Date(task.end_date),
          progress: task.progress,
          color: task.color,
          parentId: task.parent_id,
          dependencies: task.dependencies,
          status: task.status as TaskStatus,
        }));
        setTasks(mappedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextColor = (): string => {
    const rootTasks = tasks.filter(task => !task.parentId);
    const usedColors = rootTasks.map(task => task.color);
    const colorCounts = predefinedColors.map(color => ({
      color,
      count: usedColors.filter(used => used === color).length,
    }));
    colorCounts.sort((a, b) => a.count - b.count);
    return colorCounts[0].color;
  };

  const handleStartEditingProjectName = () => {
    setTempProjectName(projectName);
    setIsEditingProjectName(true);
  };

  const handleSaveProjectName = () => {
    if (tempProjectName.trim()) {
      setProjectName(tempProjectName.trim());
    }
    setIsEditingProjectName(false);
  };

  const handleCancelEditingProjectName = () => {
    setTempProjectName(projectName);
    setIsEditingProjectName(false);
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveProjectName();
    } else if (e.key === 'Escape') {
      handleCancelEditingProjectName();
    }
  };

  const getChildTasks = (parentId: string): Task[] => {
    return tasks.filter(task => task.parentId === parentId);
  };

  const getRootTasks = (): Task[] => {
    return tasks.filter(task => !task.parentId);
  };

  const hasChildren = (taskId: string): boolean => {
    return tasks.some(task => task.parentId === taskId);
  };

  const isTaskCollapsed = (taskId: string): boolean => {
    return collapsedTasks.has(taskId);
  };

  const toggleTaskCollapse = (taskId: string): void => {
    const newCollapsed = new Set(collapsedTasks);
    if (newCollapsed.has(taskId)) {
      newCollapsed.delete(taskId);
    } else {
      newCollapsed.add(taskId);
    }
    setCollapsedTasks(newCollapsed);
  };

  const organizeTasksHierarchically = (): Task[] => {
    const organized: Task[] = [];
    const addTaskAndChildren = (task: Task, level: number = 0) => {
      organized.push({ ...task, level } as Task & { level: number });
      if (!isTaskCollapsed(task.id)) {
        const children = getChildTasks(task.id);
        children.forEach(child => addTaskAndChildren(child, level + 1));
      }
    };
    getRootTasks().forEach(task => addTaskAndChildren(task));
    return organized;
  };

  const allDates = tasks.length > 0 
    ? tasks.flatMap(task => [task.startDate, task.endDate])
    : [new Date()];
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  
  const timelineStart = new Date(minDate);
  timelineStart.setDate(timelineStart.getDate() - 7);
  const timelineEnd = new Date(maxDate);
  timelineEnd.setDate(timelineEnd.getDate() + 7);

  const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));

  const generateDateHeaders = () => {
    const headers = [];
    const currentDate = new Date(timelineStart);
    while (currentDate <= timelineEnd) {
      headers.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return headers;
  };

  const dateHeaders = generateDateHeaders();

  const handleAddTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      const parentId = addingSubtaskTo || taskData.parentId;
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          name: taskData.name,
          start_date: taskData.startDate.toISOString(),
          end_date: taskData.endDate.toISOString(),
          progress: taskData.progress,
          color: taskData.color,
          parent_id: parentId,
          dependencies: taskData.dependencies || [],
          status: taskData.status || 'on-track',
        }])
        .select();

      if (error) throw error;
      if (data) fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsDialogOpen(false);
      setAddingSubtaskTo(null);
    }
  };

  const handleEditTask = async (taskData: Omit<Task, 'id'>) => {
    if (editingTask) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            name: taskData.name,
            start_date: taskData.startDate.toISOString(),
            end_date: taskData.endDate.toISOString(),
            progress: taskData.progress,
            color: taskData.color,
            parent_id: taskData.parentId,
            dependencies: taskData.dependencies || [],
            status: taskData.status || 'on-track',
          })
          .eq('id', editingTask.id);

        if (error) throw error;
        fetchTasks();
      } catch (error) {
        console.error('Error editing task:', error);
      } finally {
        setEditingTask(null);
        setIsDialogOpen(false);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setEditingTask(null);
      setIsDialogOpen(false);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setAddingSubtaskTo(null);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingTask(null);
    setAddingSubtaskTo(null);
    setIsDialogOpen(true);
  };

  const openAddSubtaskDialog = (parentTaskId: string) => {
    setEditingTask(null);
    setAddingSubtaskTo(parentTaskId);
    setIsDialogOpen(true);
  };

  const handleStartInlineAdd = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setInlineFormData({
      name: '',
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      progress: 0,
      color: getNextColor(),
    });
    setIsAddingInline(true);
  };

  const handleCancelInlineAdd = () => {
    setIsAddingInline(false);
  };

  const handleSaveInlineTask = async () => {
    if (!inlineFormData.name.trim()) return;

    const startDate = new Date(inlineFormData.startDate);
    const endDate = new Date(inlineFormData.endDate);

    if (endDate <= startDate) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          name: inlineFormData.name.trim(),
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          progress: inlineFormData.progress,
          color: inlineFormData.color,
          status: 'on-track',
        }]);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error saving inline task:', error);
    } finally {
      handleCancelInlineAdd();
    }
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveInlineTask();
    } else if (e.key === 'Escape') {
      handleCancelInlineAdd();
    }
  };

  const handleOpenDetailDialog = (task: Task) => {
    setDetailTask(task);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateTaskDetail = async (taskId: string, updates: Partial<Task>) => {
    try {
      const payload: any = { ...updates };
      if (updates.startDate) payload.start_date = updates.startDate.toISOString();
      if (updates.endDate) payload.end_date = updates.endDate.toISOString();

      const { error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', taskId);

      if (error) throw error;

      const currentTask = tasks.find(t => t.id === taskId);
      if (currentTask?.parentId) {
        await syncParentTask(currentTask.parentId);
      }

      fetchTasks();
      if (detailTask && detailTask.id === taskId) {
        setDetailTask({ ...detailTask, ...updates });
      }
    } catch (error) {
      console.error('Error updating task detail:', error);
    }
  };

  const syncParentTask = async (parentId: string) => {
    try {
      const { data: children, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_id', parentId);

      if (fetchError) throw fetchError;
      if (!children || children.length === 0) return;

      const totalProgress = children.reduce((sum, child) => sum + child.progress, 0);
      const avgProgress = Math.round(totalProgress / children.length);

      const minStart = new Date(Math.min(...children.map(c => new Date(c.start_date).getTime())));
      const maxEnd = new Date(Math.max(...children.map(c => new Date(c.end_date).getTime())));

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          progress: avgProgress,
          start_date: minStart.toISOString(),
          end_date: maxEnd.toISOString(),
        })
        .eq('id', parentId);

      if (updateError) throw updateError;

      const parentTask = tasks.find(t => t.id === parentId);
      if (parentTask?.parentId) {
        await syncParentTask(parentTask.parentId);
      }
    } catch (error) {
      console.error('Error syncing parent task:', error);
    }
  };

  const organizedTasks = organizeTasksHierarchically();

  if (loading && tasks.length === 0) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground italic">데이터를 불러오는 중...</div>
      </Card>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5" />
            {isEditingProjectName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempProjectName}
                  onChange={(e) => setTempProjectName(e.target.value)}
                  onKeyDown={handleProjectNameKeyDown}
                  onBlur={handleSaveProjectName}
                  className="text-xl font-semibold border-none p-0 h-auto bg-transparent focus:bg-background"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSaveProjectName} className="h-6 w-6 p-0">
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEditingProjectName} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="text-xl font-semibold">{projectName}</h2>
                <Button size="sm" variant="ghost" onClick={handleStartEditingProjectName} className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <ExportMenu tasks={tasks} projectName={projectName} />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  작업 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingTask ? '작업 수정' : addingSubtaskTo ? '하위 작업 추가' : '새 작업 추가'}
                  </DialogTitle>
                  <DialogDescription>작업의 세부 정보를 입력하세요.</DialogDescription>
                </DialogHeader>
                <TaskForm
                  task={editingTask}
                  tasks={tasks}
                  parentTaskId={addingSubtaskTo}
                  onSubmit={editingTask ? handleEditTask : handleAddTask}
                  onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : undefined}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setAddingSubtaskTo(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex border-b border-border">
              <div className="w-64 p-3 border-r border-border bg-muted/50">
                <span className="font-medium">작업 이름</span>
              </div>
              <div className="flex-1 flex">
                {dateHeaders.map((date, index) => (
                  <div key={index} className="flex-1 min-w-[40px] p-2 text-center text-sm border-r border-border bg-muted/30">
                    <div className="font-medium">{date.getDate()}</div>
                    <div className="text-xs text-muted-foreground">{date.toLocaleDateString('en', { month: 'short' })}</div>
                  </div>
                ))}
              </div>
            </div>

            {organizedTasks.map((task) => {
              const taskWithLevel = task as Task & { level: number };
              const level = taskWithLevel.level || 0;
              const isParent = hasChildren(task.id);
              const isCollapsed = isTaskCollapsed(task.id);

              return (
                <div key={task.id} className="flex border-b border-border hover:bg-muted/20 group">
                  <div className="w-64 p-3 border-r border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 w-full">
                      <div style={{ width: `${level * 20}px` }} />
                      {isParent && (
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => toggleTaskCollapse(task.id)}>
                          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      )}
                      {!isParent && <div className="w-4" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{task.name}</div>
                        <div className="text-sm text-muted-foreground">{task.progress}% 완료</div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(task)}>작업 수정</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAddSubtaskDialog(task.id)}>하위 작업 추가</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDetailDialog(task)}>작업 상세</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex-1 relative">
                    <TaskBar
                      task={task}
                      timelineStart={timelineStart}
                      timelineEnd={timelineEnd}
                      totalDays={totalDays}
                      isSubtask={!!task.parentId}
                      onClick={() => handleOpenDetailDialog(task)}
                    />
                  </div>
                </div>
              );
            })}

            {isAddingInline && (
              <div className="flex border-b-2 border-primary bg-primary/5">
                <div className="w-64 p-3 border-r border-border">
                  <div className="space-y-2">
                    <Input
                      value={inlineFormData.name}
                      onChange={(e) => setInlineFormData({ ...inlineFormData, name: e.target.value })}
                      onKeyDown={handleInlineKeyDown}
                      placeholder="작업 이름..."
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Input type="date" value={inlineFormData.startDate} onChange={(e) => setInlineFormData({ ...inlineFormData, startDate: e.target.value })} className="h-7 text-xs" />
                      <Input type="date" value={inlineFormData.endDate} onChange={(e) => setInlineFormData({ ...inlineFormData, endDate: e.target.value })} className="h-7 text-xs" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={handleCancelInlineAdd} className="h-7 px-2 text-xs">
                        <X className="h-3 w-3 mr-1" />취소
                      </Button>
                      <Button size="sm" onClick={handleSaveInlineTask} className="h-7 px-2 text-xs">
                        <Check className="h-3 w-3 mr-1" />추가
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 relative bg-muted/20">
                  {inlineFormData.startDate && inlineFormData.endDate && (
                    <TaskBar
                      task={{
                        id: 'preview',
                        name: inlineFormData.name || '새 작업',
                        startDate: new Date(inlineFormData.startDate),
                        endDate: new Date(inlineFormData.endDate),
                        progress: 0,
                        color: inlineFormData.color,
                      }}
                      timelineStart={timelineStart}
                      timelineEnd={timelineEnd}
                      totalDays={totalDays}
                      isSubtask={false}
                    />
                  )}
                </div>
              </div>
            )}

            {!isAddingInline && (
              <div className="flex border-b border-border bg-muted/10 hover:bg-muted/20">
                <div className="w-64 p-3 border-r border-border">
                  <Button variant="ghost" size="sm" onClick={handleStartInlineAdd} className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
                    <Plus className="h-4 w-4" />새 작업 추가
                  </Button>
                </div>
                <div className="flex-1"></div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <TaskDetailDialog
        task={detailTask}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onUpdateTask={handleUpdateTaskDetail}
      />
    </div>
  );
}
