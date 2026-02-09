import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertCircle, CheckCircle2, Clock, Plus, X, Trash2 } from 'lucide-react';
import { Task, TaskStatus, TaskIssue } from './GanttChart';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const statusConfig = {
  'on-track': {
    label: '정상',
    color: 'bg-green-500',
    icon: CheckCircle2,
    textColor: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  'at-risk': {
    label: '주의',
    color: 'bg-yellow-500',
    icon: Clock,
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
  },
  'delayed': {
    label: '지연',
    color: 'bg-red-500',
    icon: AlertCircle,
    textColor: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
};

export function TaskDetailDialog({ task, open, onOpenChange, onUpdateTask }: TaskDetailDialogProps) {
  const [newIssueText, setNewIssueText] = useState('');

  if (!task) return null;

  const currentStatus: TaskStatus = task.status || 'on-track';
  const currentIssues: TaskIssue[] = task.issues || [];
  const StatusIcon = statusConfig[currentStatus].icon;

  const handleStatusChange = (newStatus: string) => {
    onUpdateTask(task.id, { status: newStatus as TaskStatus });
  };

  const handleAddIssue = () => {
    if (!newIssueText.trim()) return;

    const newIssue: TaskIssue = {
      id: Date.now().toString(),
      description: newIssueText.trim(),
      createdAt: new Date(),
      resolved: false,
    };

    onUpdateTask(task.id, {
      issues: [...currentIssues, newIssue],
    });

    setNewIssueText('');
  };

  const handleToggleIssueResolved = (issueId: string) => {
    const updatedIssues = currentIssues.map(issue =>
      issue.id === issueId
        ? { ...issue, resolved: !issue.resolved }
        : issue
    );

    onUpdateTask(task.id, { issues: updatedIssues });
  };

  const handleDeleteIssue = (issueId: string) => {
    const updatedIssues = currentIssues.filter(issue => issue.id !== issueId);
    onUpdateTask(task.id, { issues: updatedIssues });
  };

  const unresolvedIssues = currentIssues.filter(issue => !issue.resolved);
  const resolvedIssues = currentIssues.filter(issue => issue.resolved);

  // 날짜 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(task.endDate);
  endDate.setHours(0, 0, 0, 0);
  const daysUntilDeadline = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <div 
              className="w-1 h-6 rounded-full" 
              style={{ backgroundColor: task.color }}
            />
            {task.name}
          </DialogTitle>
          <DialogDescription>
            작업의 상세 정보와 진행 상태를 확인하고 관리하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 작업 정보 요약 */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground mb-1">시작일</div>
              <div className="font-medium">
                {task.startDate.toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">종료일</div>
              <div className="font-medium">
                {task.endDate.toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">진행률</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${task.progress}%`,
                      backgroundColor: task.color,
                    }}
                  />
                </div>
                <span className="font-medium text-sm">{task.progress}%</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">마감까지</div>
              <div className={`font-medium ${
                daysUntilDeadline < 0 
                  ? 'text-red-600' 
                  : daysUntilDeadline <= 3 
                  ? 'text-yellow-600' 
                  : 'text-foreground'
              }`}>
                {daysUntilDeadline < 0 
                  ? `${Math.abs(daysUntilDeadline)}일 지연` 
                  : daysUntilDeadline === 0 
                  ? '오늘 마감' 
                  : `${daysUntilDeadline}일 남음`}
              </div>
            </div>
          </div>

          {/* 진행 상태 */}
          <div className="space-y-3">
            <Label>진행 상태</Label>
            <Select value={currentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className={`w-full ${statusConfig[currentStatus].bgColor}`}>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${statusConfig[currentStatus].textColor}`} />
                    <span className={statusConfig[currentStatus].textColor}>
                      {statusConfig[currentStatus].label}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.textColor}`} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 이슈 관리 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>이슈 및 문제점</Label>
              <Badge variant={unresolvedIssues.length > 0 ? 'destructive' : 'secondary'}>
                {unresolvedIssues.length}개 미해결
              </Badge>
            </div>

            {/* 새 이슈 추가 */}
            <div className="flex gap-2">
              <Textarea
                value={newIssueText}
                onChange={(e) => setNewIssueText(e.target.value)}
                placeholder="새 이슈나 문제점을 입력하세요..."
                className="flex-1 min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAddIssue();
                  }
                }}
              />
              <Button
                onClick={handleAddIssue}
                disabled={!newIssueText.trim()}
                className="self-end"
              >
                <Plus className="h-4 w-4 mr-1" />
                추가
              </Button>
            </div>

            {/* 미해결 이슈 목록 */}
            {unresolvedIssues.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">미해결 이슈</div>
                {unresolvedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg"
                  >
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{issue.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(issue.createdAt).toLocaleDateString('ko-KR')} {new Date(issue.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleIssueResolved(issue.id)}
                        className="h-7 px-2"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteIssue(issue.id)}
                        className="h-7 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 해결된 이슈 목록 */}
            {resolvedIssues.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">해결된 이슈</div>
                {resolvedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 p-3 bg-muted/30 border border-border rounded-lg opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-through">{issue.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(issue.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleIssueResolved(issue.id)}
                        className="h-7 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteIssue(issue.id)}
                        className="h-7 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentIssues.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">현재 등록된 이슈가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
