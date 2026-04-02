// Terms & Conditions Screen

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { customerColors } from '../../theme/customerTheme';

type Props = { navigation: NativeStackNavigationProp<any> };

const SECTIONS = [
    {
        title: '1. Using the App',
        body: 'By using IONORA CARE, you agree to use the app only for lawful purposes and to provide true, current, and complete information. If you do not agree with these terms, please do not use the app.',
    },
    {
        title: '2. Accounts',
        body: 'You are responsible for keeping your login details safe and for activity under your account. The app currently supports customer, technician, and dealer accounts, and each role must use the app only for its intended purpose.',
    },
    {
        title: '3. Services and Orders',
        body: 'IONORA CARE helps users book water purifier services and place product orders, subject to technician availability, stock availability, service area coverage, and operational limits. Scheduled times are requested slots and may change if availability changes.',
    },
    {
        title: '4. Payments',
        body: 'Payments are currently Cash on Delivery (COD) only. This means payment is collected when the product or service is delivered or completed. Online payments such as UPI, cards, and net banking are coming soon and will be enabled in a future update.',
    },
    {
        title: '5. Cancellations, Wallet Credits, and Refunds',
        body: 'Bookings and orders may be cancelled only through the options allowed in the app. If a refund or promotional credit is approved, it may be added to your IONORA CARE wallet or handled through our support process. Wallet visibility does not mean online payments are currently live.',
    },
    {
        title: '6. Service Limitations',
        body: 'We work to keep the app and services available, but we cannot promise uninterrupted access, exact technician arrival times, or availability in every location. We are not responsible for indirect losses caused by downtime, delays, or events outside our reasonable control.',
    },
    {
        title: '7. Account Closure and Updates',
        body: 'Users can delete their account from within the app. We may also update these Terms when the product changes. Continued use of the app after an update means you accept the revised Terms.',
    },
];

export const TermsScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[customerColors.primary, customerColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                <Ionicons name="document-text" size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Terms & Conditions</Text>
                        <Text style={styles.headerSubtitle}>Last updated: April 2, 2026</Text>
                    </View>
                </View>
            </LinearGradient>
            <ScrollView style={styles.scroll}>
                {SECTIONS.map((s, i) => (
                    <View key={i} style={styles.section}>
                        <Text style={styles.sTitle}>{s.title}</Text>
                        <Text style={styles.sBody}>{s.body}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
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
        ...typography.h2,
        color: colors.textOnPrimary,
        fontWeight: '800',
    },
    headerSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 2,
    },
    scroll: { flex: 1, padding: spacing.md },
    updated: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg },
    section: { marginBottom: spacing.lg },
    sTitle: { ...typography.body, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
    sBody: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
});
