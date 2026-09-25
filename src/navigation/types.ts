import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab: undefined;
  BillsTab: undefined;
  WalletTab: undefined;
  InsightsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  // Auth
  Welcome: undefined;
  Phone: undefined;
  OTP: { phone?: string };
  ProfileSetup: undefined;
  AppLock: undefined;
  LinkWR: undefined;
  WalletIntro: undefined;

  // Tabs
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;

  // Home
  Notifications: undefined;

  // Bills
  BillDetail: { billId?: string } | undefined;
  AddBill: undefined;

  // Payment
  Amount: undefined;
  Method: undefined;
  Confirm: undefined;
  CardPay: undefined;
  Transfer: undefined;
  Status: undefined;
  Receipt: undefined;
  History: undefined;
  Report: undefined;
  ReportDetail: undefined;

  // Wallet
  TopUp: undefined;

  // People
  People: undefined;
  AddPerson: undefined;
  AddDep: undefined;

  // Dual-Payer & Healthcare Episodes
  EpisodeTimeline: { episodeId?: string } | undefined;
  HmoReconcile: { billId?: string } | undefined;

  // Advanced Healthcare Ecosystem
  FamilyPayHub: { billId?: string } | undefined;
  WelliPass: { billId?: string; passId?: string } | undefined;
  RxPharmacy: { orderId?: string } | undefined;
  UssdOffline: { billId?: string } | undefined;
  ProviderDesk: undefined;
  HospitalDeskTicket: { billId?: string; patientName?: string; ward?: string } | undefined;
  HealthSavePots: undefined;
  // Healthcare & Insurance
  Hmo: undefined;
  AddHmo: undefined;
  PreAuth: undefined;
  WelliRecordSync: undefined;
  FacilityDirectory: undefined;

  // Profile & Settings
  Security: undefined;
  Privacy: undefined;
  NotificationPrefs: undefined;
  Language: undefined;
  Help: undefined;
  Contact: undefined;
  Legal: undefined;
  DeleteAccount: undefined;
};
