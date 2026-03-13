// Wallet Screen

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { useWalletStore, useAuthStore, REFERRAL_CONSTANTS } from '../../store';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export const WalletScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const {
        balance,
        transactions,
        isLoading,
        error,
        fetchWallet,
        fetchTransactions,
    } = useWalletStore();
    const user = useAuthStore((state) => state.user);

    useFocusEffect(
        React.useCallback(() => {
            const loadWalletData = async () => {
                await Promise.all([fetchWallet(), fetchTransactions()]);
            };
            loadWalletData();
        }, [fetchWallet, fetchTransactions])
    );

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join AquaCare and get your first service FREE! Use my referral code: ${user?.referralCode || 'AQUA100'}`,
                title: 'Refer & Earn',
            });
        } catch (error) { }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[customerColors.primary, customerColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                <Ionicons name="wallet" size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>My Wallet</Text>
                        <Text style={styles.headerSubtitle}>Balance, Earnings & History</Text>
                    </View>
                </View>
            </LinearGradient>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading wallet...</Text>
                </View>
            ) : (
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {error ? (
                        <View style={styles.errorCard}>
                            <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}
                    <LinearGradient colors={[customerColors.primary, customerColors.primaryDark]} style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>Available Balance</Text>
                        <Text style={styles.balanceAmount}>₹{balance}</Text>
                        <View style={styles.balanceActions}>
                            <TouchableOpacity style={styles.balanceAction}>
                                <Ionicons name="add-circle-outline" size={20} color={colors.textOnPrimary} />
                                <Text style={styles.balanceActionText}>Add Money</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.balanceAction}>
                                <Ionicons name="arrow-down-circle-outline" size={20} color={colors.textOnPrimary} />
                                <Text style={styles.balanceActionText}>Withdraw</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <LinearGradient
                        colors={[customerColors.primary, customerColors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.referralCard}
                    >
                        <View style={styles.referralHeader}>
                            <Ionicons name="gift" size={32} color={colors.textOnPrimary} />
                            <View style={styles.referralContent}>
                                <Text style={styles.referralTitle}>Refer & Earn</Text>
                                <Text style={styles.referralDesc}>Get ₹{REFERRAL_CONSTANTS.REFERRER_JOINING_BONUS} for each friend who joins</Text>
                            </View>
                        </View>
                        <View style={styles.referralCodeBox}>
                            <Text style={styles.referralCodeLabel}>Your Referral Code</Text>
                            <Text style={styles.referralCode}>{user?.referralCode || 'AQUA100'}</Text>
                        </View>
                        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                            <Ionicons name="share-social" size={20} color={customerColors.primary} />
                            <Text style={styles.shareButtonText}>Share with Friends</Text>
                        </TouchableOpacity>
                    </LinearGradient>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Transaction History</Text>
                        {transactions.length === 0 ? (
                            <Text style={styles.emptyText}>No transactions yet</Text>
                        ) : (
                            transactions.map((txn) => (
                                <View key={txn.id} style={styles.txnItem}>
                                    <View style={[styles.txnIcon, { backgroundColor: txn.type === 'credit' ? colors.success + '20' : colors.error + '20' }]}>
                                        <Ionicons name={txn.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={20} color={txn.type === 'credit' ? colors.success : colors.error} />
                                    </View>
                                    <View style={styles.txnContent}>
                                        <Text style={styles.txnDesc}>{txn.description}</Text>
                                        <Text style={styles.txnDate}>{txn.date}</Text>
                                    </View>
                                    <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? colors.success : colors.error }]}>
                                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxxl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
        position: 'relative',
    },
    headerIconBg: {
        position: 'absolute',
        right: -20,
        bottom: -20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 32,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
        marginLeft: -spacing.sm,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        ...typography.headerTitle,
        color: colors.textOnPrimary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 2,
    },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
    scrollView: { flex: 1, padding: spacing.md },
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.error + '12',
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    errorText: { ...typography.caption, color: colors.error, flex: 1 },
    balanceCard: { borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md },
    balanceLabel: { ...typography.body, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    balanceAmount: { ...typography.h1, color: '#E0F7FA', fontWeight: '800', marginVertical: spacing.sm },
    balanceActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
    balanceAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    balanceActionText: { ...typography.bodySmall, color: colors.textOnPrimary, fontWeight: '600' },
    referralCard: { borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
    referralHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    referralContent: { flex: 1 },
    referralTitle: { ...typography.body, fontWeight: '700', color: colors.textOnPrimary },
    referralDesc: { ...typography.caption, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    referralCodeBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
    referralCodeLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
    referralCode: { ...typography.h2, color: colors.textOnPrimary, fontWeight: '800', letterSpacing: 2 },
    shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: borderRadius.md, padding: spacing.md, gap: spacing.sm },
    shareButtonText: { ...typography.body, fontWeight: '700', color: customerColors.primary },
    section: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    txnItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
    txnIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    txnContent: { flex: 1, marginLeft: spacing.md },
    txnDesc: { ...typography.bodySmall, color: colors.text },
    txnDate: { ...typography.caption, color: colors.textSecondary },
    txnAmount: { ...typography.body, fontWeight: '700' },
});
