import React, { useState } from 'react';
import { Calendar, Clock, MapPin, FileText, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Event, Language } from '../PMSApp';
import { format } from 'date-fns';

interface Category {
  name: string;
  color: string;
  count: number;
}

interface CreateEventDialogProps {
  language: Language;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateEvent: (event: Omit<Event, 'id'>) => void;
  categories: Category[];
}

const translations = {
  ko: {
    title: '일정 생성',
    eventTitle: '일정 제목',
    eventTitlePlaceholder: '일정 제목을 입력하세요',
    category: '카테고리',
    categoryPlaceholder: '카테고리 선택',
    startTime: '시작 시간',
    endTime: '종료 시간',
    location: '장소',
    locationPlaceholder: '장소 (선택사항)',
    description: '설명',
    descriptionPlaceholder: '일정 설명 (선택사항)',
    cancel: '취소',
    create: '생성',
    errorTitle: '일정 제목을 입력하세요',
    errorCategory: '카테고리를 선택하세요',
    errorDate: '종료 시간은 시작 시간보다 늦어야 합니다',
    successCreate: '일정이 생성되었습니다',
  },
  en: {
    title: 'Create Event',
    eventTitle: 'Event Title',
    eventTitlePlaceholder: 'Enter event title',
    category: 'Category',
    categoryPlaceholder: 'Select category',
    startTime: 'Start Time',
    endTime: 'End Time',
    location: 'Location',
    locationPlaceholder: 'Location (optional)',
    description: 'Description',
    descriptionPlaceholder: 'Event description (optional)',
    cancel: 'Cancel',
    create: 'Create',
    errorTitle: 'Please enter event title',
    errorCategory: 'Please select category',
    errorDate: 'End time must be after start time',
    successCreate: 'Event created successfully',
  },
};

export function CreateEventDialog({
  language,
  open,
  onOpenChange,
  onCreateEvent,
  categories,
}: CreateEventDialogProps) {
  const t = translations[language];
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endDate: format(new Date(), 'yyyy-MM-dd'),
    endTime: '10:00',
    location: '',
    description: '',
  });

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

    const newEvent: Omit<Event, 'id'> = {
      title: formData.title.trim(),
      category: formData.category,
      startDate: startDateTime,
      endDate: endDateTime,
      location: formData.location.trim() || undefined,
      description: formData.description.trim() || undefined,
      color: selectedCategory?.color || '#3b82f6',
    };

    onCreateEvent(newEvent);
    toast.success(t.successCreate);
    
    setFormData({
      title: '',
      category: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endDate: format(new Date(), 'yyyy-MM-dd'),
      endTime: '10:00',
      location: '',
      description: '',
    });
    
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{t.title}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>{t.eventTitle} *</span>
            </Label>
            <Input
              id="title"
              placeholder={t.eventTitlePlaceholder}
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

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
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{t.location}</span>
            </Label>
            <Input
              id="location"
              placeholder={t.locationPlaceholder}
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>

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


interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateEvent: (event: Omit<Event, 'id'>) => void;
  categories: Category[];
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onCreateEvent,
  categories,
}: CreateEventDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endDate: format(new Date(), 'yyyy-MM-dd'),
    endTime: '10:00',
    location: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('请输入日程标题');
      return;
    }
    
    if (!formData.category) {
      toast.error('请选择日程分类');
      return;
    }

    const selectedCategory = categories.find(c => c.name === formData.category);
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      toast.error('结束时间必须晚于开始时间');
      return;
    }

    const newEvent: Omit<Event, 'id'> = {
      title: formData.title.trim(),
      category: formData.category,
      startDate: startDateTime,
      endDate: endDateTime,
      location: formData.location.trim() || undefined,
      description: formData.description.trim() || undefined,
      color: selectedCategory?.color || '#3b82f6',
    };

    onCreateEvent(newEvent);
    toast.success('日程创建成功');
    
    // 重置表单
    setFormData({
      title: '',
      category: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endDate: format(new Date(), 'yyyy-MM-dd'),
      endTime: '10:00',
      location: '',
      description: '',
    });
    
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>创建日程</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>标题 *</span>
            </Label>
            <Input
              id="title"
              placeholder="请输入日程标题"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          {/* 分类 */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Tag className="w-4 h-4" />
              <span>分类 *</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择日程分类" />
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
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 时间 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>开始时间</span>
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
                <span>结束时间</span>
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

          {/* 地点 */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>地点</span>
            </Label>
            <Input
              id="location"
              placeholder="请输入地点（可选）"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              placeholder="请输入日程描述（可选）"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">
              创建日程
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}