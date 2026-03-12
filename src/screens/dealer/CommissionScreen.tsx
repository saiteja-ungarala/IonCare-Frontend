// Dealer Commission Screen

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { mockCommissions } from '../../services/mockData';
import { SafeAreaView } from 'react-native-safe-area-context';

type CommissionScreenProps = { navigation: NativeStackNavigationProp<any> };

export const CommissionScreen: React.FC<CommissionScreenProps> = ({ navigation }) => {
    const totalCommission = mockCommissions.reduce((sum, c) => sum + c.amount, 0);
    const pendingAmount = mockCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Commission</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Total Commission Earned</Text>
                    <Text style={styles.balanceAmount}>₹{totalCommission.toLocaleString()}</Text>
                    <View style={styles.balanceRow}>
                        <View style={styles.balanceItem}><Text style={styles.balanceItemLabel}>Pending</Text><Text style={styles.balanceItemValue}>₹{pendingAmount}</Text></View>
                        <View style={styles.balanceDivider} />
                        <View style={styles.balanceItem}><Text style={styles.balanceItemLabel}>Paid</Text><Text style={styles.balanceItemValue}>₹{totalCommission - pendingAmount}</Text></View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    <Text style={styles.sectionTitle}>Commission History</Text>
                    {mockCommissions.map((commission) => (
                        <View key={commission.id} style={styles.commissionItem}>
                            <View style={[styles.commissionIcon, { backgroundColor: commission.type === 'product_sale' ? colors.primary + '20' : colors.secondary + '20' }]}>
                                <Ionicons name={commission.type === 'product_sale' ? 'cart' : 'people'} size={20} color={commission.type === 'product_sale' ? colors.primary : colors.secondary} />
                            </View>
                            <View style={styles.commissionInfo}>
                                <Text style={styles.commissionType}>{commission.type === 'product_sale' ? 'Product Sale' : 'Service Referral'}</Text>
                                <Text style={styles.commissionOrder}>Order #{commission.orderId}</Text>
                                <Text style={styles.commissionDate}>{commission.date}</Text>
                            </View>
                            <View style={styles.commissionRight}>
                                <Text style={styles.commissionAmount}>+₹{commission.amount}</Text>
                                <View style={[styles.commissionStatus, { backgroundColor: commission.status === 'paid' ? colors.success + '20' : colors.warning + '20' }]}>
                                    <Text style={[styles.commissionStatusText, { color: commission.status === 'paid' ? colors.success : colors.warning }]}>{commission.status}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, ...shadows.sm },
    headerTitle: { ...typography.h3, color: colors.text },
    balanceCard: { margin: spacing.md, borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: 'center' },
    balanceLabel: { ...typography.body, color: colors.secondaryLight },
    balanceAmount: { ...typography.h1, color: colors.textOnPrimary, fontWeight: '700', fontSize: 36, marginVertical: spacing.sm },
    balanceRow: { flexDirection: 'row', width: '100%', marginTop: spacing.sm },
    balanceItem: { flex: 1, alignItems: 'center' },
    balanceItemLabel: { ...typography.caption, color: colors.secondaryLight },
    balanceItemValue: { ...typography.body, fontWeight: '600', color: colors.textOnPrimary },
    balanceDivider: { width: 1, backgroundColor: colors.glassBorder },
    content: { padding: spacing.md },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    commissionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
    commissionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    commissionInfo: { flex: 1, marginLeft: spacing.md },
    commissionType: { ...typography.body, fontWeight: '600', color: colors.text },
    commissionOrder: { ...typography.bodySmall, color: colors.textSecondary },
    commissionDate: { ...typography.caption, color: colors.textLight },
    commissionRight: { alignItems: 'flex-end' },
    commissionAmount: { ...typography.body, fontWeight: '700', color: colors.success },
    commissionStatus: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginTop: 4 },
    commissionStatusText: { ...typography.caption, fontWeight: '600', textTransform: 'capitalize' },
});
