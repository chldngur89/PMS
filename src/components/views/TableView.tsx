import React, { useState } from 'react';
import { MoreHorizontal, ArrowUpDown, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Task, Language } from '../../PMSApp';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { enUS } from 'date-fns/locale/en-US';

interface TableViewProps {
  language: Language;
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updatedTask: Partial<Task>) => void;
}

type SortField = 'title' | 'category' | 'startDate' | 'assignee' | 'priority' | 'progress';
type SortOrder = 'asc' | 'desc';

const translations = {
  ko: {
    title: '테이블 뷰',
    search: '작업 검색...',
    filterCategory: '카테고리 필터',
    allCategories: '전체 카테고리',
    taskTitle: '작업 제목',
    category: '카테고리',
    startDate: '시작일',
    endDate: '종료일',
    assignee: '담당자',
    status: '상태',
    priority: '우선순위',
    progress: '진행률',
    actions: '작업',
    edit: '수정',
    duplicate: '복제',
    delete: '삭제',
    totalTasks: '총',
    tasks: '작업',
    statusTodo: '할 일',
    statusInProgress: '진행 중',
    statusDone: '완료',
    priorityLow: '낮음',
    priorityMedium: '보통',
    priorityHigh: '높음',
  },
  en: {
    title: 'Table View',
    search: 'Search tasks...',
    filterCategory: 'Filter Category',
    allCategories: 'All Categories',
    taskTitle: 'Task Title',
    category: 'Category',
    startDate: 'Start Date',
    endDate: 'End Date',
    assignee: 'Assignee',
    status: 'Status',
    priority: 'Priority',
    progress: 'Progress',
    actions: 'Actions',
    edit: 'Edit',
    duplicate: 'Duplicate',
    delete: 'Delete',
    totalTasks: 'Total',
    tasks: 'tasks',
    statusTodo: 'To Do',
    statusInProgress: 'In Progress',
    statusDone: 'Done',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
  },
};

export function TableView({ language, tasks, onDeleteTask, onUpdateTask }: TableViewProps) {
  const t = translations[language];
  const locale = language === 'ko' ? ko : enUS;

  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = Array.from(new Set(tasks.map(task => task.category)));

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

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
      const matchesSearch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'startDate':
          aValue = a.startDate;
          bValue = b.startDate;
          break;
        case 'assignee':
          aValue = a.assignee || '';
          bValue = b.assignee || '';
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        default:
          return 0;
      }

      if (sortField === 'startDate') {
        return sortOrder === 'asc' 
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime();
      }

      if (sortField === 'priority' || sortField === 'progress') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        <div className="flex items-center space-x-4">
          <Input
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t.filterCategory} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allCategories}</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <SortButton field="title">{t.taskTitle}</SortButton>
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortButton field="category">{t.category}</SortButton>
                </TableHead>
                <TableHead className="w-[150px]">
                  <SortButton field="startDate">{t.startDate}</SortButton>
                </TableHead>
                <TableHead className="w-[150px]">{t.endDate}</TableHead>
                <TableHead className="w-[120px]">
                  <SortButton field="assignee">{t.assignee}</SortButton>
                </TableHead>
                <TableHead className="w-[100px]">{t.status}</TableHead>
                <TableHead className="w-[100px]">
                  <SortButton field="priority">{t.priority}</SortButton>
                </TableHead>
                <TableHead className="w-[150px]">
                  <SortButton field="progress">{t.progress}</SortButton>
                </TableHead>
                <TableHead className="w-[80px]">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTasks.map(task => (
                <TableRow key={task.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: task.color }}
                      />
                      <span className="font-medium truncate">{task.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{task.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(task.startDate, 'yyyy-MM-dd', { locale })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(task.endDate, 'yyyy-MM-dd', { locale })}
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span className="text-sm">{task.assignee}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={task.progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-10">{task.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>{t.edit}</DropdownMenuItem>
                        <DropdownMenuItem>{t.duplicate}</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDeleteTask(task.id)}
                        >
                          {t.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-4 text-sm text-muted-foreground">
        {t.totalTasks}: {filteredAndSortedTasks.length} {t.tasks}
      </div>
    </div>
  );
}
