import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

import { RoleSelectionScreen, LoginScreen, SignupScreen, ForgotPasswordScreen, OTPVerificationScreen } from './src/screens/auth';
import { CustomerHomeScreen, ServiceDetailsScreen, ProductDetailsScreen, WalletScreen, ServicesScreen, PaymentScreen, BookingDetailScreen } from './src/screens/customer';
import { SearchScreen } from './src/screens/customer/SearchScreen';
import { CartScreen } from './src/screens/customer/CartScreen';
import { BookingsScreen } from './src/screens/customer/BookingsScreen';
import { OrderHistoryScreen } from './src/screens/customer/OrderHistoryScreen';
import { OrderDetailsScreen } from './src/screens/customer/OrderDetailsScreen';
import { ProfileScreen } from './src/screens/customer/ProfileScreen';
import { EditProfileScreen } from './src/screens/customer/EditProfileScreen';
import { AddressesScreen } from './src/screens/customer/AddressesScreen';
import { AddEditAddressScreen } from './src/screens/customer/AddEditAddressScreen';
import { PaymentMethodsScreen } from './src/screens/customer/PaymentMethodsScreen';
import { NotificationsScreen } from './src/screens/customer/NotificationsScreen';
import { HelpFAQScreen } from './src/screens/customer/HelpFAQScreen';
import { ContactUsScreen } from './src/screens/customer/ContactUsScreen';
import { TermsScreen } from './src/screens/customer/TermsScreen';
import { PrivacyScreen } from './src/screens/customer/PrivacyScreen';

import { StoreHomeScreen, StoreBrandsScreen, ProductListingScreen } from './src/screens/store';
import {
    TechnicianActiveJobScreen,
    TechnicianEarnScreen,
    TechnicianEntryScreen,
    TechnicianHistoryScreen,
    TechnicianJobsScreen,
    TechnicianKycPendingScreen,
    TechnicianKycUploadScreen,
    TechnicianProfileScreen,
    CampaignMilestonesScreen,
    BookingUpdateScreen,
} from './src/screens/technician';
import {
    DealerEntryScreen,
    DealerKycPendingScreen,
    DealerKycUploadScreen,
    DealerOrdersScreen,
    DealerPricingScreen,
    DealerProfileScreen,
} from './src/screens/dealer';

import { useAuthStore, useLocationStore } from './src/store';

import { RootStackParamList } from './src/models/types';
import { colors } from './src/theme/theme';
import { customerColors } from './src/theme/customerTheme';
import { technicianTheme } from './src/theme/technicianTheme';
import { dealerTheme } from './src/theme/dealerTheme';
import api from './src/services/api';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator();

type AppErrorBoundaryState = {
    hasError: boolean;
};

type ExpoNotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<ExpoNotificationsModule> | null = null;

const loadNotificationsModule = (): Promise<ExpoNotificationsModule> => {
    notificationsModulePromise ??= import('expo-notifications');
    return notificationsModulePromise;
};

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
    state: AppErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): AppErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[AppErrorBoundary] Unhandled render error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Something went wrong</Text>
                    <Text style={styles.errorSubtitle}>Please restart the app.</Text>
                    <TouchableOpacity
                        style={styles.errorRetry}
                        onPress={() => this.setState({ hasError: false })}
                    >
                        <Text style={styles.errorRetryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

function StoreStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="StoreHome" component={StoreHomeScreen} />
            <Stack.Screen name="StoreBrands" component={StoreBrandsScreen} />
            <Stack.Screen name="ProductListing" component={ProductListingScreen} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
        </Stack.Navigator>
    );
}

function CustomerTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Services') {
                        iconName = focused ? 'construct' : 'construct-outline';
                    } else if (route.name === 'Bookings') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Store') {
                        iconName = focused ? 'storefront' : 'storefront-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
                headerShown: false,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                tabBarStyle: {
                    backgroundColor: customerColors.primary,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 62,
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: customerColors.primary,
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                },
            })}
        >
            <Tab.Screen name="Home" component={CustomerHomeScreen} />
            <Tab.Screen name="Services" component={ServicesScreen} />
            <Tab.Screen
                name="Wallet"
                component={WalletScreen}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ color }) => (
                        <View
                            style={{
                                top: -20,
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: '#FFFFFF',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                        >
                            <Ionicons name="wallet" size={28} color={customerColors.primary} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen name="Store" component={StoreStack} />
            <Tab.Screen name="Bookings" component={BookingsScreen} />
        </Tab.Navigator>
    );
}

function TechnicianTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: technicianTheme.colors.agentPrimary,
                tabBarInactiveTintColor: '#8F9DAC',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                },
                tabBarStyle: {
                    backgroundColor: technicianTheme.colors.agentDark,
                    height: 64,
                    borderTopWidth: 0,
                    paddingTop: 6,
                },
                tabBarIcon: ({ color, size, focused }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'briefcase-outline';

                    if (route.name === 'TechnicianJobs') {
                        iconName = focused ? 'briefcase' : 'briefcase-outline';
                    } else if (route.name === 'TechnicianActiveJob') {
                        iconName = focused ? 'flash' : 'flash-outline';
                    } else if (route.name === 'TechnicianStore') {
                        iconName = focused ? 'storefront' : 'storefront-outline';
                    } else if (route.name === 'TechnicianEarn') {
                        iconName = focused ? 'cash' : 'cash-outline';
                    } else if (route.name === 'TechnicianHistory') {
                        iconName = focused ? 'time' : 'time-outline';
                    } else if (route.name === 'TechnicianProfile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="TechnicianJobs" component={TechnicianJobsScreen} options={{ title: 'Jobs' }} />
            <Tab.Screen name="TechnicianActiveJob" component={TechnicianActiveJobScreen} options={{ title: 'Active Job' }} />
            <Tab.Screen name="TechnicianStore" component={StoreStack} options={{ title: 'Store' }} />
            <Tab.Screen name="TechnicianEarn" component={TechnicianEarnScreen} options={{ title: 'Earn' }} />
            <Tab.Screen name="TechnicianHistory" component={TechnicianHistoryScreen} options={{ title: 'History' }} />
            <Tab.Screen name="TechnicianProfile" component={TechnicianProfileScreen} options={{ title: 'Profile' }} />
        </Tab.Navigator>
    );
}

function DealerTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: dealerTheme.colors.dealerPrimary,
                tabBarInactiveTintColor: dealerTheme.colors.dealerMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                },
                tabBarStyle: {
                    backgroundColor: dealerTheme.colors.dealerSurface,
                    height: 64,
                    borderTopWidth: 1,
                    borderTopColor: dealerTheme.colors.border,
                    paddingTop: 6,
                },
                tabBarIcon: ({ color, size, focused }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'pricetag-outline';

                    if (route.name === 'DealerPricing') {
                        iconName = focused ? 'pricetag' : 'pricetag-outline';
                    } else if (route.name === 'DealerOrders') {
                        iconName = focused ? 'receipt' : 'receipt-outline';
                    } else if (route.name === 'DealerProfile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="DealerPricing" component={DealerPricingScreen} options={{ title: 'Pricing' }} />
            <Tab.Screen name="DealerOrders" component={DealerOrdersScreen} options={{ title: 'Orders' }} />
            <Tab.Screen name="DealerProfile" component={DealerProfileScreen} options={{ title: 'Profile' }} />
        </Tab.Navigator>
    );
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        </Stack.Navigator>
    );
}

function CustomerStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Addresses" component={AddressesScreen} />
            <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="HelpFAQ" component={HelpFAQScreen} />
            <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        </Stack.Navigator>
    );
}

function TechnicianGateStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TechnicianEntry" component={TechnicianEntryScreen} />
            <Stack.Screen name="TechnicianKycUpload" component={TechnicianKycUploadScreen} />
            <Stack.Screen name="TechnicianKycPending" component={TechnicianKycPendingScreen} />
            <Stack.Screen name="TechnicianTabs" component={TechnicianTabs} />
            <Stack.Screen name="TechnicianCampaignMilestones" component={CampaignMilestonesScreen} />
            {/* Store flow — reusing customer screen components */}
            <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
            <Stack.Screen name="Addresses" component={AddressesScreen} />
            <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
        </Stack.Navigator>
    );
}

function DealerGateStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DealerEntry" component={DealerEntryScreen} />
            <Stack.Screen name="DealerKycUpload" component={DealerKycUploadScreen} />
            <Stack.Screen name="DealerKycPending" component={DealerKycPendingScreen} />
            <Stack.Screen name="DealerTabs" component={DealerTabs} />
        </Stack.Navigator>
    );
}

export default function App() {
    const { isAuthenticated, user, checkAuth } = useAuthStore();
    const { fetchAndSet: fetchLocation, loadCached: loadCachedLocation } = useLocationStore();
    const [isReady, setIsReady] = React.useState(false);

    React.useEffect(() => {
        if (Platform.OS === 'web') {
            return;
        }

        let active = true;

        const configureNotifications = async () => {
            const Notifications = await loadNotificationsModule();
            if (!active) {
                return;
            }

            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowBanner: true,
                    shouldShowList: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                }),
            });
        };

        void configureNotifications();

        return () => {
            active = false;
        };
    }, []);

    React.useEffect(() => {
        const init = async () => {
            try {
                await checkAuth();
            } catch (error) {
                console.log('Auth check error:', error);
            } finally {
                setIsReady(true);
            }
        };
        init();
    }, [checkAuth]);

    React.useEffect(() => {
        if (!isAuthenticated || Platform.OS === 'web') {
            return;
        }

        let cancelled = false;

        const registerPushToken = async () => {
            try {
                const Notifications = await loadNotificationsModule();

                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('default', {
                        name: 'default',
                        importance: Notifications.AndroidImportance.DEFAULT,
                    });
                }

                const permissions = await Notifications.getPermissionsAsync();
                let finalStatus = permissions.status;

                if (finalStatus !== 'granted') {
                    const requested = await Notifications.requestPermissionsAsync();
                    finalStatus = requested.status;
                }

                if (finalStatus !== 'granted') {
                    return;
                }

                const projectId =
                    Constants.easConfig?.projectId ??
                    Constants.expoConfig?.extra?.eas?.projectId;

                const tokenResponse = projectId
                    ? await Notifications.getExpoPushTokenAsync({ projectId })
                    : await Notifications.getExpoPushTokenAsync();

                if (cancelled) {
                    return;
                }

                await api.post('/user/push-token', {
                    token: tokenResponse.data,
                    platform: Platform.OS,
                });
            } catch (error) {
                console.warn('[Push] Registration skipped:', error);
            }
        };

        void registerPushToken();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?.id]);

    // Request location permission and fetch area name when user logs in
    React.useEffect(() => {
        if (!isAuthenticated || Platform.OS === 'web') {
            return;
        }

        const initLocation = async () => {
            try {
                // Restore last known area instantly from cache
                await loadCachedLocation();

                // Check current permission status
                const { status: existing } = await Location.getForegroundPermissionsAsync();

                if (existing === 'granted') {
                    // Already granted — just fetch fresh location
                    void fetchLocation();
                    return;
                }

                // Not yet granted — ask the OS for permission
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    void fetchLocation();
                }
            } catch {
                // ignore — header falls back to "Select Location"
            }
        };

        void initLocation();
    }, [isAuthenticated, user?.id]);

    if (!isReady) {
        return null;
    }

    const renderStack = () => {
        if (!isAuthenticated) {
            return <AuthStack />;
        }

        if (user?.role === 'technician') {
            return <TechnicianGateStack />;
        }

        if (user?.role === 'dealer') {
            return <DealerGateStack />;
        }

        if (user?.role === 'customer') {
            return <CustomerStack />;
        }

        return <AuthStack />;
    };

    const navigatorKey = isAuthenticated ? user?.role || 'auth' : 'auth';

    return (
        <AppErrorBoundary>
            <SafeAreaProvider>
                <NavigationContainer key={navigatorKey}>{renderStack()}</NavigationContainer>
            </SafeAreaProvider>
        </AppErrorBoundary>
    );
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#FFFFFF',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    errorRetry: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 32,
        backgroundColor: '#00C2B3',
        borderRadius: 8,
    },
    errorRetryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
