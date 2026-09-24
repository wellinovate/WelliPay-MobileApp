import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NAIRA } from '../utils/helpers';
import {
  PEOPLE_SEED, BILLS_SEED, PAYMENTS_SEED, WALLETS_SEED,
  WALLET_TXNS_SEED, SAVINGS_SEED, FINANCING_SEED,
  HMO_SEED, PREAUTH_SEED, FACILITIES_SEED,
  Bill, Payment, Person, WalletTxn, FinancingPlan,
  HmoPolicy, PreAuthRequest, HospitalFacility,
} from './seed';

export type Lang = 'en' | 'pcm';

export interface AppState {
  // -- hydration
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;

  // -- app meta
  lang: Lang;
  appPin: string;
  biometricEnabled: boolean;
  activePerson: string;

  // -- data (mutable)
  bills: Bill[];
  payments: Payment[];
  wallets: Record<string, number>;
  walletTxns: WalletTxn[];
  people: Person[];
  walletAutoPay: Record<string, boolean>;
  savingsGoal: { name: string; target: number; saved: number };
  financingPlans: FinancingPlan[];

  // -- healthcare & insurance
  hmoPolicies: HmoPolicy[];
  activeHmoId: string;
  preAuths: PreAuthRequest[];
  facilities: HospitalFacility[];
  lastSyncTime: string;
  isSyncing: boolean;

  // -- prefs
  hmoShare: boolean;
  marketing: boolean;
  notifBills: boolean;
  notifReceipts: boolean;
  notifPromo: boolean;

  // -- payment session
  payBillId: string | null;
  payContext: 'bill' | 'topup' | 'savings' | 'installment';
  payAmountMode: 'full' | 'part';
  payPartAmount: string;
  payMethod: 'card' | 'transfer' | 'wallet' | null;
  payOutcome: 'success' | 'failed' | 'pending' | 'expired' | 'review' | null;
  payFailReason: string;
  lastPayRef: string;
  lastPayAmount: number;
  lastPayRemaining: number;
  topupPresetIdx: number | null;
  topupCustom: string;

  // -- report
  reportBillId: string | null;
  reportCategory: string;
  reportDesc: string;
  reportSubmitted: boolean;
  reportTicket: string;

  // -- delete
  deleteStage: 'idle' | 'confirming' | 'done';

  // -- actions
  setLang: (lang: Lang) => void;
  setActivePerson: (id: string) => void;
  toggleAutoPay: (personId: string) => void;
  runAutoPay: (personId: string) => void;
  topupWallet: (personId: string, amount: number) => void;
  finalisePayment: () => void;
  setPaySession: (partial: Partial<AppState>) => void;
  addPerson: (person: Person) => void;
  addBill: (bill: Bill) => void;
  deleteBill: (billId: string) => void;
  updateSavingsGoal: (savedDelta: number) => void;
  togglePref: (key: 'hmoShare'|'marketing'|'notifBills'|'notifReceipts'|'notifPromo') => void;
  toggleBio: () => void;
  resetStore: () => void;

  // -- healthcare actions
  addHmoPolicy: (policy: HmoPolicy) => void;
  setActiveHmo: (id: string) => void;
  applyHmoToBill: (billId: string, policyId?: string) => void;
  submitPreAuth: (preAuth: PreAuthRequest) => void;
  syncWelliRecord: (facilityId?: string) => Promise<void>;
  toggleFacilityLink: (facilityId: string) => void;
}

