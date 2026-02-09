import React, { useState, useEffect } from 'react';
import { PMSSidebar } from './components/PMSSidebar';
import { PMSContent } from './components/PMSContent';
import { CreateTaskDialog } from './components/CreateTaskDialog';
import { Toaster } from './components/ui/sonner';
import { supabase } from './lib/supabase';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export type Language = 'ko' | 'en';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  color: string;
}

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
  const [members, setMembers] = useState<TeamMember[]>([
    { id: 'm1', name: '김철수', role: 'Project Manager', color: '#3b82f6' },
    { id: 'm2', name: '이영희', role: 'UI/UX Designer', color: '#ec4899' },
    { id: 'm3', name: '박지훈', role: 'Frontend Developer', color: '#10b981' },
    { id: 'm4', name: '최민지', role: 'Backend Developer', color: '#f59e0b' },
  ]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const logActivity = async (action: string, entity: string, details?: string) => {
    try {
      await supabase.from('activity_logs').insert([{
        action_type: action,
        entity_name: entity,
        details: details,
        user_name: '사용자'
      }]);
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const handleCreateTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      const { data, error } = await supabase
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
        }])
        .select();

      if (error) throw error;
      await logActivity('create', newTask.title);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      if (taskToDelete) await logActivity('delete', taskToDelete.title);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updatedTask: Partial<Task>) => {
    const originalTask = tasks.find(t => t.id === taskId);
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
      
      if (originalTask && updatedTask.title && originalTask.title !== updatedTask.title) {
        await logActivity('update', updatedTask.title, `이름 변경`);
      } else if (originalTask) {
        await logActivity('update', originalTask.title);
      }
      
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategories.includes(task.category);
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  const projectStats = {
    total: tasks.length,
    delayed: tasks.filter(t => t.status === 'delayed' || t.status === 'at-risk').length,
    completed: tasks.filter(t => t.status === 'done' || t.progress === 100).length,
    inProgress: tasks.filter(t => t.status === 'in-progress' || (t.progress > 0 && t.progress < 100)).length,
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
        stats={projectStats}
        members={members}
        tasks={tasks}
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
        members={members}
      />

      <CreateTaskDialog
        language={language}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTask={handleCreateTask}
        categories={categories}
        defaultDate={viewDate}
        members={members}
      />

      <Toaster />
    </div>
  );
}
