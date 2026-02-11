import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronRight,
  Clock3,
  Filter,
  Gauge,
  Plus,
  Search,
  SortDesc,
  TrendingUp,
  UserRound,
  Verified,
  X,
} from 'lucide-react';
import { Language, Task, TeamMember } from '../../PMSApp';
import './sales-dashboard.css';

type SalesStage = 'lead' | 'discovery' | 'proposal' | 'negotiation' | 'success' | 'failure';
type RiskFilter = 'all' | 'risk' | 'stable';
type SortMode = 'amount-desc' | 'amount-asc' | 'title-asc' | 'title-desc';
type ModalMode = 'create' | 'edit' | null;

interface DealItem {
  id: string;
  code: string;
  title: string;
  account: string;
  stage: SalesStage;
  amount: number; // in 만원 (10,000 KRW)
  owner: string;
  risk: boolean;
  tag: string;
  editable: boolean;
  category: string;
  startDate: Date;
  endDate: Date;
  assignee: string;
  descriptionRaw: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
}

interface DealForm {
  title: string;
  category: string;
  stage: SalesStage;
  amount: string; // KRW
  assignee: string;
  startDate: string;
  endDate: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
}

interface SalesDashboardViewProps {
  language: Language;
  tasks: Task[];
  members: TeamMember[];
  categories: Array<{ name: string; color: string }>;
  onCreateTask: (task: Omit<Task, 'id'>) => Promise<boolean> | boolean;
  onUpdateTask: (taskId: string, updatedTask: Partial<Task>) => Promise<boolean> | boolean;
}

const STAGES: SalesStage[] = ['lead', 'discovery', 'proposal', 'negotiation', 'success', 'failure'];

const PREV_STAGE: Record<SalesStage, SalesStage | null> = {
  lead: null,
  discovery: 'lead',
  proposal: 'discovery',
  negotiation: 'proposal',
  success: 'negotiation',
  failure: 'negotiation',
};

const NEXT_STAGE: Record<SalesStage, SalesStage | null> = {
  lead: 'discovery',
  discovery: 'proposal',
  proposal: 'negotiation',
  negotiation: 'success',
  success: null,
  failure: null,
};

const STAGE_LABELS: Record<SalesStage, { ko: string; en: string }> = {
  lead: { ko: '리드', en: 'Lead' },
  discovery: { ko: '탐색', en: 'Discovery' },
  proposal: { ko: '제안', en: 'Proposal' },
  negotiation: { ko: '협상', en: 'Negotiation' },
  success: { ko: '성공', en: 'Success' },
  failure: { ko: '실패', en: 'Failure' },
};

const STAGE_TAGS: Record<SalesStage, { ko: string; en: string }> = {
  lead: { ko: '신규', en: 'HOT LEAD' },
  discovery: { ko: '진행중', en: 'ACTIVE' },
  proposal: { ko: '검토', en: 'REVIEW' },
  negotiation: { ko: '우선', en: 'HIGH CONF' },
  success: { ko: '성공', en: 'WON' },
  failure: { ko: '실패', en: 'LOST' },
};

const STAGE_TO_STATUS: Record<SalesStage, Task['status']> = {
  lead: 'on-track',
  discovery: 'on-track',
  proposal: 'on-track',
  negotiation: 'at-risk',
  success: 'on-track',
  failure: 'delayed',
};

const STAGE_TO_PROGRESS: Record<SalesStage, number> = {
  lead: 10,
  discovery: 35,
  proposal: 60,
  negotiation: 80,
  success: 100,
  failure: 97,
};

const USD_TO_KRW_RATE = 1350;

