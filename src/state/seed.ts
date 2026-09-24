import { NAIRA } from '../utils/helpers';

export interface Person {
  id: string; name: string; relation: string; relationKey: string;
}

export interface BillLine {
  name: string; qty: number; price: number; total: number; discount?: boolean;
}

export type PayerType =
  | 'hmo'
  | 'patient_self_pay'
  | 'employer'
  | 'family_sponsor'
  | 'government'
  | 'ngo_donor'
  | 'financing'
  | 'combination';

export interface PayerAllocation {
  id: string;
  payerType: PayerType;
  payerName: string;
  allocatedAmount: number;
  paidAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  approvalCode?: string;
  notes?: string;
}

export interface HealthcareEpisodeItem {
  id: string;
  category: 'Consultation' | 'Laboratory' | 'Medication' | 'Procedure' | 'Ward/Bed';
  description: string;
  date: string;
  totalCost: number;
  hmoContribution: number;
  patientSelfPay: number;
  paid: number;
  status: 'cleared' | 'partly_paid' | 'unpaid';
}

export interface HealthcareEpisode {
  id: string;
  episodeNo: string;
  title: string;
  facility: string;
  personId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed';
  items: HealthcareEpisodeItem[];
  depositPaid: number;
  depositApplied: number;
  refundCredit?: number;
  totalCost: number;
  hmoCover: number;
  patientSelfPay: number;
  patientPaid: number;
  patientDue: number;
  hmoReceivable: {
    expected: number;
    received: number;
    variance: number;
    status: 'balanced' | 'underpaid' | 'pending';
  };
}

export interface Bill {
  id: string;
  personId: string;
  facility: string;
  date: string;
  billNo: string;
  status: string;
  amountDue: number;
  amountTotal: number;
  minPart?: number;
  lines: BillLine[];
  changed?: boolean;
  hasSplit?: boolean;
  hmoAmount?: number;
  patientSelfPay?: number; // Confirmed PSP
  depositPaid?: number; // Pre-service deposit
  depositApplied?: number; // Deposit applied to confirmed Self-Pay
  refundCredit?: number; // Credit/refund if deposit > PSP
  payerAllocations?: PayerAllocation[];
  episodeId?: string;
  reconciliation?: {
    expectedHmo: number;
    receivedHmo: number;
    variance: number;
    status: 'reconciled' | 'underpaid' | 'pending';
  };
}

export interface Payment {
  id: string; billId?: string; facility: string; amount: number;
  method: string; date: string; time: string; status: string; personId: string;
  payerType?: PayerType;
  fundingSource?: 'card' | 'transfer' | 'ussd' | 'qr' | 'healthsave' | 'familypay' | 'employer' | 'financing';
}

export interface WalletTxn {
  id: string; personId: string; label: string; amount: number; date: string; sign: number;
}

export interface FinancingPlan {
  id: string; facility: string; totalInstallments: number;
  paidInstallments: number; perInstallment: number; nextDue: string; billId: string;
}

export interface HmoPolicy {
  id: string;
  provider: string;
  policyNo: string;
  enrolleeName: string;
  planTier: string;
  coPayPercent: number;
  annualLimit: number;
  usedAmount: number;
  status: 'active' | 'pending' | 'expired';
  expiryDate: string;
  coveredPersons: string[];
}

export interface PreAuthRequest {
  id: string;
  hmoPolicyId: string;
  facility: string;
  procedure: string;
  estimatedCost: number;
  coveredAmount: number;
  patientPortion: number;
  status: 'approved' | 'in_review' | 'declined';
  requestDate: string;
  approvalCode?: string;
  notes?: string;
}

export interface HospitalFacility {
  id: string;
  name: string;
  category: 'Hospital' | 'Diagnostic Centre' | 'Clinic' | 'Pharmacy';
  state: string;
  address: string;
  phone: string;
  emergency: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  welliRecordIntegrated: boolean;
  acceptedHmos: string[];
  lastSyncDate: string;
  activeBillsCount: number;
}

