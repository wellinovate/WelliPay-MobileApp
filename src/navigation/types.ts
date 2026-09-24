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
