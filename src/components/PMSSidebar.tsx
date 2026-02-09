import React from 'react';
import { Calendar, Search, Settings, Plus, BarChart3, FileText, Target, Clock, Users, FolderKanban, GanttChart, Languages, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { PMSSettings, Language } from '../PMSApp';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface Category {
  name: string;
  nameEn: string;
  color: string;
  count: number;
}

interface PMSSidebarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentView: 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt';
  onViewChange: (view: 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt') => void;
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  settings: PMSSettings;
  onSettingsChange: (settings: PMSSettings) => void;
  onCreateTask: () => void;
}

const translations = {
  ko: {
    title: '프로젝트 관리',
    createTask: '작업 생성',
    search: '작업 검색...',
    views: '보기',
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
  },
  en: {
    title: 'Project Management',
    createTask: 'Create Task',
    search: 'Search tasks...',
    views: 'Views',
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
}: PMSSidebarProps) {
  const navigate = useNavigate();
  const t = translations[language];

  const views = [
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
      <div className="p-4 flex items-center justify-between">
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