const mkLines = (n: number): BillLine[] => {
  const names = ['Consultation','Lab test — Full blood count','X-ray — Chest',
    'Nursing care','Ward admission (per night)','Dressing and wound care',
    'IV fluids','Paracetamol 500mg','Amoxicillin 500mg','Physiotherapy session'];
  const prices = [1500,3000,5000,8000,12000];
  const items: BillLine[] = [];
  for (let i = 0; i < n; i++) {
    const price = prices[i % prices.length];
    const rep = Math.floor(i / names.length);
    items.push({ name: names[i % names.length] + (rep > 0 ? ` (${rep+1})` : ''), qty:1, price, total:price });
  }
  if (n > 2) items.push({ name:'Facility discount', qty:1, price:-3000, total:-3000, discount:true });
  return items;
};

export const PEOPLE_SEED: Person[] = [
  { id:'self',  name:'Jay Umar',     relation:'You',     relationKey:'self'   },
  { id:'ade',   name:'Ade Okoro',    relation:'Son, 9',  relationKey:'child'  },
  { id:'faith', name:'Faith Oghene', relation:'Spouse',  relationKey:'spouse' },
];

export const BILLS_SEED: Bill[] = [
  {
    id: 'b1',
    personId: 'self',
    facility: 'Dovers Hospitals',
    date: '21 Sep 2026',
    billNo: 'DH-88213',
    status: 'unpaid',
    amountDue: 20000,
    amountTotal: 100000,
    hmoAmount: 80000,
    patientSelfPay: 20000,
    hasSplit: true,
    minPart: 5000,
    lines: mkLines(23),
    changed: true,
    episodeId: 'ep1',
    depositPaid: 0,
    depositApplied: 0,
    payerAllocations: [
      {
        id: 'pa1',
        payerType: 'hmo',
        payerName: 'Hygeia HMO (Comprehensive Tier)',
        allocatedAmount: 80000,
        paidAmount: 75000,
        status: 'approved',
        approvalCode: 'AUTH-HYG-8821',
        notes: 'Covers 80% based on accredited hospital tariff schedule',
      },
      {
        id: 'pa2',
        payerType: 'patient_self_pay',
        payerName: 'Patient Self-Pay (PSP)',
        allocatedAmount: 20000,
        paidAmount: 0,
        status: 'pending',
        notes: 'Remaining 20% patient co-responsibility',
      },
    ],
    reconciliation: {
      expectedHmo: 80000,
      receivedHmo: 75000,
      variance: 5000,
      status: 'underpaid',
    },
  },
  {
    id: 'b2',
    personId: 'self',
    facility: 'Redeemer Specialist Clinic',
    date: '10 Sep 2026',
    billNo: 'RSC-33021',
    status: 'overdue',
    amountDue: 10000,
    amountTotal: 40000,
    hmoAmount: 30000,
    patientSelfPay: 10000,
    hasSplit: true,
    minPart: 2000,
    lines: mkLines(4),
    payerAllocations: [
      {
        id: 'pa5',
        payerType: 'hmo',
        payerName: 'Reliance HMO (Classic Care)',
        allocatedAmount: 30000,
        paidAmount: 30000,
        status: 'approved',
        approvalCode: 'AUTH-REL-3302',
      },
      {
        id: 'pa6',
        payerType: 'patient_self_pay',
        payerName: 'Patient Self-Pay (PSP)',
        allocatedAmount: 10000,
        paidAmount: 0,
        status: 'pending',
      },
    ],
  },
  {
    id: 'b3',
    personId: 'ade',
    facility: 'Lagoon Diagnostics Centre',
    date: '18 Sep 2026',
    billNo: 'LDC-90211',
    status: 'partly_paid',
    amountDue: 6000,
    amountTotal: 15000,
    hmoAmount: 0,
    patientSelfPay: 15000,
    minPart: 2000,
    lines: mkLines(3),
    payerAllocations: [
      {
        id: 'pa7',
        payerType: 'patient_self_pay',
        payerName: 'Patient Self-Pay (PSP)',
        allocatedAmount: 15000,
        paidAmount: 9000,
        status: 'pending',
      },
    ],
  },
  {
    id: 'b4',
    personId: 'self',
    facility: "St. Augustine's Medical Centre",
    date: '02 Sep 2026',
    billNo: 'SAMC-70142',
    status: 'paid',
    amountDue: 0,
    amountTotal: 45000,
    hmoAmount: 35000,
    patientSelfPay: 10000,
    hasSplit: true,
    lines: mkLines(5),
    payerAllocations: [
      {
        id: 'pa8',
        payerType: 'hmo',
        payerName: 'Hygeia HMO',
        allocatedAmount: 35000,
        paidAmount: 35000,
        status: 'paid',
        approvalCode: 'AUTH-HYG-7014',
      },
      {
        id: 'pa9',
        payerType: 'patient_self_pay',
        payerName: 'Patient Self-Pay (PSP)',
        allocatedAmount: 10000,
        paidAmount: 10000,
        status: 'paid',
      },
    ],
    reconciliation: {
      expectedHmo: 35000,
      receivedHmo: 35000,
      variance: 0,
      status: 'reconciled',
    },
  },
  {
    id: 'b5',
    personId: 'faith',
    facility: 'Grace Family Clinic',
    date: '28 Aug 2026',
    billNo: 'GFC-10938',
    status: 'void',
    amountDue: 0,
    amountTotal: 12000,
    lines: mkLines(2),
  },
  {
    id: 'b6',
    personId: 'self',
    facility: 'Sunrise Medical Diagnostics',
    date: '20 Sep 2026',
    billNo: 'SMD-55210',
    status: 'awaiting_hmo',
    amountDue: 8000,
    amountTotal: 75000,
    hmoAmount: 55000,
    patientSelfPay: 20000,
    depositPaid: 5000,
    depositApplied: 5000,
    hasSplit: true,
    minPart: 5000,
    lines: mkLines(6),
    episodeId: 'ep1',
    payerAllocations: [
      {
        id: 'pa10',
        payerType: 'hmo',
        payerName: 'Reliance HMO (Primary)',
        allocatedAmount: 55000,
        paidAmount: 55000,
        status: 'approved',
        approvalCode: 'AUTH-REL-5521',
      },
      {
        id: 'pa11',
        payerType: 'patient_self_pay',
        payerName: 'Patient Self-Pay (Deposit ₦5k + Paid ₦7k + Due ₦8k)',
        allocatedAmount: 20000,
        paidAmount: 12000,
        status: 'pending',
      },
    ],
    reconciliation: {
      expectedHmo: 55000,
      receivedHmo: 55000,
      variance: 0,
      status: 'reconciled',
    },
  },
  {
    id: 'b7',
    personId: 'ade',
    facility: 'Dovers Hospitals',
    date: '10 Sep 2026',
    billNo: 'DH-88401',
    status: 'unpaid',
    amountDue: 5000,
    amountTotal: 5000,
    minPart: 2000,
    lines: mkLines(2),
  },
  {
    id: 'b8',
    personId: 'faith',
    facility: 'Grace Family Clinic',
    date: '02 Sep 2026',
    billNo: 'GFC-10877',
    status: 'paid',
    amountDue: 0,
    amountTotal: 9000,
    lines: mkLines(3),
  },
  {
    id: 'b9',
    personId: 'self',
    facility: 'Redeemer Specialist Clinic',
    date: '25 Sep 2026',
    billNo: 'RSC-33199',
    status: 'unpaid',
    amountDue: 15000,
    amountTotal: 15000,
    minPart: 5000,
    lines: mkLines(4),
  },
];

