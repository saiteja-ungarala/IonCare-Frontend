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
    { title: '1. Acceptance of Terms', body: 'By accessing or using AquaCare services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the application.' },
    { title: '2. Services', body: 'AquaCare provides water purifier installation, maintenance, and repair services, as well as an e-commerce platform for water care products. Service availability may vary by location.' },
    { title: '3. User Accounts', body: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration and keep it updated.' },
    { title: '4. Bookings & Cancellations', body: 'Bookings are subject to service agent availability. Cancellations made less than 2 hours before the scheduled time may incur a cancellation fee.' },
    { title: '5. Payments & Refunds', body: 'All payments are processed securely. Refunds for cancelled services will be credited to your AquaCare wallet within 3–5 business days.' },
    { title: '6. Limitation of Liability', body: 'AquaCare shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.' },
    { title: '7. Changes to Terms', body: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.' },
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
                        <Text style={styles.headerSubtitle}>Last updated: February 2026</Text>
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
