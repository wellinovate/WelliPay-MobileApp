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
  FAMILY_PAY_SEED, WELLIPASS_SEED, RX_ORDERS_SEED,
  USSD_BANKS_SEED, OFFLINE_VOUCHERS_SEED, PROVIDER_DESK_SEED,
  HEALTHSAVE_POTS_SEED,
  FamilyPayRequest, FamilyContributor, WelliPassClearance,
  RxPrescriptionOrder, RxPrescriptionItem, UssdBankMapping,
  OfflineVoucher, ProviderBillingDesk, ProviderQueueItem,
  HealthSavePot, HealthSavePotTxn,
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


  // -- FamilyPay, WelliPass, Rx & Ecosystem
  familyPayLinks: FamilyPayRequest[];
  welliPasses: WelliPassClearance[];
  rxOrders: RxPrescriptionOrder[];
  ussdBanks: UssdBankMapping[];
  offlineVouchers: OfflineVoucher[];
  providerDesk: ProviderBillingDesk;
  healthSavePots: HealthSavePot[];
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
  createFamilyPayLink: (billId: string, poolTargetNgn?: number) => FamilyPayRequest;
  contributeToFamilyPool: (linkId: string, contributor: Omit<FamilyContributor, 'id' | 'date'>) => void;
  requestWelliPass: (billId: string, ward: string) => WelliPassClearance;
  updateWelliPassStep: (passId: string, step: 'doctor' | 'pharmacy' | 'hmo' | 'psp', officerName: string) => void;
  toggleRxItemOption: (orderId: string, itemId: string) => void;
  generateOfflineVoucher: (billId: string, amount: number) => OfflineVoucher;
  generateProviderBill: (patientName: string, service: string, amount: number, hmoName?: string) => string;
  providerAdjudicateQueueItem: (itemId: string, hmoApproved: number) => void;
  addHealthSavePot: (pot: Omit<HealthSavePot, 'id' | 'currentAmount' | 'history'>) => void;
  depositToHealthSavePot: (potId: string, amount: number, note?: string) => void;
  togglePotRoundUp: (potId: string) => void;
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
  familyPayLinks: FAMILY_PAY_SEED.map(f => ({ ...f, contributors: f.contributors.map(c => ({ ...c })) })),
  welliPasses: WELLIPASS_SEED.map(w => ({ ...w })),
  rxOrders: RX_ORDERS_SEED.map(r => ({ ...r, items: r.items.map(it => ({ ...it })) })),
  ussdBanks: [...USSD_BANKS_SEED],
  offlineVouchers: [...OFFLINE_VOUCHERS_SEED],
  providerDesk: {
    ...PROVIDER_DESK_SEED,
    liveQueue: PROVIDER_DESK_SEED.liveQueue.map(q => ({ ...q })),
    generatedBillCodes: PROVIDER_DESK_SEED.generatedBillCodes.map(g => ({ ...g })),
  },
  healthSavePots: HEALTHSAVE_POTS_SEED.map(p => ({ ...p, history: p.history.map(h => ({ ...h })) })),


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


      createFamilyPayLink: (billId, poolTargetNgn) => {
        const s = get();
        const bill = s.bills.find(b => b.id === billId) || s.bills[0];
        const target = poolTargetNgn || (bill ? (bill.patientSelfPay || bill.amountTotal) : 50000);
        const codeNum = Math.floor(100 + Math.random() * 900);
        const shortCode = `WLI-FAM-${codeNum}`;
        const patientName = s.people.find(p => p.id === (bill?.personId || 'self'))?.name || 'Amina Bello';
        const serviceDesc = bill?.lines[0]?.name || 'Hospital Treatment';
        const newLink: FamilyPayRequest = {
          id: `fp_${Date.now()}`,
          billId: bill ? bill.id : 'b1',
          patientName,
          hospitalName: bill ? bill.facility : 'Redeemer Specialist Clinic',
          serviceDescription: serviceDesc,
          totalAmountNgn: bill ? (bill.patientSelfPay || bill.amountTotal) : target,
          webLinkUrl: `https://wellipay.ng/pay/${bill ? bill.billNo : 'BL-9482'}?sponsor=fam`,
          shortCode,
          currencyRates: { USD: 1550, GBP: 2000, EUR: 1700, CAD: 1150 },
          poolTargetNgn: target,
          poolCollectedNgn: 0,
          contributors: [],
          status: 'active',
        };
        set({ familyPayLinks: [newLink, ...s.familyPayLinks] });
        return newLink;
      },

      contributeToFamilyPool: (linkId, contributor) => {
        const s = get();
        const updated = s.familyPayLinks.map(link => {
          if (link.id !== linkId) return link;
          const newCol = link.poolCollectedNgn + contributor.amountNgn;
          const newContrib: FamilyContributor = {
            ...contributor,
            id: `c_${Date.now()}`,
            date: 'Just now',
          };
          const isFunded = newCol >= link.poolTargetNgn;
          return {
            ...link,
            poolCollectedNgn: newCol,
            status: (isFunded ? 'funded' : 'active') as 'active' | 'funded' | 'expired',
            contributors: [newContrib, ...link.contributors],
          };
        });

        // Also update linked bill if found
        const targetLink = s.familyPayLinks.find(l => l.id === linkId);
        let updatedBills = s.bills;
        if (targetLink) {
          updatedBills = s.bills.map(b => {
            if (b.id !== targetLink.billId) return b;
            const existingAllocs = b.payerAllocations || [];
            const allocId = `alloc_fam_${Date.now()}`;
            const famAlloc: PayerAllocation = {
              id: allocId,
              payerType: 'family_sponsor',
              payerName: `FamilyPay (${contributor.name})`,
              allocatedAmount: contributor.amountNgn,
              paidAmount: contributor.amountNgn,
              status: 'paid',
              notes: contributor.message || 'Family Diaspora Contribution',
            };
            const newDue = Math.max(0, b.amountDue - contributor.amountNgn);
            const newStatus = newDue <= 0 ? 'paid' : 'partly_paid';
            return {
              ...b,
              amountDue: newDue,
              status: newStatus,
              payerAllocations: [...existingAllocs, famAlloc],
            };
          });
        }

        set({ familyPayLinks: updated, bills: updatedBills });
      },

      requestWelliPass: (billId, ward) => {
        const s = get();
        const bill = s.bills.find(b => b.id === billId) || s.bills[0];
        const patientName = s.people.find(p => p.id === (bill?.personId || 'self'))?.name || 'Amina Bello';
        const pspAmount = bill ? (bill.patientSelfPay || bill.amountTotal) : 10000;
        const isPspCleared = bill ? bill.amountDue <= 0 : true;

        const newPass: WelliPassClearance = {
          id: `wp_${Date.now()}`,
          billId: bill ? bill.id : 'b1',
          episodeId: bill?.episodeId,
          patientName,
          hospitalName: bill ? bill.facility : 'Redeemer Specialist Clinic',
          ward: ward || 'General Ward 2, Bed 8',
          admissionDate: '22 Sep 2026',
          dischargeDate: '24 Sep 2026',
          doctorSignOff: {
            cleared: true,
            officerName: 'Dr. O. Alabi (Surgeon)',
            timestamp: 'Today, 9:00 am',
            notes: 'Patient clinically stable for home convalescence.',
          },
          pharmacyClearance: {
            cleared: true,
            officerName: 'Pharm. K. Danladi',
            timestamp: 'Today, 9:30 am',
            returnsReconciled: true,
            notes: 'All medications dispensed.',
          },
          hmoRemittance: {
            cleared: true,
            officerName: 'HMO Desk Officer S. Eze',
            timestamp: 'Today, 10:00 am',
            approvedAmount: bill ? (bill.hmoAmount || 30000) : 30000,
          },
          pspReconciled: {
            cleared: isPspCleared,
            officerName: 'Cashier Desk 1',
            timestamp: 'Today, 10:15 am',
            pspPaid: bill ? (bill.amountTotal - bill.amountDue) : pspAmount,
            balanceDue: bill ? bill.amountDue : 0,
          },
          overallStatus: !isPspCleared ? 'pending' : 'cleared',
          gatePassCode: `WP-PASS-LAG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          clearedAt: isPspCleared ? 'Today, 10:15 am' : undefined,
          securityGuardVerified: false,
        };
        set({ welliPasses: [newPass, ...s.welliPasses] });
        return newPass;
      },

      updateWelliPassStep: (passId, step, officerName) => {
        const s = get();
        const updated = s.welliPasses.map(p => {
          if (p.id !== passId) return p;
          const time = 'Just now';
          const next = { ...p };
          if (step === 'doctor') {
            next.doctorSignOff = { cleared: true, officerName, timestamp: time };
          } else if (step === 'pharmacy') {
            next.pharmacyClearance = { cleared: true, officerName, timestamp: time, returnsReconciled: true };
          } else if (step === 'hmo') {
            next.hmoRemittance = { ...next.hmoRemittance, cleared: true, officerName, timestamp: time };
          } else if (step === 'psp') {
            next.pspReconciled = { ...next.pspReconciled, cleared: true, officerName, timestamp: time, balanceDue: 0 };
          }

          const allClear = next.doctorSignOff.cleared && next.pharmacyClearance.cleared &&
                           next.hmoRemittance.cleared && next.pspReconciled.cleared;
          if (allClear) {
            next.overallStatus = 'cleared';
            next.clearedAt = time;
          }
          return next;
        });
        set({ welliPasses: updated });
      },

      toggleRxItemOption: (orderId, itemId) => {
        const s = get();
        const updated = s.rxOrders.map(order => {
          if (order.id !== orderId) return order;
          const updatedItems = order.items.map(it => {
            if (it.id !== itemId) return it;
            const newOption = it.selectedOption === 'brand' ? 'generic' : 'brand';
            return { ...it, selectedOption: newOption as 'brand' | 'generic' };
          });
          const brandTotal = updatedItems.reduce((acc, it) => acc + it.brandPrice, 0);
          const genericTotal = updatedItems.reduce((acc, it) => acc + (it.selectedOption === 'generic' ? it.genericPrice : it.brandPrice), 0);
          return {
            ...order,
            items: updatedItems,
            totalGenericCost: genericTotal,
            savingsWithGeneric: Math.max(0, brandTotal - genericTotal),
          };
        });
        set({ rxOrders: updated });
      },

      generateOfflineVoucher: (billId, amount) => {
        const s = get();
        const bill = s.bills.find(b => b.id === billId) || s.bills[0];
        const patientName = s.people.find(p => p.id === (bill?.personId || 'self'))?.name || 'Amina Bello';
        const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
        const token = `WP-VOUCH-${hex}-${Math.floor(1000 + Math.random() * 9000)}`;
        const voucher: OfflineVoucher = {
          id: `ov_${Date.now()}`,
          billId: bill ? bill.id : 'b1',
          billCode: bill ? bill.billNo : 'BL-4019',
          patientName,
          hospitalName: bill ? bill.facility : 'Redeemer Specialist Clinic',
          amount: amount || (bill ? bill.amountDue : 10000),
          issuedAt: 'Today, Just now',
          expiresAt: 'Tomorrow, 24 Hours',
          voucherToken: token,
          qrPayload: `WP://OFFLINE/VOUCHER/${bill ? bill.id : 'b1'}/${amount}/${hex}`,
          verifiedOffline: true,
        };
        set({ offlineVouchers: [voucher, ...s.offlineVouchers] });
        return voucher;
      },

      generateProviderBill: (patientName, service, amount, hmoName) => {
        const s = get();
        const code = `BL-${Math.floor(1000 + Math.random() * 9000)}`;
        const newDesk = {
          ...s.providerDesk,
          generatedBillCodes: [
            {
              code,
              patientName,
              amount,
              service,
              createdAt: 'Just now',
              claimed: false,
            },
            ...s.providerDesk.generatedBillCodes,
          ],
          liveQueue: [
            {
              id: `q_${Date.now()}`,
              patientName,
              welliRecordId: `WR-${Math.floor(1000 + Math.random() * 9000)}-LAG`,
              service,
              totalAmount: amount,
              hmoName: hmoName || 'Hygeia HMO',
              hmoApproved: 0,
              pspAmount: amount,
              status: 'awaiting_adjudication' as const,
              createdAt: 'Just now',
            },
            ...s.providerDesk.liveQueue,
          ],
        };
        set({ providerDesk: newDesk });
        return code;
      },

      providerAdjudicateQueueItem: (itemId, hmoApproved) => {
        const s = get();
        const updatedQueue = s.providerDesk.liveQueue.map(item => {
          if (item.id !== itemId) return item;
          const psp = Math.max(0, item.totalAmount - hmoApproved);
          return {
            ...item,
            hmoApproved,
            pspAmount: psp,
            status: (psp === 0 ? 'cleared' : 'awaiting_psp') as any,
          };
        });
        set({
          providerDesk: {
            ...s.providerDesk,
            liveQueue: updatedQueue,
          },
        });
      },

      addHealthSavePot: (pot) => {
        const s = get();
        const newPot: HealthSavePot = {
          ...pot,
          id: `pot_${Date.now()}`,
          currentAmount: 0,
          history: [
            {
              id: `ptx_${Date.now()}`,
              date: 'Today',
              amount: 0,
              type: 'deposit',
              note: 'Pot initialized',
            },
          ],
        };
        set({ healthSavePots: [newPot, ...s.healthSavePots] });
      },

      depositToHealthSavePot: (potId, amount, note) => {
        const s = get();
        const updated = s.healthSavePots.map(pot => {
          if (pot.id !== potId) return pot;
          const newAmount = pot.currentAmount + amount;
          const newTxn: HealthSavePotTxn = {
            id: `ptx_${Date.now()}`,
            date: 'Today',
            amount,
            type: 'deposit',
            note: note || 'Contribution deposit',
          };
          return {
            ...pot,
            currentAmount: newAmount,
            history: [newTxn, ...pot.history],
          };
        });
        set({ healthSavePots: updated });
      },

      togglePotRoundUp: (potId) => {
        const s = get();
        const updated = s.healthSavePots.map(pot =>
          pot.id === potId ? { ...pot, roundUpEnabled: !pot.roundUpEnabled } : pot
        );
        set({ healthSavePots: updated });
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
        familyPayLinks: state.familyPayLinks,
        welliPasses: state.welliPasses,
        rxOrders: state.rxOrders,
        offlineVouchers: state.offlineVouchers,
        providerDesk: state.providerDesk,
        healthSavePots: state.healthSavePots,

      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