export const EPISODES_SEED: HealthcareEpisode[] = [
  {
    id: 'ep1',
    episodeNo: 'EP-2026-088',
    title: 'Acute Malaria & Enteric Fever (Typhoid) Episode',
    facility: 'Dovers Hospitals',
    personId: 'self',
    startDate: '19 Sep 2026',
    status: 'active',
    items: [
      {
        id: 'epi1',
        category: 'Consultation',
        description: 'Initial Specialist Physician Consultation & Vitals',
        date: '19 Sep 2026',
        totalCost: 15000,
        hmoContribution: 10000,
        patientSelfPay: 5000,
        paid: 5000,
        status: 'cleared',
      },
      {
        id: 'epi2',
        category: 'Laboratory',
        description: 'Comprehensive Blood Panel (FBC, Widal, Malaria Pf parasite density)',
        date: '20 Sep 2026',
        totalCost: 40000,
        hmoContribution: 30000,
        patientSelfPay: 10000,
        paid: 7000,
        status: 'partly_paid',
      },
      {
        id: 'epi3',
        category: 'Medication',
        description: 'Artesunate IV injections, Oral Ciprofloxacin & Supportive Electrolytes',
        date: '21 Sep 2026',
        totalCost: 20000,
        hmoContribution: 15000,
        patientSelfPay: 5000,
        paid: 0,
        status: 'unpaid',
      },
    ],
    depositPaid: 0,
    depositApplied: 0,
    totalCost: 75000,
    hmoCover: 55000,
    patientSelfPay: 20000,
    patientPaid: 12000,
    patientDue: 8000,
    hmoReceivable: {
      expected: 55000,
      received: 50000,
      variance: 5000,
      status: 'underpaid',
    },
  },
  {
    id: 'ep2',
    episodeNo: 'EP-2026-094',
    title: 'Diagnostic Laparoscopy & Short-Stay Observation',
    facility: 'Sunrise Medical Diagnostics',
    personId: 'self',
    startDate: '14 Sep 2026',
    endDate: '16 Sep 2026',
    status: 'completed',
    items: [
      {
        id: 'epi4',
        category: 'Consultation',
        description: 'Pre-operative Anesthetic Review & Consent',
        date: '14 Sep 2026',
        totalCost: 20000,
        hmoContribution: 16000,
        patientSelfPay: 4000,
        paid: 4000,
        status: 'cleared',
      },
      {
        id: 'epi5',
        category: 'Procedure',
        description: 'Diagnostic Laparoscopic Imaging & Biopsy',
        date: '15 Sep 2026',
        totalCost: 45000,
        hmoContribution: 35000,
        patientSelfPay: 10000,
        paid: 10000,
        status: 'cleared',
      },
      {
        id: 'epi6',
        category: 'Ward/Bed',
        description: 'Day-Stay Inpatient Observation & Nursing Support',
        date: '16 Sep 2026',
        totalCost: 35000,
        hmoContribution: 29000,
        patientSelfPay: 6000,
        paid: 6000,
        status: 'cleared',
      },
    ],
    depositPaid: 25000,
    depositApplied: 20000,
    refundCredit: 5000,
    totalCost: 100000,
    hmoCover: 80000,
    patientSelfPay: 20000,
    patientPaid: 20000,
    patientDue: 0,
    hmoReceivable: {
      expected: 80000,
      received: 80000,
      variance: 0,
      status: 'balanced',
    },
  },
];

