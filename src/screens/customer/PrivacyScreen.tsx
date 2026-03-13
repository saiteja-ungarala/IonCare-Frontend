// Privacy Policy Screen

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
    { title: '1. Information We Collect', body: 'We collect personal information you provide during registration (name, email, phone), service usage data, device information, and location data when you use our services.' },
    { title: '2. How We Use Information', body: 'Your information is used to provide and improve our services, process bookings, send notifications, and personalize your experience. We do not sell your personal data.' },
    { title: '3. Data Storage & Security', body: 'Your data is stored securely on encrypted servers. We employ industry-standard security measures including SSL encryption, secure authentication, and regular security audits.' },
    { title: '4. Third-Party Sharing', body: 'We may share limited information with service agents assigned to your bookings, payment processors, and analytics providers. All third parties are bound by strict data protection agreements.' },
    { title: '5. Your Rights', body: 'You have the right to access, correct, or delete your personal data. You can update your profile information from the app or contact our support team for data deletion requests.' },
    { title: '6. Cookies & Analytics', body: 'We use analytics tools to understand service usage patterns and improve the app experience. You can manage your notification and communication preferences in the app settings.' },
    { title: '7. Changes to Policy', body: 'We may update this privacy policy periodically. We will notify you of significant changes through the app or via email.' },
];

export const PrivacyScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[customerColors.primary, customerColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                <Ionicons name="shield-checkmark" size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
