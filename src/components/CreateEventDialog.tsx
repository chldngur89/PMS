import React, { useState } from 'react';
import { Calendar, Clock, MapPin, FileText, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Event } from '../PMSApp';
import { format } from 'date-fns';
import { toast } from 'sonner@2.0.3';

interface Category {
  name: string;
  color: string;
  count: number;
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