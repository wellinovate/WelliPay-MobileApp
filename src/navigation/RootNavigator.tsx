import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, radius, spacing } from '../theme/tokens';
import { useStore } from '../state/store';
import { COPY } from '../state/copy';
import { RootStackParamList, MainTabParamList } from './types';

// Auth Screens
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import PhoneScreen from '../screens/Auth/PhoneScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import AppLockScreen from '../screens/Auth/AppLockScreen';
import LinkWRScreen from '../screens/Auth/LinkWRScreen';
import WalletIntroScreen from '../screens/Auth/WalletIntroScreen';

// Tab Screens
import HomeScreen from '../screens/Home/HomeScreen';
import BillsScreen from '../screens/Bills/BillsScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import InsightsScreen from '../screens/Insights/InsightsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

// Stack Screens
import NotificationsScreen from '../screens/Home/NotificationsScreen';
import BillDetailScreen from '../screens/Bills/BillDetailScreen';
import AddBillScreen from '../screens/Bills/AddBillScreen';
import AmountScreen from '../screens/Payment/AmountScreen';
import MethodScreen from '../screens/Payment/MethodScreen';
import ConfirmScreen from '../screens/Payment/ConfirmScreen';
import CardPayScreen from '../screens/Payment/CardPayScreen';
import TransferScreen from '../screens/Payment/TransferScreen';
import StatusScreen from '../screens/Payment/StatusScreen';
import ReceiptScreen from '../screens/Payment/ReceiptScreen';
import HistoryScreen from '../screens/Payment/HistoryScreen';
import ReportScreen from '../screens/Payment/ReportScreen';
import ReportDetailScreen from '../screens/Payment/ReportDetailScreen';
import TopUpScreen from '../screens/Wallet/TopUpScreen';
import PeopleScreen from '../screens/People/PeopleScreen';
import AddPersonScreen from '../screens/People/AddPersonScreen';
import SecurityScreen from '../screens/Profile/SecurityScreen';
import PrivacyScreen from '../screens/Profile/PrivacyScreen';
import NotificationPrefsScreen from '../screens/Profile/NotificationPrefsScreen';
import LanguageScreen from '../screens/Profile/LanguageScreen';
import HelpScreen from '../screens/Profile/HelpScreen';
import ContactScreen from '../screens/Profile/ContactScreen';
import LegalScreen from '../screens/Profile/LegalScreen';
import DeleteAccountScreen from '../screens/Profile/DeleteAccountScreen';
// Healthcare Screens
import HmoScreen from '../screens/HMO/HmoScreen';
import AddHmoScreen from '../screens/HMO/AddHmoScreen';
import PreAuthScreen from '../screens/HMO/PreAuthScreen';
import WelliRecordSyncScreen from '../screens/WelliRecord/WelliRecordSyncScreen';
import FacilityDirectoryScreen from '../screens/Facilities/FacilityDirectoryScreen';
import EpisodeTimelineScreen from '../screens/Bills/EpisodeTimelineScreen';
import HmoReconcileScreen from '../screens/HMO/HmoReconcileScreen';
import { FamilyPayHubScreen } from '../screens/FamilyPay/FamilyPayHubScreen';
import { WelliPassScreen } from '../screens/Discharge/WelliPassScreen';
import { HospitalDeskTicketScreen } from '../screens/Discharge/HospitalDeskTicketScreen';
import { RxPharmacyScreen } from '../screens/Pharmacy/RxPharmacyScreen';
import { UssdOfflineScreen } from '../screens/Offline/UssdOfflineScreen';
import { ProviderDeskScreen } from '../screens/Provider/ProviderDeskScreen';
import { HealthSavePotsScreen } from '../screens/Wallet/HealthSavePotsScreen';



const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
    </View>
  );
}

function MainTabNavigator() {
  const lang = useStore(s => s.lang);
  const t = COPY[lang] || COPY.en;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : 8),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t.tabHome || 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="BillsTab"
        component={BillsScreen}
        options={{
          tabBarLabel: t.tabBills || 'Bills',
          tabBarIcon: ({ focused }) => <TabIcon icon="📄" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletScreen}
        options={{
          tabBarLabel: t.tabWallet || 'Wallet',
          tabBarIcon: ({ focused }) => <TabIcon icon="💳" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="InsightsTab"
        component={InsightsScreen}
        options={{
          tabBarLabel: t.tabInsights || 'Insights',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: t.tabProfile || 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      {/* Auth Flow */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="AppLock" component={AppLockScreen} />
      <Stack.Screen name="LinkWR" component={LinkWRScreen} />
      <Stack.Screen name="WalletIntro" component={WalletIntroScreen} />

      {/* Main Tabs */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Home sub-screens */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      {/* Bills sub-screens */}
      <Stack.Screen name="BillDetail" component={BillDetailScreen} />
      <Stack.Screen name="AddBill" component={AddBillScreen} />

      {/* Payment Flow */}
      <Stack.Screen name="Amount" component={AmountScreen} />
      <Stack.Screen name="Method" component={MethodScreen} />
      <Stack.Screen name="Confirm" component={ConfirmScreen} />
      <Stack.Screen name="CardPay" component={CardPayScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="Status" component={StatusScreen} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />

      {/* Wallet Flow */}
      <Stack.Screen name="TopUp" component={TopUpScreen} />

      {/* People Flow */}
      <Stack.Screen name="People" component={PeopleScreen} />
      <Stack.Screen name="AddPerson" component={AddPersonScreen} />
      <Stack.Screen name="AddDep" component={AddPersonScreen} />

      {/* Healthcare & Insurance */}
      <Stack.Screen name="EpisodeTimeline" component={EpisodeTimelineScreen} />
      <Stack.Screen name="HmoReconcile" component={HmoReconcileScreen} />
      <Stack.Screen name="Hmo" component={HmoScreen} />
      <Stack.Screen name="AddHmo" component={AddHmoScreen} />
      <Stack.Screen name="PreAuth" component={PreAuthScreen} />
      <Stack.Screen name="WelliRecordSync" component={WelliRecordSyncScreen} />
      <Stack.Screen name="FacilityDirectory" component={FacilityDirectoryScreen} />

      {/* Advanced Healthcare Ecosystem */}
      <Stack.Screen name="FamilyPayHub" component={FamilyPayHubScreen} />
      <Stack.Screen name="WelliPass" component={WelliPassScreen} />
      <Stack.Screen name="RxPharmacy" component={RxPharmacyScreen} />
      <Stack.Screen name="UssdOffline" component={UssdOfflineScreen} />
      <Stack.Screen name="ProviderDesk" component={ProviderDeskScreen} />
      <Stack.Screen name="HospitalDeskTicket" component={HospitalDeskTicketScreen} />
      <Stack.Screen name="HealthSavePots" component={HealthSavePotsScreen} />

      {/* Profile Flow */}
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="NotificationPrefs" component={NotificationPrefsScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
});
