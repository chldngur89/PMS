import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LogOut, User, Users, Bell, Search, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { supabase } from '../lib/supabase';

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  online_at: string;
}

interface HeaderProps {
  onlineUsers: OnlineUser[];
  onLoginClick: () => void;
}

export function Header({ onlineUsers, onLoginClick }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="프로젝트, 작업 검색..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex -space-x-2 mr-3">
            {onlineUsers.length > 0 ? (
              onlineUsers.map((u) => (
                <div 
                  key={u.id}
                  title={`${u.name} (온라인)`}
                  className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-slate-100 relative group transition-transform hover:scale-110 hover:z-10"
                >
                  {u.name.substring(0, 2).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full"></span>
                </div>
              ))
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                <User size={12} className="text-slate-400" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter leading-none">
              {onlineUsers.length} Online
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Live</span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-100 mx-2"></div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-xl h-10 w-10">
            <Bell size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-xl h-10 w-10">
            <Settings size={20} />
          </Button>
        </div>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-slate-50 transition-all outline-none group">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">{user.user_metadata.full_name || user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{user.email}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-100 group-hover:scale-105 transition-transform">
                  <User size={20} />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl border-slate-100 shadow-xl p-2">
              <DropdownMenuLabel className="font-bold text-slate-900">내 계정</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-50" />
              <DropdownMenuItem className="rounded-xl gap-3 py-2.5 cursor-pointer">
                <User size={16} /> 프로필 설정
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl gap-3 py-2.5 cursor-pointer">
                <Users size={16} /> 팀 관리
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-50" />
              <DropdownMenuItem 
                onClick={() => signOut()}
                className="text-rose-500 focus:text-rose-500 rounded-xl gap-3 py-2.5 cursor-pointer hover:bg-rose-50"
              >
                <LogOut size={16} /> 로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            className="rounded-xl px-6 font-bold shadow-md shadow-blue-100 bg-blue-600 hover:bg-blue-700"
            onClick={onLoginClick}
          >
            로그인
          </Button>
        )}
      </div>
    </header>
  );
}