const FALLBACK_DEALS: DealItem[] = [
  {
    id: 'fallback-1',
    code: 'TECH-104',
    title: '글로벌 커넥트 SaaS',
    account: 'Acme Global Co.',
    stage: 'lead',
    amount: 4500,
    owner: 'JD',
    risk: false,
    tag: '신규',
    editable: false,
    category: '개발',
    startDate: new Date(),
    endDate: new Date(),
    assignee: 'JD',
    descriptionRaw: '',
    priority: 'medium',
    color: '#10b981',
  },
  {
    id: 'fallback-2',
    code: 'RETL-201',
    title: '리테일 통합 솔루션',
    account: 'Apex Retail',
    stage: 'lead',
    amount: 1280,
    owner: 'SW',
    risk: false,
    tag: '14일 미활성',
    editable: false,
    category: '기획',
    startDate: new Date(),
    endDate: new Date(),
    assignee: 'SW',
    descriptionRaw: '',
    priority: 'medium',
    color: '#ef4444',
  },
  {
    id: 'fallback-3',
    code: 'NSTR-888',
    title: '노스스타 인프라',
    account: 'NorthStar Holdings',
    stage: 'discovery',
    amount: 89000,
    owner: 'AM',
    risk: true,
    tag: '우선 검토',
    editable: false,
    category: '마케팅',
    startDate: new Date(),
    endDate: new Date(),
    assignee: 'AM',
    descriptionRaw: '',
    priority: 'high',
    color: '#3b82f6',
  },
  {
    id: 'fallback-4',
    code: 'FIN-520',
    title: '핀테크 코어',
    account: 'FinCloud Group',
    stage: 'proposal',
    amount: 52000,
    owner: 'EC',
    risk: false,
    tag: '검토',
    editable: false,
    category: '기획',
    startDate: new Date(),
    endDate: new Date(),
    assignee: 'EC',
    descriptionRaw: '',
    priority: 'medium',
    color: '#ef4444',
  },
  {
    id: 'fallback-5',
    code: 'LOG-1500',
    title: '타이탄 물류',
    account: 'Titan Logistics',
    stage: 'negotiation',
    amount: 150000,
    owner: 'MK',
    risk: true,
    tag: '우선',
    editable: false,
    category: '개발',
    startDate: new Date(),
    endDate: new Date(),
    assignee: 'MK',
    descriptionRaw: '',
    priority: 'high',
    color: '#10b981',
  },
  {
    id: 'fallback-6',
    code: 'WON-901',
    title: '스마트팩토리 구축',
    account: 'HanMek Corp',
    stage: 'success',
    amount: 78000,
    owner: 'JM',
    risk: false,
    tag: '성공',
    editable: false,
    category: '마케팅',
    startDate: new Date(),
    endDate: new Date(),
    assignee: 'JM',
    descriptionRaw: '',
    priority: 'high',
    color: '#3b82f6',
  },
  {
    id: 'fallback-7',
    code: 'LST-320',
    title: '리테일 확장 프로젝트',
    account: 'Apex Retail',
    stage: 'failure',
    amount: 12000,
    owner: 'SW',
    risk: true,
    tag: '실패',
    editable: false,
    category: '디자인',
    startDate: new Date(),
    endDate: new Date(),
    assignee: 'SW',
    descriptionRaw: '',
    priority: 'medium',
    color: '#f59e0b',
  },
];

function safeString(input: unknown, fallback: string): string {
  if (typeof input === 'string' && input.trim().length > 0) return input;
  if (typeof input === 'number') return String(input);
  return fallback;
}

function statusToStage(status: Task['status'] | undefined): SalesStage {
  if (!status || status === 'todo') return 'lead';
  if (status === 'in-progress') return 'discovery';
  if (status === 'on-track') return 'proposal';
  if (status === 'at-risk') return 'negotiation';
  if (status === 'delayed') return 'failure';
  return 'success';
}

function progressToStage(progress: number | undefined): SalesStage | null {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) return null;
  if (progress >= 100) return 'success';
  if (progress >= 97) return 'failure';
  if (progress >= 80) return 'negotiation';
  if (progress >= 60) return 'proposal';
  if (progress >= 35) return 'discovery';
  if (progress >= 0) return 'lead';
  return null;
}

function extractAmountInManwon(description?: string): number | null {
  if (!description) return null;
  const match = description.match(/\[deal_amount=(\d+)\]/);
  if (!match) return null;
  const raw = Number(match[1]);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  const currencyMatch = description.match(/\[deal_currency=(USD|KRW)\]/);
  const currency = currencyMatch?.[1] === 'KRW' ? 'KRW' : 'USD';
  const amountWon = currency === 'KRW' ? raw : Math.round(raw * USD_TO_KRW_RATE);
  return Math.max(1, Math.round(amountWon / 10000));
}

function extractStageFromDescription(description?: string): SalesStage | null {
  if (!description) return null;
  const match = description.match(/\[deal_stage=(lead|discovery|proposal|negotiation|success|failure)\]/);
  if (!match) return null;
  return match[1] as SalesStage;
}

function stripDealMeta(description?: string): string {
  if (!description) return '';
  return description
    .replace(/\[deal_amount=\d+\]/g, '')
    .replace(/\[deal_currency=(USD|KRW)\]/g, '')
    .replace(/\[deal_stage=(lead|discovery|proposal|negotiation|success|failure)\]/g, '')
    .trim();
}

function buildDealDescription(base: string, amountWon: number, stage: SalesStage): string {
  const clean = stripDealMeta(base);
  const amountToken = `[deal_amount=${Math.max(10000, Math.round(amountWon))}]`;
  const currencyToken = '[deal_currency=KRW]';
  const stageToken = `[deal_stage=${stage}]`;
  if (clean.length === 0) return `${amountToken}\n${currencyToken}\n${stageToken}`;
  return `${clean}\n${amountToken}\n${currencyToken}\n${stageToken}`;
}

function moneyLabel(amountInManwon: number): string {
  const totalWon = Math.round(amountInManwon * 10000);
  if (totalWon >= 100000000) {
    const eok = totalWon / 100000000;
    const value = eok >= 100 ? Math.round(eok).toLocaleString() : eok.toFixed(1).replace(/\.0$/, '');
    return `₩${value}억`;
  }
  return `₩${Math.round(totalWon / 10000).toLocaleString()}만`;
}

function barMoney(amountInManwon: number): string {
  const manwon = Math.round(amountInManwon);
  if (manwon >= 10000) {
    const eok = manwon / 10000;
    const eokText = Number.isInteger(eok) ? eok.toLocaleString() : eok.toFixed(1).replace(/\.0$/, '');
    return `₩${eokText}억`;
  }
  return `₩${manwon.toLocaleString()}만`;
}

