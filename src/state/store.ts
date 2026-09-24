import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NAIRA } from '../utils/helpers';
import {
  PEOPLE_SEED, BILLS_SEED, PAYMENTS_SEED, WALLETS_SEED,
  WALLET_TXNS_SEED, SAVINGS_SEED, FINANCING_SEED,
  HMO_SEED, PREAUTH_SEED, FACILITIES_SEED, EPISODES_SEED,
  Bill, Payment, Person, WalletTxn, FinancingPlan,
  HmoPolicy, PreAuthRequest, HospitalFacility, HealthcareEpisode,
  PayerAllocation, PayerType,
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
  episodes: HealthcareEpisode[];
  activeEpisodeId: string | null;
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
  adjudicateHmoTariff: (billId: string, policyId?: string) => void;
  applyDepositToBill: (billId: string, depositAmount: number) => void;
  fundPspWithHealthSave: (billId: string, amount: number) => void;
  requestFamilyPay: (billId: string, sponsorName: string, amount: number) => void;
  applyEmployerBenefit: (billId: string, employerName: string, amount: number) => void;
  recordHmoRemittance: (billId: string, receivedAmount: number) => void;
  setActiveEpisode: (episodeId: string | null) => void;
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
  bills: BILLS_SEED.map(b => ({
    ...b,
    lines: [...b.lines],
    payerAllocations: b.payerAllocations ? b.payerAllocations.map(p => ({ ...p })) : undefined,
  })),
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
  episodes: EPISODES_SEED.map(e => ({ ...e, items: e.items.map(it => ({ ...it })) })),
  activeEpisodeId: 'ep1',
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

            // update payer allocations
            const updatedAllocations = (b.payerAllocations || []).map(pa => {
              if (pa.payerType === 'patient_self_pay') {
                const newPaid = pa.paidAmount + amt;
                return {
                  ...pa,
                  paidAmount: newPaid,
                  status: (newPaid >= pa.allocatedAmount ? 'paid' : 'pending') as any,
                };
              }
              return pa;
            });

            return {
              ...b,
              amountDue: newDue,
              status: newDue === 0 ? 'paid' : 'partly_paid',
              payerAllocations: updatedAllocations.length ? updatedAllocations : b.payerAllocations,
            };
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

        // update active episode if bill linked
        const currentBill = s.bills.find(b => b.id === s.payBillId);
        let newEpisodes = s.episodes;
        if (currentBill && currentBill.episodeId) {
          newEpisodes = s.episodes.map(ep => {
            if (ep.id === currentBill.episodeId) {
              const newPaid = ep.patientPaid + amt;
              const newDue = Math.max(0, ep.patientSelfPay - newPaid);
              return {
                ...ep,
                patientPaid: newPaid,
                patientDue: newDue,
                status: (newDue === 0 ? 'completed' : 'active') as any,
              };
            }
            return ep;
          });
        }

        const newPayment: Payment = {
          id: ref,
          billId: s.payBillId || undefined,
          facility: currentBill ? currentBill.facility : 'WelliPay Direct',
          amount: amt,
          method: s.payMethod || 'card',
          date: dateStr,
          time: timeStr,
          status: 'successful',
          personId: s.activePerson,
          payerType: 'patient_self_pay',
        };

        set({
          bills: newBills,
          wallets: newWallets,
          walletTxns: newTxns,
          financingPlans: newPlans,
          episodes: newEpisodes,
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
        get().adjudicateHmoTariff(billId, policyId);
      },

      adjudicateHmoTariff: (billId, policyId) => {
        const s = get();
        const policy = s.hmoPolicies.find(p => p.id === (policyId || s.activeHmoId)) || s.hmoPolicies[0];
        if (!policy) return;

        const newBills = s.bills.map(b => {
          if (b.id !== billId) return b;
          const total = b.amountTotal;
          // Step 3: Check benefit (provider tariff vs HMO benefit)
          const coPay = Math.round((total * policy.coPayPercent) / 100);
          const hmoPortion = total - coPay;
          const deposit = b.depositPaid || 0;
          const depositApplied = Math.min(deposit, coPay);
          const refundCredit = Math.max(0, deposit - coPay);
          const netDue = Math.max(0, coPay - depositApplied);

          const hmoAlloc: PayerAllocation = {
            id: 'pa_' + Date.now() + '_hmo',
            payerType: 'hmo',
            payerName: `${policy.provider} (${policy.planTier})`,
            allocatedAmount: hmoPortion,
            paidAmount: hmoPortion,
            status: 'approved',
            approvalCode: `AUTH-${policy.provider.slice(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
            notes: `Adjudicated under member ID ${policy.policyNo}`,
          };

          const pspAlloc: PayerAllocation = {
            id: 'pa_' + Date.now() + '_psp',
            payerType: 'patient_self_pay',
            payerName: 'Patient Self-Pay (PSP)',
            allocatedAmount: coPay,
            paidAmount: depositApplied,
            status: netDue === 0 ? 'paid' : 'pending',
            notes: depositApplied > 0 ? `₦${depositApplied.toLocaleString()} applied from pre-service deposit` : undefined,
          };

          return {
            ...b,
            hasSplit: true,
            hmoAmount: hmoPortion,
            patientSelfPay: coPay,
            depositApplied,
            refundCredit,
            amountDue: netDue,
            status: netDue === 0 ? 'paid' : 'unpaid',
            payerAllocations: [hmoAlloc, pspAlloc],
            reconciliation: {
              expectedHmo: hmoPortion,
              receivedHmo: hmoPortion,
              variance: 0,
              status: 'reconciled' as const,
            },
          };
        });

        set({ bills: newBills });
      },

      applyDepositToBill: (billId, depositAmount) => {
        const s = get();
        const newBills = s.bills.map(b => {
          if (b.id !== billId) return b;
          const psp = b.patientSelfPay !== undefined ? b.patientSelfPay : b.amountDue;
          const depositApplied = Math.min(depositAmount, psp);
          const refundCredit = Math.max(0, depositAmount - psp);
          const newDue = Math.max(0, psp - depositApplied);

          return {
            ...b,
            depositPaid: depositAmount,
            depositApplied,
            refundCredit,
            amountDue: newDue,
            status: newDue === 0 ? 'paid' : 'partly_paid',
          };
        });

        set({ bills: newBills });
      },

      fundPspWithHealthSave: (billId, amount) => {
        const s = get();
        const bill = s.bills.find(b => b.id === billId);
        if (!bill || amount <= 0) return;
        const actualDeduct = Math.min(amount, s.savingsGoal.saved, bill.amountDue);
        if (actualDeduct <= 0) return;

        const newSaved = s.savingsGoal.saved - actualDeduct;
        const newDue = Math.max(0, bill.amountDue - actualDeduct);

        const newAlloc: PayerAllocation = {
          id: 'pa_' + Date.now() + '_hs',
          payerType: 'patient_self_pay',
          payerName: 'HealthSave Reserve',
          allocatedAmount: actualDeduct,
          paidAmount: actualDeduct,
          status: 'paid',
          notes: 'Funded from emergency health reserve',
        };

        const newBills = s.bills.map(b => {
          if (b.id !== billId) return b;
          return {
            ...b,
            amountDue: newDue,
            status: newDue === 0 ? 'paid' : 'partly_paid',
            payerAllocations: [...(b.payerAllocations || []), newAlloc],
          };
        });

        const newTxn: WalletTxn = {
          id: 'wt_' + Date.now(),
          personId: s.activePerson,
          label: `HealthSave: ${bill.facility}`,
          amount: actualDeduct,
          date: new Date().toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }),
          sign: -1,
        };

        set({
          bills: newBills,
          savingsGoal: { ...s.savingsGoal, saved: newSaved },
          walletTxns: [newTxn, ...s.walletTxns],
        });
      },

      requestFamilyPay: (billId, sponsorName, amount) => {
        const s = get();
        const bill = s.bills.find(b => b.id === billId);
        if (!bill) return;

        const familyAlloc: PayerAllocation = {
          id: 'pa_' + Date.now() + '_fam',
          payerType: 'family_sponsor',
          payerName: `FamilyPay (${sponsorName})`,
          allocatedAmount: amount,
          paidAmount: 0,
          status: 'pending',
          notes: `Payment request link sent to ${sponsorName}`,
        };

        const newBills = s.bills.map(b => {
          if (b.id !== billId) return b;
          return {
            ...b,
            payerAllocations: [...(b.payerAllocations || []), familyAlloc],
          };
        });

        set({ bills: newBills });
      },

      applyEmployerBenefit: (billId, employerName, amount) => {
        const s = get();
        const bill = s.bills.find(b => b.id === billId);
        if (!bill) return;

        const actualCover = Math.min(amount, bill.amountDue);
        const empAlloc: PayerAllocation = {
          id: 'pa_' + Date.now() + '_emp',
          payerType: 'employer',
          payerName: `Employer (${employerName})`,
          allocatedAmount: actualCover,
          paidAmount: actualCover,
          status: 'paid',
          approvalCode: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          notes: 'Corporate healthcare benefit subsidy applied',
        };

        const newDue = Math.max(0, bill.amountDue - actualCover);
        const newBills = s.bills.map(b => {
          if (b.id !== billId) return b;
          return {
            ...b,
            amountDue: newDue,
            status: newDue === 0 ? 'paid' : 'partly_paid',
            payerAllocations: [...(b.payerAllocations || []), empAlloc],
          };
        });

        set({ bills: newBills });
      },

      recordHmoRemittance: (billId, receivedAmount) => {
        const s = get();
        const newBills = s.bills.map(b => {
          if (b.id !== billId) return b;
          const expected = b.hmoAmount || 0;
          const variance = expected - receivedAmount;
          return {
            ...b,
            reconciliation: {
              expectedHmo: expected,
              receivedHmo: receivedAmount,
              variance,
              status: variance > 0 ? 'underpaid' as const : 'reconciled' as const,
            },
          };
        });

        set({ bills: newBills });
      },

      setActiveEpisode: (episodeId) => set({ activeEpisodeId: episodeId }),

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
        episodes: state.episodes,
        activeEpisodeId: state.activeEpisodeId,
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
