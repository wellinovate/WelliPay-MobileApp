import { NAIRA } from '../utils/helpers';

export interface Person {
  id: string; name: string; relation: string; relationKey: string;
}
export interface BillLine {
  name: string; qty: number; price: number; total: number; discount?: boolean;
}
export interface Bill {
  id: string; personId: string; facility: string; date: string;
  billNo: string; status: string; amountDue: number; amountTotal: number;
  minPart?: number; lines: BillLine[]; changed?: boolean;
  hasSplit?: boolean; hmoAmount?: number;
}
export interface Payment {
  id: string; billId?: string; facility: string; amount: number;
  method: string; date: string; time: string; status: string; personId: string;
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
  { id:'b1', personId:'self',  facility:'Dovers Hospitals',              date:'21 Sep 2026', billNo:'DH-88213',   status:'unpaid',       amountDue:20000, amountTotal:20000, minPart:5000,  lines:mkLines(23), changed:true },
  { id:'b2', personId:'self',  facility:'Redeemer Specialist Clinic',    date:'10 Sep 2026', billNo:'RSC-33021',  status:'overdue',      amountDue:8500,  amountTotal:8500,  minPart:2000,  lines:mkLines(4) },
  { id:'b3', personId:'ade',   facility:'Lagoon Diagnostics Centre',     date:'18 Sep 2026', billNo:'LDC-90211',  status:'partly_paid',  amountDue:6000,  amountTotal:15000, minPart:2000,  lines:mkLines(3) },
  { id:'b4', personId:'self',  facility:"St. Augustine's Medical Centre",date:'02 Sep 2026', billNo:'SAMC-70142', status:'paid',         amountDue:0,     amountTotal:45000, lines:mkLines(5) },
  { id:'b5', personId:'faith', facility:'Grace Family Clinic',           date:'28 Aug 2026', billNo:'GFC-10938',  status:'void',         amountDue:0,     amountTotal:12000, lines:mkLines(2) },
  { id:'b6', personId:'self',  facility:'Sunrise Medical Diagnostics',   date:'20 Sep 2026', billNo:'SMD-55210',  status:'awaiting_hmo', amountDue:20000, amountTotal:45000, hmoAmount:25000, hasSplit:true, minPart:5000, lines:mkLines(6) },
  { id:'b7', personId:'ade',   facility:'Dovers Hospitals',              date:'10 Sep 2026', billNo:'DH-88401',   status:'unpaid',       amountDue:5000,  amountTotal:5000,  minPart:2000,  lines:mkLines(2) },
  { id:'b8', personId:'faith', facility:'Grace Family Clinic',           date:'02 Sep 2026', billNo:'GFC-10877',  status:'paid',         amountDue:0,     amountTotal:9000,  lines:mkLines(3) },
  { id:'b9', personId:'self',  facility:'Redeemer Specialist Clinic',    date:'25 Sep 2026', billNo:'RSC-33199',  status:'unpaid',       amountDue:15000, amountTotal:15000, minPart:5000,  lines:mkLines(4) },
];

export const PAYMENTS_SEED: Payment[] = [
  { id:'WP512340', billId:'b4', facility:"St. Augustine's Medical Centre", amount:45000, method:'card',     date:'02 Sep 2026', time:'11:20 am', status:'successful', personId:'self' },
  { id:'WP512298', billId:'b8', facility:'Grace Family Clinic',            amount:9000,  method:'transfer', date:'02 Sep 2026', time:'3:05 pm',  status:'successful', personId:'faith' },
  { id:'WP511870', billId:'b5', facility:'Grace Family Clinic',            amount:0,     method:'card',     date:'28 Aug 2026', time:'9:00 am',  status:'failed',     personId:'faith' },
  { id:'WP511500', billId:'b3', facility:'Lagoon Diagnostics Centre',      amount:9000,  method:'transfer', date:'18 Sep 2026', time:'1:15 pm',  status:'successful', personId:'ade' },
  { id:'WP508110', billId:'b1', facility:'Dovers Hospitals',               amount:12000, method:'card',     date:'10 Jun 2026', time:'10:00 am', status:'successful', personId:'self' },
];

export const WALLETS_SEED: Record<string,number> = { self:15000, ade:0, faith:0 };

