import React, { useState, useEffect } from 'react';
import { PMSSidebar } from './components/PMSSidebar';
import { PMSContent } from './components/PMSContent';
import { CreateTaskDialog } from './components/CreateTaskDialog';
import { Toaster } from './components/ui/sonner';
import { supabase } from './lib/supabase';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export type Language = 'ko' | 'en';

export interface Task {
  id: string;
  title: string;
  category: string;
  startDate: Date;
  endDate: Date;
  assignee?: string;
  description?: string;
  color: string;
  status: 'todo' | 'in-progress' | 'done' | 'on-track' | 'at-risk' | 'delayed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
}

export interface PMSSettings {
  showTasks: boolean;
  showMilestones: boolean;
  showDeadlines: boolean;
}

export default function App({ defaultView = 'month' }: { defaultView?: 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt' }) {
  const [language, setLanguage] = useState<Language>('ko');
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt'>(defaultView);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['개발', '디자인', '마케팅', '기획']);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PMSSettings>({
    showTasks: true,
    showMilestones: true,
    showDeadlines: true,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
          title: task.name,
          category: task.category || '기획',
          startDate: new Date(task.start_date),
          endDate: new Date(task.end_date),
          progress: task.progress,
          color: task.color,
          assignee: task.assignee,
          description: task.description,
          status: task.status as any,
          priority: (task.priority || 'medium') as any,
        }));
        setTasks(mappedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { 
      name: '개발', 
      nameEn: 'Development', 
      color: '#10b981', 
      count: tasks.filter(t => t.category === '개발' && isWithinInterval(t.startDate, { start: startOfMonth(viewDate), end: endOfMonth(viewDate) })).length 
    },
    { 
      name: '디자인', 
      nameEn: 'Design', 
      color: '#f59e0b', 
      count: tasks.filter(t => t.category === '디자인' && isWithinInterval(t.startDate, { start: startOfMonth(viewDate), end: endOfMonth(viewDate) })).length 
    },
    { 
      name: '마케팅', 
      nameEn: 'Marketing', 
      color: '#3b82f6', 
      count: tasks.filter(t => t.category === '마케팅' && isWithinInterval(t.startDate, { start: startOfMonth(viewDate), end: endOfMonth(viewDate) })).length 
    },
    { 
      name: '기획', 
      nameEn: 'Planning', 
      color: '#ef4444', 
      count: tasks.filter(t => t.category === '기획' && isWithinInterval(t.startDate, { start: startOfMonth(viewDate), end: endOfMonth(viewDate) })).length 
    },
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategories.includes(task.category);
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          name: newTask.title,
          category: newTask.category,
          start_date: newTask.startDate.toISOString(),
          end_date: newTask.endDate.toISOString(),
          progress: newTask.progress,
          color: newTask.color,
          assignee: newTask.assignee,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
        }]);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updatedTask: Partial<Task>) => {
    try {
      const payload: any = {};
      if (updatedTask.title) payload.name = updatedTask.title;
      if (updatedTask.category) payload.category = updatedTask.category;
      if (updatedTask.startDate) payload.start_date = updatedTask.startDate.toISOString();
      if (updatedTask.endDate) payload.end_date = updatedTask.endDate.toISOString();
      if (updatedTask.progress !== undefined) payload.progress = updatedTask.progress;
      if (updatedTask.status) payload.status = updatedTask.status;
      if (updatedTask.priority) payload.priority = updatedTask.priority;

      const { error } = await supabase.from('tasks').update(payload).eq('id', taskId);
      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <PMSSidebar
        language={language}
        onLanguageChange={setLanguage}
        currentView={currentView}
        onViewChange={setCurrentView}
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        settings={settings}
        onSettingsChange={setSettings}
        onCreateTask={() => setIsCreateDialogOpen(true)}
      />
      
      <PMSContent
        language={language}
        view={currentView}
        tasks={filteredTasks}
        onDeleteTask={handleDeleteTask}
        onUpdateTask={handleUpdateTask}
        settings={settings}
        viewDate={viewDate}
        onViewDateChange={setViewDate}
      />

      <CreateTaskDialog
        language={language}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTask={handleCreateTask}
        categories={categories}
        defaultDate={viewDate}
      />

      <Toaster />
    </div>
  );
}
