import React, { useState } from 'react';
import { Calendar, Clock, User, FileText, Tag, Target, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Task, Language } from '../PMSApp';
import { format } from 'date-fns';
import { toast } from 'sonner@2.0.3';

interface Category {
  name: string;
  nameEn: string;
  color: string;
  count: number;
}

interface CreateTaskDialogProps {
  language: Language;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: Omit<Task, 'id'>) => void;
  categories: Category[];
  defaultDate?: Date;
}

const translations = {
  ko: {
    title: '작업 생성',
    taskTitle: '작업 제목',
    taskTitlePlaceholder: '작업 제목을 입력하세요',
    category: '카테고리',
    categoryPlaceholder: '카테고리 선택',
    startTime: '시작일',
    endTime: '종료일',
    assignee: '담당자',
    assigneePlaceholder: '담당자 이름 (선택사항)',
    status: '상태',
    statusTodo: '할 일',
    statusInProgress: '진행 중',
    statusDone: '완료',
    priority: '우선순위',
    priorityLow: '낮음',
    priorityMedium: '보통',
    priorityHigh: '높음',
    progress: '진행률',
    description: '설명',
    descriptionPlaceholder: '작업 설명 (선택사항)',
    cancel: '취소',
    create: '생성',
    errorTitle: '작업 제목을 입력하세요',
    errorCategory: '카테고리를 선택하세요',
    errorDate: '종료일은 시작일보다 늦어야 합니다',
    successCreate: '작업이 생성되었습니다',
  },
  en: {
    title: 'Create Task',
    taskTitle: 'Task Title',
    taskTitlePlaceholder: 'Enter task title',
    category: 'Category',
    categoryPlaceholder: 'Select category',
    startTime: 'Start Date',
    endTime: 'End Date',
    assignee: 'Assignee',
    assigneePlaceholder: 'Assignee name (optional)',
    status: 'Status',
    statusTodo: 'To Do',
    statusInProgress: 'In Progress',
    statusDone: 'Done',
    priority: 'Priority',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    progress: 'Progress',
    description: 'Description',
    descriptionPlaceholder: 'Task description (optional)',
    cancel: 'Cancel',
    create: 'Create',
    errorTitle: 'Please enter task title',
    errorCategory: 'Please select category',
    errorDate: 'End date must be after start date',
    successCreate: 'Task created successfully',
  },
};

export function CreateTaskDialog({
  language,
  open,
  onOpenChange,
  onCreateTask,
  categories,
  defaultDate = new Date(),
}: CreateTaskDialogProps) {
  const t = translations[language];
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    startDate: format(defaultDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    endDate: format(defaultDate, 'yyyy-MM-dd'),
    endTime: '18:00',
    assignee: '',
    description: '',
    status: 'todo' as 'todo' | 'in-progress' | 'done',
    priority: 'medium' as 'low' | 'medium' | 'high',
    progress: 0,
  });

  React.useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        startDate: format(defaultDate, 'yyyy-MM-dd'),
        endDate: format(defaultDate, 'yyyy-MM-dd'),
      }));
    }
  }, [open, defaultDate]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error(t.errorTitle);
      return;
    }
    
    if (!formData.category) {
      toast.error(t.errorCategory);
      return;
    }

    const selectedCategory = categories.find(c => c.name === formData.category);
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      toast.error(t.errorDate);
      return;
    }

    const newTask: Omit<Task, 'id'> = {
      title: formData.title.trim(),
      category: formData.category,
      startDate: startDateTime,
      endDate: endDateTime,
      assignee: formData.assignee.trim() || undefined,
      description: formData.description.trim() || undefined,
      color: selectedCategory?.color || '#3b82f6',
      status: formData.status,
      priority: formData.priority,
      progress: formData.progress,
    };

    onCreateTask(newTask);
    toast.success(t.successCreate);
    
    // Reset form
    setFormData({
      title: '',
      category: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endDate: format(new Date(), 'yyyy-MM-dd'),
      endTime: '18:00',
      assignee: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      progress: 0,
    });
    
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{t.title}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>{t.taskTitle} *</span>
            </Label>
            <Input
              id="title"
              placeholder={t.taskTitlePlaceholder}
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Tag className="w-4 h-4" />
              <span>{t.category} *</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t.categoryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.name} value={category.name}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                      <span className="text-xs text-muted-foreground">({category.nameEn})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{t.startTime}</span>
              </Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{t.endTime}</span>
              </Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{t.assignee}</span>
            </Label>
            <Input
              id="assignee"
              placeholder={t.assigneePlaceholder}
              value={formData.assignee}
              onChange={(e) => handleInputChange('assignee', e.target.value)}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>{t.status}</span>
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">{t.statusTodo}</SelectItem>
                  <SelectItem value="in-progress">{t.statusInProgress}</SelectItem>
                  <SelectItem value="done">{t.statusDone}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>{t.priority}</span>
              </Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t.priorityLow}</SelectItem>
                  <SelectItem value="medium">{t.priorityMedium}</SelectItem>
                  <SelectItem value="high">{t.priorityHigh}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{t.progress}</span>
              <span className="text-sm text-muted-foreground">{formData.progress}%</span>
            </Label>
            <Slider
              value={[formData.progress]}
              onValueChange={(value) => handleInputChange('progress', value[0])}
              max={100}
              step={5}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t.description}</Label>
            <Textarea
              id="description"
              placeholder={t.descriptionPlaceholder}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit">
              {t.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
