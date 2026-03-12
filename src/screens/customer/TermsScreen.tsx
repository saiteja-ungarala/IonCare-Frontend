// Terms & Conditions Screen

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export const TermsScreen: React.FC<Props> = ({ navigation }) => (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
        </View>
        <ScrollView style={styles.scroll}>
            <Text style={styles.updated}>Last updated: February 2026</Text>
            {SECTIONS.map((s, i) => (
                <View key={i} style={styles.section}>
                    <Text style={styles.sTitle}>{s.title}</Text>
                    <Text style={styles.sBody}>{s.body}</Text>
                </View>
            ))}
        </ScrollView>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, ...shadows.sm },
    backButton: { marginRight: spacing.md },
    headerTitle: { ...typography.h2, fontSize: 20, color: colors.text },
    scroll: { flex: 1, padding: spacing.md },
    updated: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg },
    section: { marginBottom: spacing.lg },
    sTitle: { ...typography.body, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
    sBody: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
});
