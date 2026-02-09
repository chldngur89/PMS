
  # PMS (Project Management System)

종합 프로젝트 관리 시스템(PMS)입니다. 여러 관리 도구들이 통합되어 있으며, 현재 간트 차트 모듈이 활성화되어 있습니다.

## 프로젝트 구조

- **PMS Portal (Home)**: 모든 관리 모듈의 진입점
- **Gantt Chart Module**: 프로젝트 타임라인 및 일정 관리 도구 (Supabase 연동)
- **기타 가안 모듈**: 대시보드, 팀 관리, 업무 보드 등 (추후 확장 예정)

## 주요 기능 (간트 차트)

- **Supabase DB 연동**: 모든 데이터가 실시간으로 클라우드에 저장됩니다.
- **계층형 일정 관리**: 하위 작업을 생성하고 관리할 수 있습니다.
- **데이터 롤업**: 하위 작업의 진행률과 일정이 부모 작업에 자동으로 반영됩니다.
- **수출 기능**: 프로젝트 데이터를 JSON 파일로 내보낼 수 있습니다.

## 실행 방법

1. 의존성 설치:
   ```bash
   npm install
   ```

2. 환경 변수 설정:
   `.env` 파일을 생성하고 아래 정보를 입력하세요.
   ```env
   VITE_SUPABASE_URL=https://piwgjibtrlyllcueshkq.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_PGZGmN3q-YaJIy2hOW42iQ_uzLeG_gl
   ```

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```

## 배포 가이드 (Vercel)

1. Vercel 프로젝트 생성 후 코드를 연결합니다.
2. 위 환경 변수들을 Vercel Settings의 Environment Variables에 등록합니다.
3. 배포를 진행합니다.
  