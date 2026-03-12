// Privacy Policy Screen

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = { navigation: NativeStackNavigationProp<any> };

const SECTIONS = [
    { title: '1. Information We Collect', body: 'We collect personal information you provide during registration (name, email, phone), service usage data, device information, and location data when you use our services.' },
    { title: '2. How We Use Information', body: 'Your information is used to provide and improve our services, process bookings, send notifications, and personalize your experience. We do not sell your personal data.' },
    { title: '3. Data Storage & Security', body: 'Your data is stored securely on encrypted servers. We employ industry-standard security measures including SSL encryption, secure authentication, and regular security audits.' },
    { title: '4. Third-Party Sharing', body: 'We may share limited information with service agents assigned to your bookings, payment processors, and analytics providers. All third parties are bound by strict data protection agreements.' },
    { title: '5. Your Rights', body: 'You have the right to access, correct, or delete your personal data. You can update your profile information from the app or contact our support team for data deletion requests.' },
    { title: '6. Cookies & Analytics', body: 'We use analytics tools to understand service usage patterns and improve the app experience. You can manage your notification and communication preferences in the app settings.' },
    { title: '7. Changes to Policy', body: 'We may update this privacy policy periodically. We will notify you of significant changes through the app or via email.' },
];

export const PrivacyScreen: React.FC<Props> = ({ navigation }) => (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
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
