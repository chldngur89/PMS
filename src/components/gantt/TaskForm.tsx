import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Trash2 } from 'lucide-react';
import { Task } from './GanttChart';

interface TaskFormProps {
  task?: Task | null;
  tasks: Task[];
  parentTaskId?: string | null;
  onSubmit: (taskData: Omit<Task, 'id'>) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const predefinedColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

// hex를 HSL로 변환
const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

// HSL을 hex로 변환
const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// 하위 작업 색상 생성 (HSL 기반으로 채도 유지하며 명도만 증가)
const getSubtaskColor = (parentColor: string, depth: number = 1): string => {
  const hsl = hexToHSL(parentColor);
  
  // depth에 따라 명도를 증가시키되, 최대 80%로 제한
  const lightnessIncrease = 12 * depth;
  const newLightness = Math.min(80, hsl.l + lightnessIncrease);
  
  // 채도는 약간만 감소
  const newSaturation = Math.max(40, hsl.s - (depth * 5));
  
  return hslToHex(hsl.h, newSaturation, newLightness);
};

// 부모의 depth를 계산하여 현재 작업의 depth 결정
const getParentDepth = (parentId: string, allTasks: Task[]): number => {
  const parent = allTasks.find(t => t.id === parentId);
  if (!parent) return 0;
  
  let depth = 1;
  let currentTask = parent;
  
  while (currentTask.parentId) {
    depth++;
    const nextParent = allTasks.find(t => t.id === currentTask.parentId);
    if (!nextParent) break;
    currentTask = nextParent;
  }
  
  return depth;
};

// 루트 색상 찾기
const getRootColor = (parentId: string, allTasks: Task[]): string => {
  const parent = allTasks.find(t => t.id === parentId);
  if (!parent) return predefinedColors[0];
  
  let currentTask = parent;
  while (currentTask.parentId) {
    const nextParent = allTasks.find(t => t.id === currentTask.parentId);
    if (!nextParent) break;
    currentTask = nextParent;
  }
  
  return currentTask.color;
};

export function TaskForm({ task, tasks, parentTaskId, onSubmit, onDelete, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    progress: 0,
    color: predefinedColors[0],
    parentId: '',
  });

  // Get potential parent tasks (exclude current task and its descendants if editing)
  const getPotentialParents = (): Task[] => {
    const getDescendantIds = (taskId: string): string[] => {
      const descendants = tasks.filter(t => t.parentId === taskId);
      return descendants.reduce((acc, desc) => {
        return [...acc, desc.id, ...getDescendantIds(desc.id)];
      }, [] as string[]);
    };

    let excludeIds: string[] = [];
    if (task) {
      excludeIds = [task.id, ...getDescendantIds(task.id)];
    }

    return tasks.filter(t => !excludeIds.includes(t.id) && !t.parentId);
  };

  const potentialParents = getPotentialParents();

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        startDate: task.startDate.toISOString().split('T')[0],
        endDate: task.endDate.toISOString().split('T')[0],
        progress: task.progress,
        color: task.color,
        parentId: task.parentId || '',
      });
    } else {
      // Set default dates for new tasks
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      // If adding a subtask, inherit parent's color and set dates within parent's range
      let defaultColor = predefinedColors[0];
      let defaultStartDate = today.toISOString().split('T')[0];
      let defaultEndDate = nextWeek.toISOString().split('T')[0];
      
      if (parentTaskId) {
        const parentTask = tasks.find(t => t.id === parentTaskId);
        if (parentTask) {
          defaultColor = getSubtaskColor(parentTask.color, getParentDepth(parentTaskId, tasks) + 1);
          defaultStartDate = parentTask.startDate.toISOString().split('T')[0];
          defaultEndDate = parentTask.endDate.toISOString().split('T')[0];
        }
      }
      
      setFormData({
        name: '',
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        progress: 0,
        color: defaultColor,
        parentId: parentTaskId || '',
      });
    }
  }, [task, parentTaskId, tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      alert('종료일은 시작일 이후여야 합니다');
      return;
    }

    // Validate subtask dates are within parent's range
    if (formData.parentId) {
      const parentTask = tasks.find(t => t.id === formData.parentId);
      if (parentTask) {
        if (startDate < parentTask.startDate || endDate > parentTask.endDate) {
          alert('하위 작업 날짜는 상위 작업의 날짜 범위 내에 있어야 합니다');
          return;
        }
      }
    }

    onSubmit({
      name: formData.name.trim(),
      startDate,
      endDate,
      progress: formData.progress,
      color: formData.color,
      parentId: formData.parentId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="taskName">작업 이름</Label>
        <Input
          id="taskName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="작업 이름을 입력하세요"
          required
        />
      </div>

      {/* Parent Task Selection */}
      {!parentTaskId && potentialParents.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="parentTask">상위 작업 (선택사항)</Label>
          <Select 
            value={formData.parentId || 'none'} 
            onValueChange={(value) => {
              const newParentId = value === 'none' ? '' : value;
              let newColor = formData.color;
              
              // 상위 작업이 선택되면 해당 작업의 색상을 기반으로 색상 변경
              if (newParentId) {
                const parentTask = tasks.find(t => t.id === newParentId);
                if (parentTask) {
                  newColor = getSubtaskColor(parentTask.color, getParentDepth(newParentId, tasks) + 1);
                }
              }
              
              setFormData({ ...formData, parentId: newParentId, color: newColor });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="상위 작업 선택 (선택사항)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">상위 작업 없음 (최상위 작업)</SelectItem>
              {potentialParents.map((parentTask) => (
                <SelectItem key={parentTask.id} value={parentTask.id}>
                  {parentTask.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Show parent task if adding subtask */}
      {parentTaskId && (
        <div className="space-y-2">
          <Label>상위 작업</Label>
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            {tasks.find(t => t.id === parentTaskId)?.name}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">시작일</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">종료일</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>진행률: {formData.progress}%</Label>
        <Slider
          value={[formData.progress]}
          onValueChange={(value) => setFormData({ ...formData, progress: value[0] })}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      {/* 색상 선택은 최상위 작업일 때만 표시 */}
      {!formData.parentId && !parentTaskId && (
        <div className="space-y-2">
          <Label>색상</Label>
          <div className="flex gap-2 flex-wrap">
            {predefinedColors.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-md border-2 transition-all ${
                  formData.color === color 
                    ? 'border-foreground scale-110' 
                    : 'border-border hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, color })}
              />
            ))}
          </div>
        </div>
      )}

      {/* 하위 작업일 때는 자동 색상 표시 */}
      {(formData.parentId || parentTaskId) && (
        <div className="space-y-2">
          <Label>색상</Label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div 
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: formData.color }}
            />
            <span>자동 선택됨 (상위 작업 색상 기반)</span>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <div>
          {onDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit">
            {task ? '작업 업데이트' : parentTaskId ? '하위 작업 추가' : '작업 추가'}
          </Button>
        </div>
      </div>
    </form>
  );
}