const initState = () => ({
  _hasHydrated: false,
  lang: 'en' as Lang,
  appPin: '1234',
  biometricEnabled: false,
  activePerson: 'self',
  bills: BILLS_SEED.map(b => ({ ...b, lines: [...b.lines] })),
  payments: [...PAYMENTS_SEED],
  wallets: { ...WALLETS_SEED },
  walletTxns: [...WALLET_TXNS_SEED],
  people: PEOPLE_SEED.map(p => ({ ...p })),
  walletAutoPay: { self: false, ade: false, faith: false },
  savingsGoal: { ...SAVINGS_SEED },
  financingPlans: FINANCING_SEED.map(p => ({ ...p })),

  // healthcare seeds
  hmoPolicies: HMO_SEED.map(h => ({ ...h, coveredPersons: [...h.coveredPersons] })),
  activeHmoId: 'hmo1',
  preAuths: PREAUTH_SEED.map(p => ({ ...p })),
  facilities: FACILITIES_SEED.map(f => ({ ...f, acceptedHmos: [...f.acceptedHmos] })),
  lastSyncTime: 'Today, 8:15 am',
  isSyncing: false,

  hmoShare: true,
  marketing: false,
  notifBills: true,
  notifReceipts: true,
  notifPromo: false,
  payBillId: null,
  payContext: 'bill' as const,
  payAmountMode: 'full' as const,
  payPartAmount: '',
  payMethod: null,
  payOutcome: null,
  payFailReason: 'default',
  lastPayRef: '',
  lastPayAmount: 0,
  lastPayRemaining: 0,
  topupPresetIdx: null,
  topupCustom: '',
  reportBillId: null,
  reportCategory: '',
  reportDesc: '',
  reportSubmitted: false,
  reportTicket: '',
  deleteStage: 'idle' as const,
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initState(),

      setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),
      setLang: (lang) => set({ lang }),
      setActivePerson: (id) => set({ activePerson: id }),
      toggleAutoPay: (personId) =>
        set(s => ({ walletAutoPay: { ...s.walletAutoPay, [personId]: !s.walletAutoPay[personId] } })),

      runAutoPay: (personId) => {
        const s = get();
        const wallet = s.wallets[personId] || 0;
        const bill = s.bills.find(b =>
          b.personId === personId && ['unpaid','overdue'].includes(b.status) && b.amountDue <= wallet
        );
        if (!bill) return;
        const newBills = s.bills.map(b =>
          b.id === bill.id ? { ...b, amountDue: 0, status: 'paid' } : b
        );
        const newTxn: WalletTxn = {
          id: 'wt' + Date.now(),
          personId,
          label: 'Auto-pay: ' + bill.facility,
          amount: bill.amountDue,
          date: new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }),
          sign: -1,
        };
        set({
          bills: newBills,
          wallets: { ...s.wallets, [personId]: wallet - bill.amountDue },
          walletTxns: [newTxn, ...s.walletTxns],
        });
      },

      topupWallet: (personId, amount) => {
        const s = get();
        const newTxn: WalletTxn = {
          id: 'wt' + Date.now(),
          personId,
          label: 'Top up',
          amount,
          date: new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }),
          sign: 1,
        };
        set({
          wallets: { ...s.wallets, [personId]: (s.wallets[personId] || 0) + amount },
          walletTxns: [newTxn, ...s.walletTxns],
        });
      },

      finalisePayment: () => {
        const s = get();
        const amt = (() => {
          if (s.payContext === 'bill') {
            const bill = s.bills.find(b => b.id === s.payBillId);
            if (!bill) return 0;
            if (s.payAmountMode === 'full') return bill.amountDue;
            return parseInt(s.payPartAmount.replace(/[^0-9]/g, '')) || 0;
          }
          if (s.payContext === 'topup' || s.payContext === 'savings') {
            if (s.topupPresetIdx !== null) return [5000, 10000, 20000, 50000][s.topupPresetIdx] || 0;
            return parseInt(s.topupCustom.replace(/[^0-9]/g, '')) || 0;
          }
          if (s.payContext === 'installment') {
            const plan = s.financingPlans.find(p => p.id === s.payBillId);
            return plan ? plan.perInstallment : 0;
          }
          return 0;
        })();

        const ref = 'WP' + Date.now().toString().slice(-6);
        let remaining = 0;

        let newBills = s.bills;
        if (s.payContext === 'bill') {
          newBills = s.bills.map(b => {
            if (b.id !== s.payBillId) return b;
            const newDue = Math.max(0, b.amountDue - amt);
            remaining = newDue;
            return { ...b, amountDue: newDue, status: newDue === 0 ? 'paid' : 'partly_paid' };
          });
        }

        let newWallets = { ...s.wallets };
        let newTxns = [...s.walletTxns];
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
        const h = now.getHours(), m = String(now.getMinutes()).padStart(2, '0');
        const timeStr = `${h % 12 || 12}:${m} ${h >= 12 ? 'pm' : 'am'}`;

        if (s.payMethod === 'wallet' || s.payContext === 'topup') {
          if (s.payContext === 'topup') {
            newWallets[s.activePerson] = (newWallets[s.activePerson] || 0) + amt;
            newTxns = [{ id: 'wt' + Date.now(), personId: s.activePerson, label: 'Top up', amount: amt, date: dateStr, sign: 1 }, ...newTxns];
          } else {
            newWallets[s.activePerson] = Math.max(0, (newWallets[s.activePerson] || 0) - amt);
            newTxns = [{ id: 'wt' + Date.now(), personId: s.activePerson, label: 'Bill payment', amount: amt, date: dateStr, sign: -1 }, ...newTxns];
          }
        }

        if (s.payContext === 'savings') {
          const sg = s.savingsGoal;
          const newSaved = Math.min(sg.target, sg.saved + amt);
          set({ savingsGoal: { ...sg, saved: newSaved } });
        }

        let newPlans = s.financingPlans;
        if (s.payContext === 'installment') {
          newPlans = s.financingPlans.map(p =>
            p.id === s.payBillId ? { ...p, paidInstallments: p.paidInstallments + 1 } : p
          );
        }

        const bill = s.bills.find(b => b.id === s.payBillId);
        const newPayment: Payment = {
          id: ref,
          billId: s.payBillId || undefined,
          facility: bill ? bill.facility : 'WelliPay Direct',
          amount: amt,
          method: s.payMethod || 'card',
          date: dateStr,
          time: timeStr,
          status: 'successful',
          personId: s.activePerson,
        };

        set({
          bills: newBills,
          wallets: newWallets,
          walletTxns: newTxns,
          financingPlans: newPlans,
          payments: [newPayment, ...s.payments],
          payOutcome: 'success',
          lastPayRef: ref,
          lastPayAmount: amt,
          lastPayRemaining: remaining,
        });
      },

      setPaySession: (partial) => set(partial as any),

      addPerson: (person) => {
        const s = get();
        set({
          people: [...s.people, person],
          wallets: { ...s.wallets, [person.id]: 0 },
          walletAutoPay: { ...s.walletAutoPay, [person.id]: false },
        });
      },

      addBill: (bill) => {
        const s = get();
        set({ bills: [bill, ...s.bills] });
      },

      deleteBill: (billId) => {
        const s = get();
        set({ bills: s.bills.filter(b => b.id !== billId) });
      },

      updateSavingsGoal: (savedDelta) => {
        const s = get();
        const sg = s.savingsGoal;
        const newSaved = Math.max(0, Math.min(sg.target, sg.saved + savedDelta));
        set({ savingsGoal: { ...sg, saved: newSaved } });
      },

      togglePref: (key) => set(s => ({ [key]: !s[key] } as any)),
      toggleBio: () => set(s => ({ biometricEnabled: !s.biometricEnabled })),

      // -- healthcare methods
      addHmoPolicy: (policy) => {
        const s = get();
        set({
          hmoPolicies: [policy, ...s.hmoPolicies],
          activeHmoId: policy.id,
        });
      },

      setActiveHmo: (id) => set({ activeHmoId: id }),

      applyHmoToBill: (billId, policyId) => {
        const s = get();
        const policy = s.hmoPolicies.find(p => p.id === (policyId || s.activeHmoId)) || s.hmoPolicies[0];
        if (!policy) return;

        const newBills = s.bills.map(b => {
          if (b.id !== billId) return b;
          const total = b.amountTotal;
          const coPay = Math.round((total * policy.coPayPercent) / 100);
          const hmoPortion = total - coPay;
          return {
            ...b,
            hasSplit: true,
            hmoAmount: hmoPortion,
            amountDue: coPay,
            status: coPay === 0 ? 'paid' : 'unpaid',
          };
        });

        set({ bills: newBills });
      },

      submitPreAuth: (preAuth) => {
        const s = get();
        set({
          preAuths: [preAuth, ...s.preAuths],
        });
      },

      syncWelliRecord: async (facilityId) => {
        set({ isSyncing: true });
        await new Promise(resolve => setTimeout(resolve, 1500));
        const now = new Date();
        const h = now.getHours(), m = String(now.getMinutes()).padStart(2, '0');
        const syncTimeStr = `Today, ${h % 12 || 12}:${m} ${h >= 12 ? 'pm' : 'am'}`;

        const s = get();
        const updatedFacilities = s.facilities.map(f => {
          if (!facilityId || f.id === facilityId) {
            return { ...f, lastSyncDate: syncTimeStr };
          }
          return f;
        });

        set({
          isSyncing: false,
          lastSyncTime: syncTimeStr,
          facilities: updatedFacilities,
        });
      },

      toggleFacilityLink: (facilityId) => {
        const s = get();
        const updated = s.facilities.map(f =>
          f.id === facilityId ? { ...f, welliRecordIntegrated: !f.welliRecordIntegrated } : f
        );
        set({ facilities: updated });
      },

      resetStore: () => set(initState()),
    }),
    {
      name: 'wellipay_mobile_store_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lang: state.lang,
        appPin: state.appPin,
        biometricEnabled: state.biometricEnabled,
        activePerson: state.activePerson,
        bills: state.bills,
        payments: state.payments,
        wallets: state.wallets,
        walletTxns: state.walletTxns,
        people: state.people,
        walletAutoPay: state.walletAutoPay,
        savingsGoal: state.savingsGoal,
        financingPlans: state.financingPlans,
        hmoPolicies: state.hmoPolicies,
        activeHmoId: state.activeHmoId,
        preAuths: state.preAuths,
        facilities: state.facilities,
        lastSyncTime: state.lastSyncTime,
        hmoShare: state.hmoShare,
        marketing: state.marketing,
        notifBills: state.notifBills,
        notifReceipts: state.notifReceipts,
        notifPromo: state.notifPromo,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
