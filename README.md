
# PMS (Project Management System)

PMS는 캘린더/간트 기반 프로젝트 관리와 Sales 대시보드를 함께 제공하는 웹 앱입니다.

## 우리가 해낸 것

### 1) Sales 대시보드 UI/UX 구현 및 정렬
- `doc/web` 레퍼런스 스타일을 기준으로 레이아웃 재구성
- 파이프라인 컬럼 + 인텔리전스 패널 + 상단 액션바 반영
- 한글 중심 라벨/문구 정리

### 2) 딜 생성/수정/이동 플로우 구현
- `신규 딜` 모달 생성
- 카드별 `이전 / 수정 / 다음` 액션 구현
- 협상 단계에서 `성공/실패 선택 팝업` 후 이동
- 단계 흐름 고정:
  - `리드 -> 탐색 -> 제안 -> 협상 -> (성공 | 실패)`

### 3) 검색/필터/정렬 동작
- 상단 검색
- 단계/리스크/정렬 필터
- 필터 리셋

### 4) DB 저장 및 히스토리 로깅
- Supabase `tasks` 생성/수정 연동
- 단계 이동 시 DB 업데이트 반영
- `activity_logs`에 단계 변경 이력 기록
  - 예: `영업단계 변경: 리드 -> 탐색`

### 5) 금액 체계 KRW(원) 전환
- 표시 단위: `₩4,500만`, `₩38.7억` 형태
- 카드/요약 패널 금액 포맷 한국식 단위로 변경
- 금액 메타 토큰에 통화 정보 추가
  - `[deal_amount=...]`
  - `[deal_currency=KRW]`

### 6) 안정화
- 빌드 통과 확인
- 주요 플로우(생성, 이동, 팝업, 로그) 검증
- 런타임 에러 및 콘솔 에러 이슈 정리

## 현재 아키텍처 요약

- Frontend: React + Vite
- DB/Realtime: Supabase
- Main Views:
  - Sales Dashboard
  - Month / Week / Day Calendar
  - Table / Kanban / Gantt

핵심 파일:
- `/Users/wh.choi/Desktop/Code/PMS/src/components/views/SalesDashboardView.tsx`
- `/Users/wh.choi/Desktop/Code/PMS/src/PMSApp.tsx`
- `/Users/wh.choi/Desktop/Code/PMS/src/components/PMSContent.tsx`

## 로컬 실행

1. 의존성 설치
```bash
npm install
```

2. 환경 변수 설정 (`.env`)
```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

3. 개발 서버
```bash
npm run dev
```

4. 프로덕션 빌드
```bash
npm run build
```

## 배포 (Vercel)

1. 저장소 연결
2. 환경 변수 등록
3. 배포 실행

## 알려진 이슈/주의사항

- 현재 Supabase `tasks` 스키마가 환경별로 다를 수 있습니다.
- 일부 환경에서 `category/assignee/description/priority` 컬럼이 없을 수 있어, 코드에서 컬럼 감지/우회 로직으로 처리합니다.
- 위 컬럼이 실제로 없으면 해당 값은 완전 영구 저장되지 않을 수 있습니다.

## 다음 작업

- 상세 계획은 `/Users/wh.choi/Desktop/Code/PMS/TODO.md` 참고
  