function toDateInput(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function todayDateInput(): string {
  return toDateInput(new Date());
}

function getDefaultForm(defaultCategory: string): DealForm {
  const today = todayDateInput();
  return {
    title: '',
    category: defaultCategory,
    stage: 'lead',
    amount: '50000000',
    assignee: '',
    startDate: today,
    endDate: today,
    priority: 'medium',
    description: '',
  };
}

export function SalesDashboardView({
  language,
  tasks,
  members,
  categories,
  onCreateTask,
  onUpdateTask,
}: SalesDashboardViewProps) {
  const t = language === 'ko'
    ? {
        pipeline: '파이프라인: 기업 Q4',
        updated: '5분 전 업데이트',
        intelligence: '인텔리전스',
        totalValue: '총 거래 금액',
        avgDeal: '평균 거래 금액',
        health: '파이프라인 건전도',
        forecast: '매출 예측',
        conversion: '전환 지표',
        support: '지원',
        docs: '문서',
        topSearchPlaceholder: '거래, 고객, 리포트 검색...',
        noDeals: '거래 없음',
        stageFilter: '단계',
        riskFilter: '리스크',
        sortFilter: '정렬',
        all: '전체',
        riskOnly: '리스크만',
        stableOnly: '안정',
        sortAmountDesc: '금액 높은순',
        sortAmountAsc: '금액 낮은순',
        sortTitleAsc: '이름 오름차순',
        sortTitleDesc: '이름 내림차순',
        reset: '초기화',
        createDeal: '신규 딜',
        createDealTitle: '신규 딜 생성',
        createDealDesc: '저장 시 Sales 대시보드와 캘린더 데이터에 즉시 반영됩니다.',
        editDealTitle: '딜 수정',
        editDealDesc: '카드 정보 수정 후 저장하면 즉시 반영됩니다.',
        dealName: '딜 이름',
        category: '카테고리',
        stage: '단계',
        amount: '예상 금액(원)',
        assignee: '담당자',
        startDate: '시작일',
        endDate: '종료일',
        priority: '우선순위',
        description: '메모',
        cancel: '취소',
        save: '저장',
        update: '수정 저장',
        saving: '저장 중...',
        createErrorTitle: '딜 이름을 입력해 주세요.',
        createErrorDate: '종료일은 시작일 이후여야 합니다.',
        createErrorAmount: '금액은 10,000원 이상으로 입력해 주세요.',
        createErrorRequest: '딜 저장에 실패했습니다. Supabase 권한/연결 상태를 확인해 주세요.',
        moveErrorRequest: '단계 이동에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        quarterLabel: '이번 분기',
        activeDeals: '진행 중',
        leadToDiscovery: '리드 -> 탐색',
        discoveryToProposal: '탐색 -> 제안',
        proposalToClosed: '협상 -> 성공',
        editCard: '수정',
        movePrev: '이전',
        moveNext: '다음',
        markSuccess: '성공 처리',
        markFailure: '실패 처리',
        outcomeTitle: '협상 결과 선택',
        outcomeDesc: '협상 단계를 다음으로 넘기기 전에 결과를 선택해 주세요.',
        outcomePickSuccess: '성공으로 이동',
        outcomePickFailure: '실패로 이동',
        readonlyDeal: '데모 데이터',
      }
    : {
        pipeline: 'Pipeline: Corporate Q4',
        updated: 'UPDATED 5M AGO',
        intelligence: 'Intelligence',
        totalValue: 'Total Value',
        avgDeal: 'Avg Deal',
        health: 'Pipeline Health Score',
        forecast: 'Revenue Forecast',
        conversion: 'Conversion Metrics',
        support: 'SUPPORT',
        docs: 'DOCS',
        topSearchPlaceholder: 'Search deals, contacts, or reports...',
        noDeals: 'No deals',
        stageFilter: 'Stage',
        riskFilter: 'Risk',
        sortFilter: 'Sort',
        all: 'All',
        riskOnly: 'Risk only',
        stableOnly: 'Stable only',
        sortAmountDesc: 'Amount high to low',
        sortAmountAsc: 'Amount low to high',
        sortTitleAsc: 'Name A-Z',
        sortTitleDesc: 'Name Z-A',
        reset: 'Reset',
        createDeal: 'NEW DEAL',
        createDealTitle: 'Create New Deal',
        createDealDesc: 'Saved deal is reflected in dashboard and calendar task data.',
        editDealTitle: 'Edit Deal',
        editDealDesc: 'Update card details and save changes.',
        dealName: 'Deal name',
        category: 'Category',
        stage: 'Stage',
        amount: 'Expected amount (KRW)',
        assignee: 'Assignee',
        startDate: 'Start date',
        endDate: 'End date',
        priority: 'Priority',
        description: 'Memo',
        cancel: 'Cancel',
        save: 'Save',
        update: 'Save changes',
        saving: 'Saving...',
        createErrorTitle: 'Please enter a deal name.',
        createErrorDate: 'End date must be after start date.',
        createErrorAmount: 'Amount must be at least 10,000 KRW.',
        createErrorRequest: 'Failed to save deal. Check Supabase permissions/connection.',
        moveErrorRequest: 'Failed to move stage. Please retry.',
        quarterLabel: 'This Quarter',
        activeDeals: 'active deals',
        leadToDiscovery: 'Lead -> Discovery',
        discoveryToProposal: 'Discovery -> Proposal',
        proposalToClosed: 'Negotiation -> Success',
        editCard: 'Edit',
        movePrev: 'Previous',
        moveNext: 'Next',
        markSuccess: 'Mark success',
        markFailure: 'Mark failure',
        outcomeTitle: 'Choose negotiation result',
        outcomeDesc: 'Select success or failure before moving to the next stage.',
        outcomePickSuccess: 'Move to Success',
        outcomePickFailure: 'Move to Failure',
        readonlyDeal: 'Demo data',
      };

  const fallbackCategories = [
    { name: '개발', color: '#10b981' },
    { name: '디자인', color: '#f59e0b' },
    { name: '마케팅', color: '#3b82f6' },
    { name: '기획', color: '#ef4444' },
  ];
  const categoryOptions = categories.length > 0 ? categories : fallbackCategories;

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [stageFilter, setStageFilter] = useState<'all' | SalesStage>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('amount-desc');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcomePickerDeal, setOutcomePickerDeal] = useState<DealItem | null>(null);
  const [isOutcomeSaving, setIsOutcomeSaving] = useState(false);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState<DealForm>(getDefaultForm(categoryOptions[0]?.name || '기획'));

  const deals = useMemo<DealItem[]>(() => {
    if (tasks.length === 0) return FALLBACK_DEALS;

    return tasks.slice(0, 50).map((task, idx) => {
      const stageFromMeta = extractStageFromDescription(task.description);
      const stageFromProgress = progressToStage(task.progress);
      const stage = stageFromMeta ?? stageFromProgress ?? statusToStage(task.status);
      const progress = typeof task.progress === 'number' && Number.isFinite(task.progress) ? task.progress : 20;
      const amount = extractAmountInManwon(task.description) ?? Math.max(150, Math.round((progress + 20) * 22 + idx * 70));
      const assigneeSafe = safeString(task.assignee, `TM${idx + 1}`);
      const owner = assigneeSafe.slice(0, 2).toUpperCase();
      const categorySafe = safeString(task.category, 'GEN');
      const titleSafe = safeString(task.title, `Untitled Deal ${idx + 1}`);
      return {
        id: safeString(task.id, `deal-${idx + 1}`),
        code: `${categorySafe.slice(0, 3).toUpperCase()}-${idx + 101}`,
        title: titleSafe,
        account: `${assigneeSafe || categorySafe} Group`,
        stage,
        amount,
        owner,
        risk: stage === 'failure' || task.status === 'at-risk' || task.status === 'delayed',
        tag: STAGE_TAGS[stage][language],
        editable: true,
        category: categorySafe,
        startDate: task.startDate,
        endDate: task.endDate,
        assignee: assigneeSafe,
        descriptionRaw: task.description ?? '',
        priority: task.priority,
        color: task.color,
      };
    });
  }, [tasks, language]);

  const filteredDeals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = deals.filter((deal) => {
      if (stageFilter !== 'all' && deal.stage !== stageFilter) return false;
      if (riskFilter === 'risk' && !deal.risk) return false;
      if (riskFilter === 'stable' && deal.risk) return false;
      if (!query) return true;
      const haystack = `${deal.title} ${deal.code} ${deal.account} ${deal.owner} ${deal.tag}`.toLowerCase();
      return haystack.includes(query);
    });

    result.sort((a, b) => {
      if (sortMode === 'amount-desc') return b.amount - a.amount;
      if (sortMode === 'amount-asc') return a.amount - b.amount;
      if (sortMode === 'title-asc') return a.title.localeCompare(b.title);
      return b.title.localeCompare(a.title);
    });

    return result;
  }, [deals, searchQuery, stageFilter, riskFilter, sortMode]);

  const stageGroups = useMemo(() => {
    return STAGES.map((stage) => {
      const items = filteredDeals.filter((deal) => deal.stage === stage);
      const total = items.reduce((acc, item) => acc + item.amount, 0);
      return { stage, items, total };
    });
  }, [filteredDeals]);

  const totalValue = useMemo(() => filteredDeals.reduce((acc, item) => acc + item.amount, 0), [filteredDeals]);
  const avgValue = useMemo(() => (filteredDeals.length ? Math.round(totalValue / filteredDeals.length) : 0), [filteredDeals.length, totalValue]);
  const closedDeals = useMemo(() => filteredDeals.filter((deal) => deal.stage === 'success').length, [filteredDeals]);
  const riskyDeals = useMemo(() => filteredDeals.filter((deal) => deal.risk).length, [filteredDeals]);
  const healthScore = Math.max(42, Math.min(94, Math.round(78 + (closedDeals / Math.max(1, filteredDeals.length)) * 20 - (riskyDeals / Math.max(1, filteredDeals.length)) * 18)));
  const gaugeDash = `${Math.round((healthScore / 100) * 157)} 157`;

  const forecast = [
    { key: 'JUL', actual: 36, target: 52 },
    { key: 'AUG', actual: 74, target: 58 },
    { key: 'SEP', actual: 48, target: 55 },
    { key: 'OCT', actual: 68, target: 66 },
    { key: 'NOV', actual: 88, target: 72 },
  ];

  const editingDeal = useMemo(() => {
    if (!activeDealId) return null;
    return deals.find((deal) => deal.id === activeDealId) ?? null;
  }, [deals, activeDealId]);

  const resetFilters = () => {
    setStageFilter('all');
    setRiskFilter('all');
    setSortMode('amount-desc');
    setSearchQuery('');
  };

  const openCreateModal = () => {
    setActiveDealId(null);
    setForm(getDefaultForm(categoryOptions[0]?.name || '기획'));
    setFormError(null);
    setModalMode('create');
  };

  const openEditModal = (deal: DealItem) => {
    if (!deal.editable) return;
    setActiveDealId(deal.id);
    setForm({
      title: deal.title,
      category: deal.category,
      stage: deal.stage,
      amount: String(Math.max(10000, Math.round(deal.amount * 10000))),
      assignee: deal.assignee,
      startDate: toDateInput(deal.startDate),
      endDate: toDateInput(deal.endDate),
      priority: deal.priority,
      description: stripDealMeta(deal.descriptionRaw),
    });
    setFormError(null);
    setModalMode('edit');
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalMode(null);
    setFormError(null);
    setActiveDealId(null);
  };

  const handleFormChange = <K extends keyof DealForm>(field: K, value: DealForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitModal = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.title.trim()) {
      setFormError(t.createErrorTitle);
      return;
    }

    const amountValue = Number(form.amount);
    if (!Number.isFinite(amountValue) || amountValue < 10000) {
      setFormError(t.createErrorAmount);
      return;
    }

    const startDate = new Date(`${form.startDate}T09:00:00`);
    const endDate = new Date(`${form.endDate}T18:00:00`);
    if (endDate <= startDate) {
      setFormError(t.createErrorDate);
      return;
    }

    const selectedCategory = categoryOptions.find((category) => category.name === form.category);
    const serializedDescription = buildDealDescription(form.description, amountValue, form.stage);

    try {
      setIsSubmitting(true);

      if (modalMode === 'create') {
        const newTask: Omit<Task, 'id'> = {
          title: form.title.trim(),
          category: form.category,
          startDate,
          endDate,
          assignee: form.assignee.trim() || undefined,
          description: serializedDescription,
          color: selectedCategory?.color || '#3b82f6',
          status: STAGE_TO_STATUS[form.stage],
          priority: form.priority,
          progress: STAGE_TO_PROGRESS[form.stage],
        };
        const created = await Promise.resolve(onCreateTask(newTask));
        if (created === false) {
          setFormError(t.createErrorRequest);
          return;
        }
      }

      if (modalMode === 'edit' && activeDealId) {
        const updatePayload: Partial<Task> = {
          title: form.title.trim(),
          category: form.category,
          startDate,
          endDate,
          assignee: form.assignee.trim() || undefined,
          description: serializedDescription,
          status: STAGE_TO_STATUS[form.stage],
          progress: STAGE_TO_PROGRESS[form.stage],
          priority: form.priority,
          color: selectedCategory?.color || editingDeal?.color,
        };
        const updated = await Promise.resolve(onUpdateTask(activeDealId, updatePayload));
        if (updated === false) {
          setFormError(t.createErrorRequest);
          return;
        }
      }

      closeModal();
    } catch (error) {
      setFormError(t.createErrorRequest);
    } finally {
      setIsSubmitting(false);
    }
  };

  const moveDealToStage = async (deal: DealItem, nextStage: SalesStage): Promise<boolean> => {
    if (!deal.editable) return false;
    const amountWon = Math.max(10000, Math.round(deal.amount * 10000));
    const updatedDescription = buildDealDescription(deal.descriptionRaw, amountWon, nextStage);

    try {
      setActionError(null);
      setActiveDealId(deal.id);
      const updated = await Promise.resolve(onUpdateTask(deal.id, {
        description: updatedDescription,
        status: STAGE_TO_STATUS[nextStage],
        progress: STAGE_TO_PROGRESS[nextStage],
      }));
      if (updated === false) {
        setActionError(t.moveErrorRequest);
        return false;
      }
      return true;
    } catch (error) {
      setActionError(t.moveErrorRequest);
      return false;
    } finally {
      setActiveDealId(null);
    }
  };

  const moveDealStage = async (deal: DealItem, direction: -1 | 1) => {
    if (direction > 0 && deal.stage === 'negotiation') {
      setOutcomePickerDeal(deal);
      return;
    }
    const target = direction < 0 ? PREV_STAGE[deal.stage] : NEXT_STAGE[deal.stage];
    if (!target) return;
    await moveDealToStage(deal, target);
  };

  const closeOutcomePicker = () => {
    if (isOutcomeSaving) return;
    setOutcomePickerDeal(null);
  };

  const chooseOutcomeStage = async (stage: 'success' | 'failure') => {
    if (!outcomePickerDeal) return;
    try {
      setIsOutcomeSaving(true);
      const ok = await moveDealToStage(outcomePickerDeal, stage);
      if (ok) setOutcomePickerDeal(null);
    } finally {
      setIsOutcomeSaving(false);
    }
  };

  return (
    <div className="salesdash-root">
      <div className="salesdash-desktop">
        <header className="salesdash-topbar">
          <div className="salesdash-brand">
            <div className="salesdash-brand-icon">
              <Gauge size={16} />
            </div>
            <h1 className="salesdash-brand-title">VAULT <span>CRM</span></h1>
          </div>

          <div className="salesdash-search-wrap">
            <Search size={13} className="salesdash-search-icon" />
            <input
              className="salesdash-search"
              placeholder={t.topSearchPlaceholder}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="salesdash-top-actions">
            <button className="salesdash-newdeal-btn" onClick={openCreateModal}>
              <Plus size={14} />
              <span>{t.createDeal}</span>
            </button>
            <span className="salesdash-top-divider" />
            <button className="salesdash-icon-btn" aria-label="notifications">
              <Bell size={16} />
            </button>
            <div className="salesdash-user">
              <div className="salesdash-user-avatar">
                <UserRound size={14} />
              </div>
              <span>A. MILLER</span>
            </div>
          </div>
        </header>

        <main className="salesdash-main">
          <section className="salesdash-board">
            <div className="salesdash-board-header">
              <div className="salesdash-board-title">
                <h2>{t.pipeline}</h2>
                <div className="salesdash-update-chip">
                  <Clock3 size={11} />
                  <span>{t.updated}</span>
                </div>
              </div>
              <div className="salesdash-board-tools">
                <button
                  aria-label="filter"
                  className={showFilters ? 'is-active' : ''}
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <Filter size={14} />
                </button>
                <button aria-label="sort" onClick={() => setSortMode((prev) => (prev === 'amount-desc' ? 'amount-asc' : 'amount-desc'))}>
                  <SortDesc size={14} />
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="salesdash-filter-panel">
                <div className="salesdash-filter-field">
                  <label>{t.stageFilter}</label>
                  <select
                    value={stageFilter}
                    onChange={(event) => setStageFilter(event.target.value as 'all' | SalesStage)}
                  >
                    <option value="all">{t.all}</option>
                    {STAGES.map((stage) => (
                      <option key={stage} value={stage}>{STAGE_LABELS[stage][language]}</option>
                    ))}
                  </select>
                </div>
                <div className="salesdash-filter-field">
                  <label>{t.riskFilter}</label>
                  <select
                    value={riskFilter}
                    onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
                  >
                    <option value="all">{t.all}</option>
                    <option value="risk">{t.riskOnly}</option>
                    <option value="stable">{t.stableOnly}</option>
                  </select>
                </div>
                <div className="salesdash-filter-field">
                  <label>{t.sortFilter}</label>
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                  >
                    <option value="amount-desc">{t.sortAmountDesc}</option>
                    <option value="amount-asc">{t.sortAmountAsc}</option>
                    <option value="title-asc">{t.sortTitleAsc}</option>
                    <option value="title-desc">{t.sortTitleDesc}</option>
                  </select>
                </div>
                <button className="salesdash-filter-reset" onClick={resetFilters}>
                  {t.reset}
                </button>
              </div>
            )}

            {actionError && (
              <div className="salesdash-inline-error">{actionError}</div>
            )}

            <div className="salesdash-columns">
              {stageGroups.map((group) => (
                <div
                  key={group.stage}
                  className={`salesdash-column${group.stage === 'success' ? ' is-success' : ''}${group.stage === 'failure' ? ' is-failure' : ''}`}
                >
                  <div className="salesdash-column-head">
                    <div className="salesdash-column-label">
                      <span>{STAGE_LABELS[group.stage][language]}</span>
                      <b>{group.items.length}</b>
                    </div>
                    <strong>{moneyLabel(group.total)}</strong>
                  </div>

                  <div className="salesdash-cards">
                    {group.items.slice(0, 4).map((deal) => {
                      const hasPrev = PREV_STAGE[deal.stage] !== null;
                      const hasNext = NEXT_STAGE[deal.stage] !== null;
                      const isBusy = activeDealId === deal.id;
                      return (
                        <article key={deal.id} className={`salesdash-card${deal.risk ? ' is-risk' : ''}`}>
                          <div className="salesdash-card-top">
                            <span className="salesdash-code">{deal.code}</span>
                            {deal.stage === 'negotiation' ? <Verified size={12} /> : <span className="salesdash-dot" />}
                          </div>
                          <h3>{deal.title}</h3>
                          <p title={`₩${Math.round(deal.amount * 10000).toLocaleString()}`}>{barMoney(deal.amount)}</p>
                          <div className="salesdash-card-bottom">
                            <div className="salesdash-owner">{deal.owner}</div>
                            <span>{deal.tag}</span>
                          </div>
                          <div className="salesdash-card-actions">
                            <button
                              type="button"
                              className="shift"
                              disabled={isBusy || !deal.editable || !hasPrev}
                              onClick={() => moveDealStage(deal, -1)}
                              title={t.movePrev}
                            >
                              {t.movePrev}
                            </button>
                            <button
                              type="button"
                              className="edit"
                              disabled={isBusy || !deal.editable}
                              onClick={() => openEditModal(deal)}
                              title={deal.editable ? t.editCard : t.readonlyDeal}
                            >
                              {t.editCard}
                            </button>
                            <button
                              type="button"
                              className="shift"
                              disabled={isBusy || !deal.editable || !hasNext}
                              onClick={() => moveDealStage(deal, 1)}
                              title={t.moveNext}
                            >
                              {t.moveNext}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                    {group.items.length === 0 && (
                      <div className="salesdash-empty">{t.noDeals}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="salesdash-intel">
            <div className="salesdash-intel-header">
              <h2>{t.intelligence}</h2>
              <select>
                <option>{t.quarterLabel}</option>
                <option>{language === 'ko' ? '이번 달' : 'This Month'}</option>
                <option>{language === 'ko' ? '연간 누적' : 'Year to Date'}</option>
              </select>
            </div>

            <div className="salesdash-metrics">
              <div>
                <span>{t.totalValue}</span>
                <strong>{moneyLabel(totalValue)}</strong>
                <small>
                  <TrendingUp size={11} />
                  {language === 'ko' ? '+12.4% 성과' : '+12.4% PERFORMANCE'}
                </small>
              </div>
              <div>
                <span>{t.avgDeal}</span>
                <strong>{moneyLabel(avgValue)}</strong>
                <small>{filteredDeals.length} {t.activeDeals}</small>
              </div>
            </div>

            <div className="salesdash-health">
              <h3>{t.health}</h3>
              <div className="salesdash-gauge">
                <svg viewBox="0 0 120 70">
                  <path d="M10 60 A50 50 0 0 1 110 60" className="track" />
                  <path d="M10 60 A50 50 0 0 1 110 60" className="fill" style={{ strokeDasharray: gaugeDash }} />
                </svg>
                <strong>{healthScore}</strong>
              </div>
              <p>
                {language === 'ko'
                  ? <>파이프라인 흐름이 <b>안정적</b>이며 현재 리드 유입이 분기 목표를 상회합니다.</>
                  : <>PIPELINE VELOCITY IS <b>OPTIMAL</b>. CURRENT LEAD FLOW EXCEEDS QUARTERLY TARGETS.</>}
              </p>
            </div>

            <div className="salesdash-forecast">
              <div className="salesdash-forecast-head">
                <h3>{t.forecast}</h3>
                <div>
                  <span><i className="actual" />{language === 'ko' ? '실적' : 'ACTUAL'}</span>
                  <span><i className="target" />{language === 'ko' ? '목표' : 'TARGET'}</span>
                </div>
              </div>
              <div className="salesdash-bars">
                {forecast.map((item) => (
                  <div key={item.key} className="salesdash-bar">
                    <div className="target" style={{ height: `${item.target}%` }} />
                    <div className="actual" style={{ height: `${item.actual}%` }} />
                    <label>{item.key}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="salesdash-conversion">
              <h3>{t.conversion}</h3>
              <div className="salesdash-conversion-item">
                <div><span>{t.leadToDiscovery}</span><b>62%</b></div>
                <p><i style={{ width: '62%' }} /></p>
              </div>
              <div className="salesdash-conversion-item">
                <div><span>{t.discoveryToProposal}</span><b>38%</b></div>
                <p><i style={{ width: '38%' }} /></p>
              </div>
              <div className="salesdash-conversion-item">
                <div><span>{t.proposalToClosed}</span><b>24%</b></div>
                <p><i style={{ width: '24%' }} /></p>
              </div>
            </div>
          </aside>
        </main>

        <footer className="salesdash-footer">
          <div>
            <span><i />{language === 'ko' ? '시스템 정상' : 'SYSTEM ACTIVE'}</span>
            <span>{language === 'ko' ? '진행 중' : 'IN FLIGHT'}: <b>{filteredDeals.length}</b></span>
            <span>{language === 'ko' ? '평균 주기' : 'CYCLE'}: <b>{language === 'ko' ? '42일' : '42 DAYS'}</b></span>
          </div>
          <div>
            <button>{t.support}</button>
            <button>{t.docs}</button>
            <span><Clock3 size={11} />{new Date().toLocaleTimeString()}</span>
          </div>
        </footer>
      </div>

      <div className="salesdash-mobile">
        <header>
          <h1>VAULT CRM</h1>
          <button onClick={openCreateModal}><Plus size={18} /></button>
        </header>
        <section>
          <h2>{t.pipeline}</h2>
          {filteredDeals.slice(0, 4).map((deal) => (
            <article key={deal.id}>
              <div>
                <h3>{deal.title}</h3>
                <span>{deal.code}</span>
              </div>
              <strong>{barMoney(deal.amount)}</strong>
            </article>
          ))}
        </section>
        <button className="salesdash-mobile-ai" onClick={openCreateModal}>
          {t.createDeal}
          <ChevronRight size={14} />
        </button>
      </div>

      {modalMode && (
        <div className="salesdash-modal-wrap" role="dialog" aria-modal="true">
          <button className="salesdash-modal-backdrop" onClick={closeModal} aria-label="close" />
          <form className="salesdash-modal-panel" onSubmit={handleSubmitModal}>
            <div className="salesdash-modal-header">
              <div>
                <h3>{modalMode === 'create' ? t.createDealTitle : t.editDealTitle}</h3>
                <p>{modalMode === 'create' ? t.createDealDesc : t.editDealDesc}</p>
              </div>
              <button type="button" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            <div className="salesdash-modal-grid">
              <div className="salesdash-modal-field full">
                <label>{t.dealName}</label>
                <input
                  value={form.title}
                  onChange={(event) => handleFormChange('title', event.target.value)}
                  placeholder={language === 'ko' ? '예: 엔터프라이즈 구독 전환' : 'Ex: Enterprise Subscription'}
                />
              </div>

              <div className="salesdash-modal-field">
                <label>{t.category}</label>
                <select
                  value={form.category}
                  onChange={(event) => handleFormChange('category', event.target.value)}
                >
                  {categoryOptions.map((category) => (
                    <option key={category.name} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="salesdash-modal-field">
                <label>{t.stage}</label>
                <select
                  value={form.stage}
                  onChange={(event) => handleFormChange('stage', event.target.value as SalesStage)}
                >
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>{STAGE_LABELS[stage][language]}</option>
                  ))}
                </select>
              </div>

              <div className="salesdash-modal-field">
                <label>{t.amount}</label>
                <input
                  type="number"
                  min={10000}
                  step={10000}
                  value={form.amount}
                  onChange={(event) => handleFormChange('amount', event.target.value)}
                />
              </div>

              <div className="salesdash-modal-field">
                <label>{t.assignee}</label>
                <input
                  value={form.assignee}
                  onChange={(event) => handleFormChange('assignee', event.target.value)}
                  list="sales-assignee-options"
                  placeholder={language === 'ko' ? '담당자 선택/입력' : 'Select or type assignee'}
                />
                <datalist id="sales-assignee-options">
                  {members.map((member) => (
                    <option key={member.id} value={member.name} />
                  ))}
                </datalist>
              </div>

              <div className="salesdash-modal-field">
                <label>{t.startDate}</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => handleFormChange('startDate', event.target.value)}
                />
              </div>

              <div className="salesdash-modal-field">
                <label>{t.endDate}</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => handleFormChange('endDate', event.target.value)}
                />
              </div>

              <div className="salesdash-modal-field">
                <label>{t.priority}</label>
                <select
                  value={form.priority}
                  onChange={(event) => handleFormChange('priority', event.target.value as 'low' | 'medium' | 'high')}
                >
                  <option value="low">{language === 'ko' ? '낮음' : 'Low'}</option>
                  <option value="medium">{language === 'ko' ? '보통' : 'Medium'}</option>
                  <option value="high">{language === 'ko' ? '높음' : 'High'}</option>
                </select>
              </div>

              <div className="salesdash-modal-field full">
                <label>{t.description}</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => handleFormChange('description', event.target.value)}
                  placeholder={language === 'ko' ? '거래 메모를 입력하세요.' : 'Add deal memo'}
                />
              </div>
            </div>

            {formError && (
              <p className="salesdash-modal-error">{formError}</p>
            )}

            <div className="salesdash-modal-actions">
              <button type="button" className="cancel" onClick={closeModal}>
                {t.cancel}
              </button>
              <button type="submit" className="save" disabled={isSubmitting}>
                {isSubmitting ? t.saving : modalMode === 'create' ? t.save : t.update}
              </button>
            </div>
          </form>
        </div>
      )}

      {outcomePickerDeal && (
        <div className="salesdash-outcome-wrap" role="dialog" aria-modal="true">
          <button className="salesdash-outcome-backdrop" onClick={closeOutcomePicker} aria-label="close outcome picker" />
          <div className="salesdash-outcome-panel">
            <h4>{t.outcomeTitle}</h4>
            <p>{t.outcomeDesc}</p>
            <div className="salesdash-outcome-target">
              <span>{outcomePickerDeal.title}</span>
              <strong title={`₩${Math.round(outcomePickerDeal.amount * 10000).toLocaleString()}`}>{barMoney(outcomePickerDeal.amount)}</strong>
            </div>
            <div className="salesdash-outcome-actions">
              <button
                type="button"
                className="success"
                disabled={isOutcomeSaving}
                onClick={() => chooseOutcomeStage('success')}
              >
                {t.outcomePickSuccess}
              </button>
              <button
                type="button"
                className="failure"
                disabled={isOutcomeSaving}
                onClick={() => chooseOutcomeStage('failure')}
              >
                {t.outcomePickFailure}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
