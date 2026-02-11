# PMS TODO (우선순위)

## P0 (이번 주 내)

- [ ] `tasks` 스키마 정합성 맞추기
  - `category`, `assignee`, `description`, `priority` 컬럼 추가 여부 확정
  - 운영/개발 환경 스키마 동일화
- [ ] Sales 금액 영구 저장 필드 확정
  - 권장: `deal_amount_won BIGINT`, `deal_stage TEXT`, `deal_currency TEXT DEFAULT 'KRW'`
  - description 토큰 의존도 낮추기
- [ ] 단계 이동 감사 이력 강화
  - `activity_logs` 외 별도 히스토리 테이블(`deal_stage_history`) 설계/적용

## P1 (다음 스프린트)

- [ ] Sales KPI 실제 데이터화
  - 건전도, 전환율, 예측 차트에 실데이터 집계 반영
- [ ] 검색/필터 고도화
  - 담당자, 카테고리, 기간 필터 추가
  - 검색 결과 강조 표시
- [ ] 카드 액션 UX 개선
  - 성공/실패 확정 시 토스트 + undo(되돌리기) 제공
- [ ] 모바일 뷰 정교화
  - 카드 정보 밀도 최적화
  - 터치 인터랙션 개선

## P2 (중기)

- [ ] 권한 모델 도입
  - 관리자/영업/뷰어 권한 분리
  - 컬럼/기능별 접근 제어
- [ ] 알림 기능
  - 단계 변경, 마감 임박, 실패 딜 알림 (이메일/인앱)
- [ ] 리포트/내보내기
  - 월간 Sales 리포트 PDF/CSV
- [ ] 성능 최적화
  - 대용량 데이터에서 가상 스크롤, 서버 페이징 도입

## 운영 체크리스트

- [ ] 배포 전 `npm run build` 필수
- [ ] Supabase RLS/권한 정책 재점검
- [ ] 모니터링(에러/성능) 도구 연결
