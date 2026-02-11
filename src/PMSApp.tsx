import React, { useState, useEffect } from 'react';
import { PMSSidebar } from './components/PMSSidebar';
import { PMSContent } from './components/PMSContent';
import { CreateTaskDialog } from './components/CreateTaskDialog';
import { Toaster } from './components/ui/sonner';
import { supabase } from './lib/supabase';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Header } from './components/Header';
import { useAuth } from './contexts/AuthContext';
import { LoginDialog } from './components/LoginDialog';

export type Language = 'ko' | 'en';

export interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  online_at: string;
}

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

type DealStageToken = 'lead' | 'discovery' | 'proposal' | 'negotiation' | 'success' | 'failure';
type DealCurrencyToken = 'USD' | 'KRW';

const USD_TO_KRW_RATE = 1350;

const DEAL_STAGE_LABEL_KO: Record<DealStageToken, string> = {
  lead: '리드',
  discovery: '탐색',
  proposal: '제안',
  negotiation: '협상',
  success: '성공',
  failure: '실패',
};

function extractDealStageToken(description?: string): DealStageToken | null {
  if (!description) return null;
  const match = description.match(/\[deal_stage=(lead|discovery|proposal|negotiation|success|failure)\]/);
  if (!match) return null;
  return match[1] as DealStageToken;
}

