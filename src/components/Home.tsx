import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LayoutDashboard, Calendar, Users, Settings, BarChart3, ClipboardList } from 'lucide-react';

const apps = [
  {
    id: 'pms',
    title: 'Project Management',
    description: '종합 프로젝트 관리 시스템 (간트, 칸반, 달력 통합)',
    icon: LayoutDashboard,
    color: 'bg-blue-600',
    path: '/pms',
    active: true
  },
  {
    id: 'gantt',
    title: 'Gantt Chart (Direct)',
    description: '간트 차트 모듈 바로가기',
    icon: Calendar,
    color: 'bg-indigo-500',
    path: '/gantt',
    active: true
  },
  {
    id: 'team',
    title: 'Team Management',
    description: '멤버 관리 및 리소스 할당 (준비 중)',
    icon: Users,
    color: 'bg-purple-500',
    path: '/team',
    active: false
  },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            PMS <span className="text-blue-600">Portal</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            종합 프로젝트 관리 시스템에 오신 것을 환영합니다. 필요한 모듈을 선택하세요.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Card 
              key={app.id} 
              className={`group hover:shadow-xl transition-all duration-300 border-none ${app.active ? 'cursor-pointer hover:-translate-y-1' : 'opacity-60 cursor-not-allowed'}`}
              onClick={() => app.active && navigate(app.path)}
            >
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-xl ${app.color} flex items-center justify-center mb-4 text-white shadow-lg`}>
                  <app.icon size={24} />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {app.title}
                </CardTitle>
                <CardDescription className="text-slate-500 min-h-[40px]">
                  {app.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant={app.active ? "default" : "secondary"} 
                  className="w-full"
                  disabled={!app.active}
                >
                  {app.active ? '열기' : '준비 중'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <footer className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-500 text-sm">
          &copy; 2024 Project Management System. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
