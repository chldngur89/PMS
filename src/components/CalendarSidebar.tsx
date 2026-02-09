import React from 'react';
import { Calendar, Search, Settings, Plus, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { CalendarSettings } from '../PMSApp';

interface Category {
  name: string;
  color: string;
  count: number;
}

interface CalendarSidebarProps {
  currentView: 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt';
  onViewChange: (view: 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt') => void;
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  settings: CalendarSettings;
  onSettingsChange: (settings: CalendarSettings) => void;
  onCreateEvent: () => void;
}

export function CalendarSidebar({
  currentView,
  onViewChange,
  categories,
  selectedCategories,
  onCategoriesChange,
  searchQuery,
  onSearchChange,
  settings,
  onSettingsChange,
  onCreateEvent,
}: CalendarSidebarProps) {
  const views = [
    { id: 'month', name: '月视图', icon: Calendar },
    { id: 'week', name: '周视图', icon: Calendar },
    { id: 'day', name: '日视图', icon: Calendar },
    { id: 'table', name: '表格视图', icon: Filter },
    { id: 'kanban', name: '看板视图', icon: Filter },
    { id: 'gantt', name: '甘特视图', icon: Filter },
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
      {/* 创建日程按钮 */}
      <div className="p-4">
        <Button onClick={onCreateEvent} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          创建日程
        </Button>
      </div>

      <Separator />

      {/* 搜索 */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜索日程..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Separator />

      {/* 视图切换 */}
      <div className="p-4">
        <h3 className="mb-3">视图</h3>
        <div className="space-y-1">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <Button
                key={view.id}
                variant={currentView === view.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => onViewChange(view.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {view.name}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* 日程分类 */}
      <div className="p-4">
        <h3 className="mb-3">日程分类</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => toggleCategory(category.name)}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className={selectedCategories.includes(category.name) ? '' : 'opacity-50'}>
                  {category.name}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {category.count}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* 显示设置 */}
      <div className="p-4 flex-1">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0">
              <div className="flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                显示设置
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-events">显示事件</Label>
              <Switch
                id="show-events"
                checked={settings.showEvents}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, showEvents: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-holidays">显示节假日</Label>
              <Switch
                id="show-holidays"
                checked={settings.showHolidays}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, showHolidays: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-lucky-days">显示黄道吉日</Label>
              <Switch
                id="show-lucky-days"
                checked={settings.showLuckyDays}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, showLuckyDays: checked })
                }
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}