import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileText, Download, Plus, Trash2, ExternalLink, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ProjectFile {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  size: string;
  uploaded_by: string;
  created_at: string;
}

export function ProjectResources() {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [readme, setReadme] = useState<string>('# 프로젝트 개요\n\n이 프로젝트는 효율적인 프로젝트 관리를 위한 통합 플랫폼입니다.\n\n## 주요 목표\n- 실시간 일정 트래킹\n- 리소스 최적화\n- 팀 협업 강화');
  const [isEditingReadme, setIsEditingReadme] = useState(false);
  const [tempReadme, setTempReadme] = useState('');

  useEffect(() => {
    fetchFiles();
    fetchProjectInfo();
  }, []);

  const fetchFiles = async () => {
    const { data, error } = await supabase.from('project_files').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching files:', error);
    else if (data) setFiles(data);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <Card className="shadow-sm border-none bg-slate-50/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2 text-blue-600">
            <BookOpen size={18} />
            <CardTitle className="text-lg font-bold text-slate-800">Project README</CardTitle>
          </div>
          {!isEditingReadme ? (
            <Button variant="ghost" size="sm" onClick={() => { setTempReadme(readme); setIsEditingReadme(true); }}>수정</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditingReadme(false)}>취소</Button>
              <Button size="sm" onClick={handleSaveReadme}>저장</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isEditingReadme ? (
            <textarea
              className="w-full h-64 p-3 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              value={tempReadme}
              onChange={(e) => setTempReadme(e.target.value)}
            />
          ) : (
            <div className="prose prose-slate max-w-none h-64 overflow-y-auto bg-white p-4 rounded-md border border-slate-100 shadow-inner">
              {readme.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('#') ? 'font-bold text-slate-900 mt-2' : 'text-slate-600'}>{line}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-none bg-slate-50/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <FileText size={18} />
            <CardTitle className="text-lg font-bold text-slate-800">Project Assets</CardTitle>
          </div>
          <Button variant="outline" size="sm" className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <Plus size={14} /> 업로드
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 h-64 overflow-y-auto pr-2">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <FileText size={32} opacity={0.5} />
                <p className="text-sm italic">등록된 파일이 없습니다.</p>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500"><Trash2 size={14} /></Button>
                  </div>
                </div>
              ))
            )}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm opacity-80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-500">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">기능_명세서_v1.2.pdf</p>
                  <p className="text-xs text-slate-400">2.4 MB • 관리자</p>
                </div>
              </div>
              <ExternalLink size={14} className="text-slate-300" />
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm opacity-80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-amber-50 flex items-center justify-center text-amber-500">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">브랜드_가이드라인.zip</p>
                  <p className="text-xs text-slate-400">45.0 MB • 디자인팀</p>
                </div>
              </div>
              <ExternalLink size={14} className="text-slate-300" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