export const PAYMENTS_SEED: Payment[] = [
  { id:'WP512340', billId:'b4', facility:"St. Augustine's Medical Centre", amount:45000, method:'card',     date:'02 Sep 2026', time:'11:20 am', status:'successful', personId:'self', payerType:'patient_self_pay' },
  { id:'WP512298', billId:'b8', facility:'Grace Family Clinic',            amount:9000,  method:'transfer', date:'02 Sep 2026', time:'3:05 pm',  status:'successful', personId:'faith', payerType:'patient_self_pay' },
  { id:'WP511870', billId:'b5', facility:'Grace Family Clinic',            amount:0,     method:'card',     date:'28 Aug 2026', time:'9:00 am',  status:'failed',     personId:'faith', payerType:'patient_self_pay' },
  { id:'WP511500', billId:'b3', facility:'Lagoon Diagnostics Centre',      amount:9000,  method:'transfer', date:'18 Sep 2026', time:'1:15 pm',  status:'successful', personId:'ade', payerType:'patient_self_pay' },
  { id:'WP508110', billId:'b1', facility:'Dovers Hospitals',               amount:12000, method:'card',     date:'10 Jun 2026', time:'10:00 am', status:'successful', personId:'self', payerType:'patient_self_pay' },
];

export const WALLETS_SEED: Record<string,number> = { self:15000, ade:0, faith:0 };

export const WALLET_TXNS_SEED: WalletTxn[] = [
  { id:'wt1', personId:'self', label:'Top up', amount:15000, date:'15 Sep 2026', sign:1 },
];

export const SAVINGS_SEED = { name:'HealthSave emergency reserve', target:100000, saved:32000 };

export const FINANCING_SEED: FinancingPlan[] = [
  { id:'fp1', facility:'Dovers Hospitals', totalInstallments:4, paidInstallments:1, perInstallment:10000, nextDue:'15 Oct 2026', billId:'b1' },
];

export const SPEND_DATA: Record<string,Array<{month:string;amount:number}>> = {
  self:  [{month:'Jun',amount:12000},{month:'Jul',amount:0},{month:'Aug',amount:6000},{month:'Sep',amount:65000}],
  ade:   [{month:'Jun',amount:0},{month:'Jul',amount:18000},{month:'Aug',amount:0},{month:'Sep',amount:9000}],
  faith: [{month:'Jun',amount:0},{month:'Jul',amount:0},{month:'Aug',amount:9000},{month:'Sep',amount:0}],
};