function extractDealAmountToken(description?: string): number | null {
  if (!description) return null;
  const match = description.match(/\[deal_amount=(\d+)\]/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  return amount;
}

function extractDealCurrencyToken(description?: string): DealCurrencyToken {
  if (!description) return 'USD';
  const match = description.match(/\[deal_currency=(USD|KRW)\]/);
  if (!match) return 'USD';
  return match[1] as DealCurrencyToken;
}

function dealAmountToWon(description?: string): number | null {
  const amount = extractDealAmountToken(description);
  if (amount === null) return null;
  const currency = extractDealCurrencyToken(description);
  return currency === 'KRW' ? amount : Math.round(amount * USD_TO_KRW_RATE);
}

function formatKrw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString()}`;
}

function progressToDealStageToken(progress?: number): DealStageToken | null {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) return null;
  if (progress >= 100) return 'success';
  if (progress >= 97) return 'failure';
  if (progress >= 80) return 'negotiation';
  if (progress >= 60) return 'proposal';
  if (progress >= 35) return 'discovery';
  if (progress >= 0) return 'lead';
  return null;
}

function statusToDealStageToken(status?: Task['status']): DealStageToken | null {
  if (!status) return null;
  if (status === 'delayed') return 'failure';
  if (status === 'at-risk') return 'negotiation';
  if (status === 'on-track') return 'proposal';
  return null;
}

function resolveDealStage(description?: string, progress?: number, status?: Task['status']): DealStageToken | null {
  return extractDealStageToken(description) ?? progressToDealStageToken(progress) ?? statusToDealStageToken(status);
}

function extractMissingColumn(error: any): string | null {
  if (!error) return null;
  const message = typeof error.message === 'string' ? error.message : '';
  const match = message.match(/Could not find the '([^']+)' column/);
  if (!match) return null;
  return match[1];
}

const FALLBACK_TASK_COLUMNS = new Set([
  'id',
  'name',
  'start_date',
  'end_date',
  'progress',
  'color',
  'status',
  'parent_id',
  'dependencies',
  'created_at',
  'updated_at',
]);

export interface PMSSettings {
  showTasks: boolean;
  showMilestones: boolean;
  showDeadlines: boolean;
}

export default function App({ defaultView = 'sales' }: { defaultView?: 'sales' | 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt' }) {
  const [language, setLanguage] = useState<Language>('ko');
  const [currentView, setCurrentView] = useState<'sales' | 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt'>(defaultView);
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
  const [taskColumns, setTaskColumns] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      return;
    }

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as any[];
        setOnlineUsers(users.map(u => ({
          id: u.user_id,
          name: u.user_name || u.email.split('@')[0],
          email: u.email,
          online_at: u.online_at
        })));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: user.user_metadata.full_name || user.email?.split('@')[0],
            email: user.email,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        if (data.length > 0) {
          setTaskColumns(new Set(Object.keys(data[0])));
        }
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

  const handleCreateTask = async (newTask: Omit<Task, 'id'>): Promise<boolean> => {
    try {
      const hasColumn = (column: string) => (
        taskColumns.size === 0 ? FALLBACK_TASK_COLUMNS.has(column) : taskColumns.has(column)
      );
      const insertPayload: Record<string, any> = {
        name: newTask.title,
        start_date: newTask.startDate.toISOString(),
        end_date: newTask.endDate.toISOString(),
        color: newTask.color,
      };

      if (hasColumn('category')) insertPayload.category = newTask.category;
      if (hasColumn('progress')) insertPayload.progress = newTask.progress;
      if (hasColumn('assignee')) insertPayload.assignee = newTask.assignee;
      if (hasColumn('description')) insertPayload.description = newTask.description;
      if (hasColumn('status')) insertPayload.status = newTask.status;
      if (hasColumn('priority')) insertPayload.priority = newTask.priority;

      const payloadForInsert = { ...insertPayload };
      while (true) {
        const { error } = await supabase
          .from('tasks')
          .insert([payloadForInsert])
          .select();
        if (!error) break;

        const missingColumn = extractMissingColumn(error);
        if (missingColumn && missingColumn in payloadForInsert) {
          delete payloadForInsert[missingColumn];
          setTaskColumns((prev) => {
            if (prev.size === 0) return prev;
            const next = new Set(prev);
            next.delete(missingColumn);
            return next;
          });
          continue;
        }
        throw error;
      }

      const createdStage = extractDealStageToken(newTask.description);
      const createDetails = createdStage ? `영업단계: ${DEAL_STAGE_LABEL_KO[createdStage]}` : undefined;
      await logActivity('create', newTask.title, createDetails);
      await fetchTasks();
      return true;
    } catch (error) {
      console.error('Error creating task:', error);
      return false;
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

  const handleUpdateTask = async (taskId: string, updatedTask: Partial<Task>): Promise<boolean> => {
    const originalTask = tasks.find(t => t.id === taskId);
    try {
      const hasColumn = (column: string) => (
        taskColumns.size === 0 ? FALLBACK_TASK_COLUMNS.has(column) : taskColumns.has(column)
      );
      const payload: any = {};
      if (updatedTask.title !== undefined) payload.name = updatedTask.title;
      if (updatedTask.category !== undefined && hasColumn('category')) payload.category = updatedTask.category;
      if (updatedTask.startDate && hasColumn('start_date')) payload.start_date = updatedTask.startDate.toISOString();
      if (updatedTask.endDate && hasColumn('end_date')) payload.end_date = updatedTask.endDate.toISOString();
      if (updatedTask.progress !== undefined && hasColumn('progress')) payload.progress = updatedTask.progress;
      if (updatedTask.status !== undefined && hasColumn('status')) payload.status = updatedTask.status;
      if (updatedTask.priority !== undefined && hasColumn('priority')) payload.priority = updatedTask.priority;
      if (updatedTask.assignee !== undefined && hasColumn('assignee')) payload.assignee = updatedTask.assignee;
      if (updatedTask.description !== undefined && hasColumn('description')) payload.description = updatedTask.description;
      if (updatedTask.color !== undefined && hasColumn('color')) payload.color = updatedTask.color;

      if (Object.keys(payload).length === 0) {
        return true;
      }

      const payloadForUpdate = { ...payload };
      while (true) {
        const { error } = await supabase.from('tasks').update(payloadForUpdate).eq('id', taskId);
        if (!error) break;

        const missingColumn = extractMissingColumn(error);
        if (missingColumn && missingColumn in payloadForUpdate) {
          delete payloadForUpdate[missingColumn];
          setTaskColumns((prev) => {
            if (prev.size === 0) return prev;
            const next = new Set(prev);
            next.delete(missingColumn);
            return next;
          });
          if (Object.keys(payloadForUpdate).length === 0) {
            return true;
          }
          continue;
        }
        throw error;
      }

      if (originalTask) {
        const details: string[] = [];
        if (updatedTask.title && originalTask.title !== updatedTask.title) {
          details.push(`이름 변경: ${originalTask.title} -> ${updatedTask.title}`);
        }

        const originalStage = resolveDealStage(originalTask.description, originalTask.progress, originalTask.status);
        const nextStage = resolveDealStage(
          updatedTask.description ?? originalTask.description,
          updatedTask.progress ?? originalTask.progress,
          updatedTask.status ?? originalTask.status,
        );
        if (originalStage && nextStage && originalStage !== nextStage) {
          details.push(`영업단계 변경: ${DEAL_STAGE_LABEL_KO[originalStage]} -> ${DEAL_STAGE_LABEL_KO[nextStage]}`);
        }

        const originalAmount = dealAmountToWon(originalTask.description);
        const nextAmount = dealAmountToWon(updatedTask.description ?? originalTask.description);
        if (originalAmount !== null && nextAmount !== null && originalAmount !== nextAmount) {
          details.push(`거래금액 변경: ${formatKrw(originalAmount)} -> ${formatKrw(nextAmount)}`);
        }

        const entityName = updatedTask.title ?? originalTask.title;
        await logActivity('update', entityName, details.length > 0 ? details.join(' / ') : undefined);
      }
      
      await fetchTasks();
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
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

  if (authLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-400 italic">로딩 중...</div>;
  }

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
        members={onlineUsers.map(u => ({
          id: u.id,
          name: u.name,
          role: 'Online',
          color: '#3b82f6'
        }))}
        tasks={tasks}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onlineUsers={onlineUsers}
          onLoginClick={() => setIsLoginDialogOpen(true)}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        <PMSContent
          language={language}
          view={currentView}
          tasks={filteredTasks}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleUpdateTask}
          onCreateTask={handleCreateTask}
          settings={settings}
          viewDate={viewDate}
          onViewDateChange={setViewDate}
          members={onlineUsers.map(u => ({
            id: u.id,
            name: u.name,
            role: 'Team Member',
            color: '#3b82f6'
          }))}
          categories={categories.map((category) => ({
            name: category.name,
            color: category.color,
          }))}
        />
      </div>

      <CreateTaskDialog
        language={language}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTask={handleCreateTask}
        categories={categories}
        defaultDate={viewDate}
        members={onlineUsers.map(u => ({
          id: u.id,
          name: u.name,
          role: 'Team Member',
          color: '#3b82f6'
        }))}
      />

      <LoginDialog 
        open={isLoginDialogOpen} 
        onOpenChange={setIsLoginDialogOpen} 
      />

      <Toaster />
    </div>
  );
}
