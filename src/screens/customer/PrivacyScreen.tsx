// Privacy Policy Screen

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { customerColors } from '../../theme/customerTheme';
import { SUPPORT_CONFIG } from '../../config/constants';

type Props = { navigation: NativeStackNavigationProp<any> };

const CONTACT_EMAIL = SUPPORT_CONFIG.email || 'support@ionoracare.com';
const CONTACT_PHONE = SUPPORT_CONFIG.phone || '9381938445';

const SECTIONS = [
    {
        title: '1. Information We Collect',
        body: 'We collect the details you enter when you create or use an account, such as your name, email address, phone number, role, addresses, booking and order details, and support messages. If you sign up as a technician or dealer, we may also collect business or KYC documents that you upload.',
    },
    {
        title: '2. Location, Device, and Notifications',
        body: 'If you allow location access, we use your location to auto-fill addresses, help route services, and find nearby technicians. We may also store device and app details such as push notification tokens so we can send booking, order, and account updates. You can deny location permission and enter your address manually.',
    },
    {
        title: '3. How We Use Your Data',
        body: 'We use your data to create and manage your account, verify signup and login, process bookings and orders, assign technicians, send service updates, respond to support requests, improve app performance, and prevent misuse. We do not sell your personal data.',
    },
    {
        title: '4. When We Share Data',
        body: 'We share only the information needed to run the service, such as giving your name, phone number, address, and booking details to the technician handling your job. We may also share limited data with providers that help us send email, SMS, push notifications, or resolve addresses from location coordinates.',
    },
    {
        title: '5. Account Deletion and Your Choices',
        body: 'Users can delete their account from within the app. When you do this, we disable account access and remove your profile from active use. Some booking, order, refund, fraud-prevention, or compliance records may still be kept where needed for operations or legal reasons. You can also update your profile and addresses from inside the app.',
    },
    {
        title: '6. Security',
        body: 'We use reasonable security measures to protect your account and app data, including authenticated access, restricted server-side processing, and encrypted transmission where supported. No system can promise absolute security, but we work to keep your information protected.',
    },
    {
        title: '7. Contact and Updates',
        body: `If you have questions about privacy or need help, contact us at ${CONTACT_EMAIL} or ${CONTACT_PHONE}. We may update this Privacy Policy from time to time, and the latest version inside the app will apply from the posted update date.`,
    },
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