export const WALLET_TXNS_SEED: WalletTxn[] = [
  { id:'wt1', personId:'self', label:'Top up', amount:15000, date:'15 Sep 2026', sign:1 },
];

export const SAVINGS_SEED = { name:'Surgery fund', target:100000, saved:32000 };

export const FINANCING_SEED: FinancingPlan[] = [
  { id:'fp1', facility:'Dovers Hospitals', totalInstallments:4, paidInstallments:1, perInstallment:10000, nextDue:'15 Oct 2026', billId:'b1' },
];

export const SPEND_DATA: Record<string,Array<{month:string;amount:number}>> = {
  self:  [{month:'Jun',amount:12000},{month:'Jul',amount:0},{month:'Aug',amount:6000},{month:'Sep',amount:65000}],
  ade:   [{month:'Jun',amount:0},{month:'Jul',amount:18000},{month:'Aug',amount:0},{month:'Sep',amount:9000}],
  faith: [{month:'Jun',amount:0},{month:'Jul',amount:0},{month:'Aug',amount:9000},{month:'Sep',amount:0}],
};

export const NOTIFS_SEED = [
  { id:'n1', title:'New bill from Dovers Hospitals', body:'₦20,000 — Bill no. DH-88213', time:'2 hours ago', icon:'📄', billId:'b1', unread:true },
  { id:'n2', title:'Payment confirmed', body:"₦45,000 paid to St. Augustine's", time:'3 days ago', icon:'✓', unread:true },
  { id:'n3', title:'Bill overdue', body:'Redeemer Specialist Clinic — ₦8,500', time:'5 days ago', icon:'⚠', billId:'b2', unread:false },
  { id:'n4', title:'Auto-pay ran', body:'₦5,000 deducted from wallet', time:'1 week ago', icon:'₦', unread:false },
];

export const FAQS = [
  { q:'How do I add a bill?', a:'Tap "Add a bill" on the Home screen. Scan the QR code or enter the bill code manually.' },
  { q:'Which payment methods are supported?', a:'WelliPay wallet, debit/credit card (Visa, Mastercard, Verve), or bank transfer.' },
  { q:'How does the wallet work?', a:'Top up once, then pay bills instantly without entering card details each time.' },
  { q:'Can I pay for a family member?', a:'Yes — add dependants under People and switch to their profile to see and pay their bills.' },
  { q:'What is WelliRecord?', a:'WelliRecord links your hospital record so bills appear automatically when facilities raise them.' },
];

export const HMO_SEED: HmoPolicy[] = [
  {
    id: 'hmo1',
    provider: 'Hygeia HMO',
    policyNo: 'HYG-884021-01',
    enrolleeName: 'Jay Umar',
    planTier: 'Silver Comprehensive',
    coPayPercent: 10,
    annualLimit: 1500000,
    usedAmount: 420000,
    status: 'active',
    expiryDate: '31 Dec 2026',
    coveredPersons: ['self', 'ade', 'faith'],
  },
  {
    id: 'hmo2',
    provider: 'Reliance HMO',
    policyNo: 'REL-904122-B',
    enrolleeName: 'Jay Umar',
    planTier: 'Family Comfort',
    coPayPercent: 0,
    annualLimit: 850000,
    usedAmount: 190000,
    status: 'active',
    expiryDate: '15 Nov 2026',
    coveredPersons: ['self', 'ade'],
  },
  {
    id: 'hmo3',
    provider: 'AXA Mansard Health',
    policyNo: 'AXA-110294-M',
    enrolleeName: 'Faith Oghene',
    planTier: 'Gold Executive',
    coPayPercent: 15,
    annualLimit: 3000000,
    usedAmount: 680000,
    status: 'active',
    expiryDate: '30 Sep 2026',
    coveredPersons: ['faith'],
  },
];

export const PREAUTH_SEED: PreAuthRequest[] = [
  {
    id: 'pa1',
    hmoPolicyId: 'hmo1',
    facility: 'Dovers Hospitals',
    procedure: 'Endoscopic Sinus Procedure',
    estimatedCost: 320000,
    coveredAmount: 288000,
    patientPortion: 32000,
    status: 'approved',
    requestDate: '19 Sep 2026',
    approvalCode: 'AUTH-HYG-7701',
    notes: 'Approved under ENT Specialist coverage with 10% patient co-pay.',
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