export const NOTIFS_SEED = [
  { id:'n1', title:'HMO Benefit Adjudicated', body:'Hygeia HMO approved ₦80,000. Patient Self-Pay: ₦20,000.', time:'2 hours ago', icon:'🛡️', billId:'b1', unread:true },
  { id:'n2', title:'Payment confirmed', body:"₦45,000 paid to St. Augustine's", time:'3 days ago', icon:'✓', unread:true },
  { id:'n3', title:'Bill overdue', body:'Redeemer Specialist Clinic — ₦10,000 Self-Pay due', time:'5 days ago', icon:'⚠', billId:'b2', unread:false },
  { id:'n4', title:'Auto-pay ran', body:'₦5,000 deducted from HealthSave', time:'1 week ago', icon:'₦', unread:false },
];

export const FAQS = [
  { q:'What is Patient Self-Pay (PSP)?', a:'PSP is the exact portion of your healthcare bill that remains your responsibility after your HMO or other primary payers have paid their approved tariff contribution.' },
  { q:'How does the Dual-Payer model work?', a:'Your HMO processes your healthcare claim first based on your benefit schedule. WelliPay then presents your confirmed Patient Self-Pay balance with transparent options to pay now, split across HealthSave, or request family/employer support.' },
  { q:'What is the difference between a Deposit and Self-Pay?', a:'A deposit is money paid upfront before your final bill is known. Confirmed Self-Pay is calculated after your services and HMO coverage are verified. Your deposit is automatically applied to reduce your Self-Pay, and any excess is creditable or refundable.' },
  { q:'What is WelliPay Reconcile™?', a:'It tracks hospital settlements and identifies variances or underpayments between expected HMO remitted amounts and what was actually received.' },
];

export const HMO_SEED: HmoPolicy[] = [
  {
    id: 'hmo1',
    provider: 'Hygeia HMO',
    policyNo: 'HYG-882910-A',
    enrolleeName: 'Jay Umar',
    planTier: 'Comprehensive Gold',
    coPayPercent: 20,
    annualLimit: 2500000,
    usedAmount: 480000,
    status: 'active',
    expiryDate: '31 Dec 2026',
    coveredPersons: ['self', 'ade'],
  },
  {
    id: 'hmo2',
    provider: 'Reliance HMO',
    policyNo: 'REL-440219-B',
    enrolleeName: 'Jay Umar',
    planTier: 'Executive Corporate Plan',
    coPayPercent: 10,
    annualLimit: 5000000,
    usedAmount: 1120000,
    status: 'active',
    expiryDate: '30 Jun 2027',
    coveredPersons: ['self', 'faith', 'ade'],
  },
  {
    id: 'hmo3',
    provider: 'AXA Mansard',
    policyNo: 'AXA-992104-C',
    enrolleeName: 'Faith Oghene',
    planTier: 'Platinum Family Cover',
    coPayPercent: 15,
    annualLimit: 3000000,
    usedAmount: 250000,
    status: 'active',
    expiryDate: '15 Nov 2026',
    coveredPersons: ['faith', 'ade'],
  },
];

export const PREAUTH_SEED: PreAuthRequest[] = [
  {
    id: 'pa1',
    hmoPolicyId: 'hmo1',
    facility: 'Dovers Hospitals',
    procedure: 'Elective Herniorrhaphy Surgery',
    estimatedCost: 350000,
    coveredAmount: 280000,
    patientPortion: 70000,
    status: 'approved',
    requestDate: '20 Sep 2026',
    approvalCode: 'AUTH-HYG-9021',
    notes: 'Pre-auth approved for surgeon fee, anesthesia, and 2-night semi-private ward admission.',
  },
  {
    id: 'pa2',
    hmoPolicyId: 'hmo1',
    facility: 'Lagoon Diagnostics Centre',
    procedure: 'Lumbar Spine MRI with Contrast',
    estimatedCost: 140000,
    coveredAmount: 126000,
    patientPortion: 14000,
    status: 'approved',
    requestDate: '17 Sep 2026',
    approvalCode: 'AUTH-HYG-6603',
    notes: 'Prior approval valid for 14 days at accredited imaging centres.',
  },
  {
    id: 'pa3',
    hmoPolicyId: 'hmo2',
    facility: 'Redeemer Specialist Clinic',
    procedure: 'Inpatient Ward Admission (3 Nights)',
    estimatedCost: 85000,
    coveredAmount: 85000,
    patientPortion: 0,
    status: 'in_review',
    requestDate: '23 Sep 2026',
    notes: 'Under review by Reliance HMO medical claims board.',
  },
];

