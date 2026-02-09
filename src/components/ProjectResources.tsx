import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileText, Download, Plus, Trash2, ExternalLink, BookOpen, History, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ProjectFile {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  size: string;
  uploaded_by: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  user_name: string;
  action_type: 'create' | 'update' | 'delete' | 'upload';
  entity_name: string;
  details?: string;
  created_at: string;
}

export function ProjectResources() {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [readme, setReadme] = useState<string>('# 프로젝트 개요\n\n이 프로젝트는 효율적인 프로젝트 관리를 위한 통합 플랫폼입니다.\n\n## 주요 목표\n- 실시간 일정 트래킹\n- 리소스 최적화\n- 팀 협업 강화');
  const [isEditingReadme, setIsEditingReadme] = useState(false);
  const [tempReadme, setTempReadme] = useState('');
  const [activeTab, setActiveTab] = useState<'docs' | 'files' | 'history'>('docs');

  useEffect(() => {
    fetchFiles();
    fetchProjectInfo();
    fetchActivities();

    const channel = supabase
      .channel('activity-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFiles = async () => {
    const { data, error } = await supabase.from('project_files').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching files:', error);
    else if (data) setFiles(data);
  };

  const fetchActivities = async () => {
    const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) console.error('Error fetching activities:', error);
    else if (data) setActivities(data as ActivityLog[]);
  };

  const fetchProjectInfo = async () => {
    const { data, error } = await supabase.from('project_info').select('*').limit(1).single();
    if (error) {
      if (error.code !== 'PGRST116') console.error('Error fetching project info:', error);
    } else if (data) {
      setReadme(data.content);
    }
  };

  const handleSaveReadme = async () => {
    const { data: existing } = await supabase.from('project_info').select('id').limit(1).single();
    
    let error;
    if (existing) {
      const { error: updateError } = await supabase.from('project_info').update({ content: tempReadme }).eq('id', existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('project_info').insert([{ content: tempReadme }]);
      error = insertError;
    }

    if (error) {
      toast.error('저장 실패');
    } else {
      setReadme(tempReadme);
      setIsEditingReadme(false);
      toast.success('저장 완료');
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create': return <PlusCircle className="text-emerald-500" size={14} />;
      case 'update': return <CheckCircle2 className="text-blue-500" size={14} />;
      case 'delete': return <AlertCircle className="text-rose-500" size={14} />;
      default: return <History className="text-slate-400" size={14} />;
    }
  };

  const getActionText = (log: ActivityLog) => {
    const time = formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ko });
    switch (log.action_type) {
      case 'create': return <span><b>{log.user_name}</b>님이 새 작업 <b>{log.entity_name}</b>을(를) 생성했습니다. <small className="text-slate-400 ml-1">{time}</small></span>;
      case 'update': return <span><b>{log.user_name}</b>님이 <b>{log.entity_name}</b>을(를) 수정했습니다. <small className="text-slate-400 ml-1">{time}</small></span>;
      case 'delete': return <span><b>{log.user_name}</b>님이 작업 <b>{log.entity_name}</b>을(를) 삭제했습니다. <small className="text-slate-400 ml-1">{time}</small></span>;
      default: return <span>활동이 기록되었습니다. <small className="text-slate-400 ml-1">{time}</small></span>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <Card className="md:col-span-2 shadow-sm border-none bg-slate-50/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${activeTab === 'docs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <BookOpen size={16} /> 프로젝트 가이드
            </button>
            <button 
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${activeTab === 'files' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FileText size={16} /> 파일 자산
            </button>
          </div>
          {activeTab === 'docs' && (
            !isEditingReadme ? (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setTempReadme(readme); setIsEditingReadme(true); }}>수정</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditingReadme(false)}>취소</Button>
                <Button size="sm" className="h-7 text-xs px-3" onClick={handleSaveReadme}>저장</Button>
              </div>
            )
          )}
        </CardHeader>
        <CardContent>
          {activeTab === 'docs' ? (
            isEditingReadme ? (
              <textarea
                className="w-full h-64 p-3 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                value={tempReadme}
                onChange={(e) => setTempReadme(e.target.value)}
              />
            ) : (
              <div className="prose prose-slate max-w-none h-64 overflow-y-auto bg-white p-4 rounded-xl border border-slate-100 shadow-inner">
                {readme.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('#') ? 'font-bold text-slate-900 mt-2' : 'text-slate-600 text-sm'}>{line}</p>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-2 h-64 overflow-y-auto pr-2">
               <div className="flex justify-end mb-2">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <Plus size={12} /> 업로드
                  </Button>
               </div>
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-slate-300 gap-2">
                  <FileText size={32} opacity={0.3} />
                  <p className="text-xs italic">등록된 파일이 없습니다.</p>
                </div>
              ) : (
                files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors group shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{file.name}</p>
                        <p className="text-xs text-slate-400">{file.size} • {file.uploaded_by}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Download size={14} /></Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-none bg-slate-50/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <History size={18} />
            <CardTitle className="text-lg font-bold text-slate-800">최근 활동</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 h-64 overflow-y-auto pr-2 custom-scrollbar">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
                <History size={32} opacity={0.3} />
                <p className="text-xs italic">활동 내역이 없습니다.</p>
              </div>
            ) : (
              activities.map(log => (
                <div key={log.id} className="flex gap-3 items-start border-l-2 border-slate-100 pl-4 relative ml-2">
                  <div className="absolute -left-[9px] top-0 bg-white rounded-full p-0.5 border border-slate-100">
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="text-[11px] leading-relaxed text-slate-600">
                    {getActionText(log)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
