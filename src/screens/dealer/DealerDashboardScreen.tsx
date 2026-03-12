// Dealer Dashboard Screen

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { useAuthStore } from '../../store';
import { mockOrders, mockCommissions } from '../../services/mockData';
import { SafeAreaView } from 'react-native-safe-area-context';

type DealerDashboardScreenProps = { navigation: NativeStackNavigationProp<any> };

export const DealerDashboardScreen: React.FC<DealerDashboardScreenProps> = ({ navigation }) => {
    const { user, logout } = useAuthStore();
    const handleLogout = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Are you sure you want to logout?');
            if (confirmed) {
                logout();
            }
        } else {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
            ]);
        }
    };
    const totalCommission = mockCommissions.reduce((sum, c) => sum + c.amount, 0);
    const pendingOrders = mockOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View><Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Dealer'}!</Text><Text style={styles.subGreeting}>Dealer Dashboard</Text></View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.notifButton}><Ionicons name="notifications-outline" size={24} color={colors.textOnPrimary} /></TouchableOpacity>
                            <TouchableOpacity onPress={handleLogout} style={styles.notifButton}>
                                <Ionicons name="log-out-outline" size={24} color={colors.textOnPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="cart" size={28} color={colors.primary} />
                        <Text style={styles.statValue}>{mockOrders.length}</Text>
                        <Text style={styles.statLabel}>Total Orders</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="time" size={28} color={colors.warning} />
                        <Text style={styles.statValue}>{pendingOrders}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="cash" size={28} color={colors.success} />
                        <Text style={styles.statValue}>₹{totalCommission}</Text>
                        <Text style={styles.statLabel}>Commission</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="people" size={28} color={colors.accent} />
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>Referrals</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Orders</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ProductOrders')}><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
                    </View>
                    {mockOrders.slice(0, 3).map((order) => (
                        <View key={order.id} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderId}>#{order.id}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: order.status === 'delivered' ? colors.success + '20' : colors.warning + '20' }]}>
                                    <Text style={[styles.statusText, { color: order.status === 'delivered' ? colors.success : colors.warning }]}>{order.status}</Text>
                                </View>
                            </View>
                            <Text style={styles.orderItems}>{order.items.length} item(s)</Text>
                            <View style={styles.orderFooter}>
                                <Text style={styles.orderAmount}>₹{order.totalAmount.toLocaleString()}</Text>
                                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                            </View>
                        </View>
                    ))}

                    <View style={styles.menuSection}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Commission')}>
                            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
                            <Text style={styles.menuText}>Commission & Earnings</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem}>
                            <Ionicons name="cube-outline" size={24} color={colors.primary} />
                            <Text style={styles.menuText}>Inventory</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem}>
                            <Ionicons name="map-outline" size={24} color={colors.primary} />
                            <Text style={styles.menuText}>Service Area</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.md, backgroundColor: colors.primary },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerActions: { flexDirection: 'row', gap: spacing.sm },
    greeting: { ...typography.h2, color: colors.textOnPrimary },
    subGreeting: { ...typography.body, color: colors.textOnPrimary },
    notifButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, marginTop: -spacing.lg },
    statCard: { width: '48%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm, marginRight: '2%', ...shadows.sm },
    statValue: { ...typography.h2, color: colors.text, fontWeight: '700', marginTop: spacing.sm },
    statLabel: { ...typography.caption, color: colors.textSecondary },
    content: { padding: spacing.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    sectionTitle: { ...typography.h2, fontSize: 18, color: colors.text },
    viewAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
    orderCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderId: { ...typography.body, fontWeight: '600', color: colors.text },
    statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
    statusText: { ...typography.caption, fontWeight: '600' },
    orderItems: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    orderAmount: { ...typography.body, fontWeight: '700', color: colors.primary },
    orderDate: { ...typography.caption, color: colors.textSecondary },
    menuSection: { marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.sm },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    menuText: { ...typography.body, color: colors.text, flex: 1, marginLeft: spacing.md },
});
