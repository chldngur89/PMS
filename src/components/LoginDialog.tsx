import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent } from './ui/dialog';
import { LogIn, Mail } from 'lucide-react';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { signInWithGoogle, loading } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      onOpenChange(false);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-none p-0 overflow-hidden rounded-3xl">
        <div className="bg-white p-8">
          <CardHeader className="text-center p-0 mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
              <LogIn size={32} />
            </div>
            <CardTitle className="text-3xl font-black text-slate-900">PMS Login</CardTitle>
            <CardDescription className="text-slate-500 mt-2">
              종합 프로젝트 관리 시스템에 로그인하세요.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full h-12 gap-3 text-base font-bold border-slate-200 hover:bg-slate-50 transition-all rounded-xl"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                />
              </svg>
              Google 계정으로 로그인
            </Button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-slate-300 font-bold tracking-widest">or</span>
              </div>
            </div>
            <Button 
              className="w-full h-12 gap-3 text-base font-bold bg-slate-900 hover:bg-slate-800 rounded-xl"
              disabled
            >
              <Mail size={18} /> 이메일로 시작하기 (준비 중)
            </Button>
          </div>
          <footer className="mt-8 text-center text-[10px] text-slate-400 font-medium">
            계정이 없으신가요? 로그인 시 자동으로 회원가입이 진행됩니다.
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