export const FACILITIES_SEED: HospitalFacility[] = [
  {
    id: 'fac1',
    name: 'Dovers Hospitals',
    category: 'Hospital',
    state: 'Lagos',
    address: 'Plot 14, Admiralty Way, Lekki Phase 1, Lagos',
    phone: '01 271 0000',
    emergency: '0800 368 377',
    bankName: 'Access Bank',
    accountNo: '0123456789',
    accountName: 'Dovers Hospitals Ltd',
    welliRecordIntegrated: true,
    acceptedHmos: ['Hygeia HMO', 'Reliance HMO', 'AXA Mansard', 'Leadway Health', 'Avon HMO'],
    lastSyncDate: 'Today, 8:15 am',
    activeBillsCount: 2,
  },
  {
    id: 'fac2',
    name: 'Redeemer Specialist Clinic',
    category: 'Clinic',
    state: 'Lagos',
    address: '24 Bishop Oluwole St, Victoria Island, Lagos',
    phone: '01 279 8844',
    emergency: '0803 111 8844',
    bankName: 'Zenith Bank',
    accountNo: '1012345678',
    accountName: 'Redeemer Specialist Clinic',
    welliRecordIntegrated: true,
    acceptedHmos: ['Hygeia HMO', 'AXA Mansard', 'Metrohealth', 'Leadway Health'],
    lastSyncDate: 'Today, 7:30 am',
    activeBillsCount: 2,
  },
  {
    id: 'fac3',
    name: 'Lagoon Diagnostics Centre',
    category: 'Diagnostic Centre',
    state: 'Lagos',
    address: '8 Marine Road, Apapa / Ikoyi Branch, Lagos',
    phone: '01 461 0244',
    emergency: '0800 524 666',
    bankName: 'Guaranty Trust Bank',
    accountNo: '0234567890',
    accountName: 'Lagoon Diagnostics Services',
    welliRecordIntegrated: true,
    acceptedHmos: ['Hygeia HMO', 'Reliance HMO', 'Avon HMO', 'Total Health'],
    lastSyncDate: 'Yesterday, 4:50 pm',
    activeBillsCount: 1,
  },
  {
    id: 'fac4',
    name: "St. Augustine's Medical Centre",
    category: 'Hospital',
    state: 'Lagos',
    address: '15 Isaac John St, GRA Ikeja, Lagos',
    phone: '01 493 5021',
    emergency: '0802 000 5021',
    bankName: 'First Bank of Nigeria',
    accountNo: '2034567891',
    accountName: "St. Augustine's Medical Centre",
    welliRecordIntegrated: true,
    acceptedHmos: ['Hygeia HMO', 'Reliance HMO', 'AXA Mansard', 'Bastion HMO'],
    lastSyncDate: '21 Sep 2026',
    activeBillsCount: 0,
  },
  {
    id: 'fac5',
    name: 'Grace Family Clinic',
    category: 'Clinic',
    state: 'Lagos',
    address: '56 Commercial Avenue, Sabo Yaba, Lagos',
    phone: '01 774 2200',
    emergency: '0805 111 2200',
    bankName: 'Providus Bank',
    accountNo: '5401234567',
    accountName: 'Grace Family Clinic Healthcare Ltd',
    welliRecordIntegrated: true,
    acceptedHmos: ['Hygeia HMO', 'Reliance HMO'],
    lastSyncDate: '18 Sep 2026',
    activeBillsCount: 0,
  },
  {
    id: 'fac6',
    name: 'Sunrise Medical Diagnostics',
    category: 'Diagnostic Centre',
    state: 'Abuja',
    address: 'Plot 310, Gana Street, Maitama, Abuja FCT',
    phone: '09 290 4400',
    emergency: '0800 786 7473',
    bankName: 'Stanbic IBTC Bank',
    accountNo: '0045678901',
    accountName: 'Sunrise Medical Abuja Ltd',
    welliRecordIntegrated: true,
    acceptedHmos: ['Hygeia HMO', 'Reliance HMO', 'AXA Mansard', 'Leadway Health'],
    lastSyncDate: '20 Sep 2026',
    activeBillsCount: 1,
  },
];
