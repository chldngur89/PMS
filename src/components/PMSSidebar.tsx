import React from 'react';
import { Calendar, Search, Settings, Plus, BarChart3, FileText, Target, Clock, Users, FolderKanban, GanttChart, Languages, Home, Radio, User, PieChart } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { PMSSettings, Language } from '../PMSApp';
import { useNavigate } from 'react-router-dom';
import { TeamMember, Task } from '../PMSApp';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface PMSSidebarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentView: 'sales' | 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt';
  onViewChange: (view: 'sales' | 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt') => void;
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  settings: PMSSettings;
  onSettingsChange: (settings: PMSSettings) => void;
  onCreateTask: () => void;
  stats: {
    total: number;
    delayed: number;
    completed: number;
    inProgress: number;
  };
  members: TeamMember[];
  tasks: Task[];
}

const translations = {
  ko: {
    title: '프로젝트 관리',
    createTask: '작업 생성',
    search: '작업 검색...',
    views: '보기',
    salesView: 'Sales 대시보드',
    ganttView: '간트 차트',
    kanbanView: '칸반 보드',
    tableView: '테이블 뷰',
    monthView: '월간 달력',
    weekView: '주간 달력',
    dayView: '일간 달력',
    categories: '프로젝트 카테고리',
    displaySettings: '표시 설정',
    showTasks: '작업 표시',
    showMilestones: '마일스톤 표시',
    showDeadlines: '마감일 표시',
    backToHome: '포털로 돌아가기',
    healthStatus: '프로젝트 상태',
    delayed: '지연',
    onTrack: '정상',
    done: '완료',
    team: '팀 멤버',
  },
  en: {
    title: 'Project Management',
    createTask: 'Create Task',
    search: 'Search tasks...',
    views: 'Views',
    salesView: 'Sales Dashboard',
    ganttView: 'Gantt Chart',
    kanbanView: 'Kanban Board',
    tableView: 'Table View',
    monthView: 'Month Calendar',
    weekView: 'Week Calendar',
    dayView: 'Day Calendar',
    categories: 'Project Categories',
    displaySettings: 'Display Settings',
    showTasks: 'Show Tasks',
    showMilestones: 'Show Milestones',
    showDeadlines: 'Show Deadlines',
    backToHome: 'Back to Portal',
    healthStatus: 'Project Health',
    delayed: 'Delayed',
    onTrack: 'On Track',
    done: 'Done',
    team: 'Team Members',
  },
};

export function PMSSidebar({
  language,
  onLanguageChange,
  currentView,
  onViewChange,
  categories,
  selectedCategories,
  onCategoriesChange,
  searchQuery,
  onSearchChange,
  settings,
  onSettingsChange,
  onCreateTask,
  stats,
  members,
  tasks,
}: PMSSidebarProps) {
  const navigate = useNavigate();
  const t = translations[language];


  const views = [
    { id: 'sales', name: t.salesView, icon: PieChart },
    { id: 'gantt', name: t.ganttView, icon: GanttChart },
    { id: 'kanban', name: t.kanbanView, icon: FolderKanban },
    { id: 'table', name: t.tableView, icon: BarChart3 },
    { id: 'month', name: t.monthView, icon: Calendar },
    { id: 'week', name: t.weekView, icon: Clock },
    { id: 'day', name: t.dayView, icon: Target },
  ] as const;

  const toggleCategory = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onCategoriesChange(selectedCategories.filter(c => c !== categoryName));
    } else {
      onCategoriesChange([...selectedCategories, categoryName]);
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Home size={18} />
            </div>
            <h2 className="font-semibold text-lg">{t.title}</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onLanguageChange('ko')}>
                한국어 (Korean)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onLanguageChange('en')}>
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100">
           <div className="flex flex-col items-center p-2 rounded-xl bg-rose-50/50">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{t.delayed}</span>
              <span className="text-sm font-black text-rose-600">{stats.delayed}</span>
           </div>
           <div className="flex flex-col items-center p-2 rounded-xl bg-blue-50/50">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{t.onTrack}</span>
              <span className="text-sm font-black text-blue-600">{stats.inProgress}</span>
           </div>
           <div className="flex flex-col items-center p-2 rounded-xl bg-emerald-50/50">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">{t.done}</span>
              <span className="text-sm font-black text-emerald-600">{stats.completed}</span>
           </div>
        </div>
      </div>

      <Separator />

      <div className="p-4">
        <Button onClick={onCreateTask} className="w-full shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          {t.createTask}
        </Button>
      </div>

      <Separator />

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Separator />

      <div className="p-4 flex-grow overflow-y-auto">
        <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.views}</h3>
        <div className="space-y-1 mb-6">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <Button
                key={view.id}
                variant={currentView === view.id ? 'secondary' : 'ghost'}
                className="w-full justify-start font-medium"
                onClick={() => onViewChange(view.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {view.name}
              </Button>
            );
          })}
        </div>

        <Separator className="mb-6" />

        <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.categories}</h3>
        <div className="space-y-1 mb-6">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => toggleCategory(category.name)}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex flex-col">
                  <span className={`text-sm ${selectedCategories.includes(category.name) ? 'font-medium' : 'opacity-50'}`}>
                    {category.name}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center px-1">
                {category.count}
              </Badge>
            </div>
          ))}
        </div>

        <Separator className="mb-6" />

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.team}</h3>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] gap-1 px-1.5 h-5">
            <Radio size={10} className="animate-pulse" /> {members.length}
          </Badge>
        </div>
        <div className="space-y-3 mb-6">
          {members.length === 0 ? (
            <div className="py-2 text-center">
              <p className="text-[11px] text-slate-400 italic">접속 중인 멤버가 없습니다.</p>
            </div>
          ) : (
            members.map((member) => {
              const memberTasks = tasks.filter(t => t.assignee === member.name && t.status !== 'done');
              return (
                <div key={member.id} className="flex items-center justify-between group/member">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.substring(0, 2)}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{member.name}</span>
                      <span className="text-[10px] text-slate-400">{member.role}</span>
                    </div>
                  </div>
                  {memberTasks.length > 0 && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 border-slate-200 text-slate-400">
                      {memberTasks.length}
                    </Badge>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mb-6 p-3 bg-slate-50/50 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <User size={14} className="text-blue-500" />
            <span className="text-[11px] font-bold text-slate-800">Team Insights</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            현재 프로젝트에 {members.length}명의 팀원이 실시간으로 협업 중입니다.
          </p>
        </div>

        <Separator className="mb-6" />

        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
              <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t.displaySettings}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-tasks" className="text-sm cursor-pointer">{t.showTasks}</Label>
              <Switch
                id="show-tasks"
                checked={settings.showTasks}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, showTasks: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-milestones" className="text-sm cursor-pointer">{t.showMilestones}</Label>
              <Switch
                id="show-milestones"
                checked={settings.showMilestones}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, showMilestones: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-deadlines" className="text-sm cursor-pointer">{t.showDeadlines}</Label>
              <Switch
                id="show-deadlines"
                checked={settings.showDeadlines}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, showDeadlines: checked })
                }
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Separator />
      
      <div className="p-4 bg-muted/30">
        <Button 
          variant="outline" 
          className="w-full justify-start text-muted-foreground hover:text-foreground border-dashed"
          onClick={() => navigate('/')}
        >
          <Home className="w-4 h-4 mr-2" />
          {t.backToHome}
        </Button>
      </div>
    </div>
  );
}
