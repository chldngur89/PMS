# Vercel Deployment Guide for PMS (Project Management System)

이 프로젝트는 Supabase를 백엔드로 사용하는 통합 PMS 포털입니다. Vercel에 배포하기 위해 다음 단계를 따르세요.

## 1. 환경 변수 설정
Vercel 프로젝트 설정(Settings > Environment Variables)에 다음 두 가지를 반드시 추가해야 합니다.
- `VITE_SUPABASE_URL`: 사용자의 Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: 사용자의 Supabase Anon Key

## 2. 데이터베이스 준비
배포 전, Supabase SQL Editor에서 `supabase_schema.sql` 스크립트를 실행하여 필요한 테이블(`tasks`, `task_issues`)을 생성했는지 확인하세요.

## 3. 배포 단계
1. 코드를 GitHub 등 원격 저장소에 푸시합니다.
2. Vercel에서 해당 저장소를 임포트합니다.
3. 위에서 언급한 환경 변수들을 설정합니다.
4. **Deploy** 버튼을 클릭하여 배포를 완료합니다.

## 4. 로컬 개발 환경
로컬에서 실행하려면 `.env.example` 파일을 참고하여 `.env` 파일을 생성하고 Supabase 자격 증명을 입력한 후 다음 명령어를 실행하세요.
```bash
npm install
npm run dev
```
