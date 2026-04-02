import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = { navigation: NativeStackNavigationProp<any> };

export const PaymentMethodsScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Methods</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="wallet-outline" size={56} color={customerColors.primary} />
                    </View>
                    <Text style={styles.title}>How you can pay</Text>
                    <Text style={styles.subtitle}>
                        Payments are currently Cash on Delivery only. Online payments are coming soon.
                    </Text>
                </View>

                <View style={styles.card}>
                    {/* Cash on Delivery — available */}
                    <View style={styles.row}>
                        <View style={[styles.rowIcon, { backgroundColor: '#DCFCE7' }]}>
                            <Ionicons name="cash-outline" size={22} color="#16A34A" />
                        </View>
                        <View style={styles.rowContent}>
                            <View style={styles.rowTitleRow}>
                                <Text style={styles.rowTitle}>Cash on Delivery</Text>
                                <View style={styles.availBadge}>
                                    <Text style={styles.availText}>Available</Text>
                                </View>
                            </View>
                            <Text style={styles.rowSubtitle}>
                                Pay in cash when your order or service is delivered.
                            </Text>
                        </View>
                    </View>

                    {/* Wallet — available */}
                    <View style={styles.row}>
                        <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="wallet-outline" size={22} color={customerColors.primary} />
                        </View>
                        <View style={styles.rowContent}>
                            <View style={styles.rowTitleRow}>
                                <Text style={styles.rowTitle}>Wallet Credits</Text>
                                <View style={styles.soonBadge}>
                                    <Text style={styles.soonText}>Credits only</Text>
                                </View>
                            </View>
                            <Text style={styles.rowSubtitle}>
                                Your account may show referral or refund credits, but new checkout is currently COD only.
                            </Text>
                        </View>
                    </View>

                    {/* Online payments — coming soon */}
                    <View style={[styles.row, styles.rowLast, styles.rowMuted]}>
                        <View style={[styles.rowIcon, { backgroundColor: '#F3F4F6' }]}>
                            <Ionicons name="card-outline" size={22} color="#9CA3AF" />
                        </View>
                        <View style={styles.rowContent}>
                            <View style={styles.rowTitleRow}>
                                <Text style={[styles.rowTitle, styles.rowTitleMuted]}>Online Payments</Text>
                                <View style={styles.soonBadge}>
                                    <Text style={styles.soonText}>Coming soon</Text>
                                </View>
                            </View>
                            <Text style={styles.rowSubtitle}>
                                UPI, Cards, Net Banking — launching shortly.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        ...shadows.sm,
    },
    backButton: {
        width: 32,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -spacing.sm,
        marginRight: spacing.xs,
    },
    headerTitle: { ...typography.h2, fontSize: 20, color: colors.text },
    content: { padding: spacing.lg },
    hero: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    iconWrap: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.md,
    },
    rowLast: { borderBottomWidth: 0 },
    rowMuted: { opacity: 0.7 },
    rowIcon: {
        width: 44,
        height: 44,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    rowContent: { flex: 1 },
    rowTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: 2,
    },
    rowTitle: {
        ...typography.body,
        color: colors.text,
        fontWeight: '700',
    },
    rowTitleMuted: { color: '#9CA3AF' },
    rowSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    availBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 20,
        backgroundColor: '#DCFCE7',
    },
    availText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16A34A',
    },
    soonBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    soonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
    },
});
