// Help & FAQ Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { customerColors } from '../../theme/customerTheme';

const FAQ_DATA = [
    {
        q: 'How do I book a service?',
        a: 'Open the app and go to the Services tab. Browse the available service categories, select the service you need, choose a convenient date and time slot, confirm your address, and tap "Book Now". You\'ll receive a confirmation once your booking is placed.',
    },
    {
        q: 'How do I cancel a booking?',
        a: 'Go to the Bookings tab, open the booking you want to cancel, and tap "Cancel Booking" at the bottom. You\'ll be asked to provide a reason. Cancellations are accepted for pending or confirmed bookings before the technician is dispatched.',
    },
    {
        q: 'What payment methods are accepted?',
        a: 'Payments are currently Cash on Delivery (COD) only. If you see referral or refund credits in your wallet, they are account credits, not a live card or UPI checkout option. Online payments via UPI, cards, and net banking are coming soon.',
    },
    {
        q: 'How long does a service typically take?',
        a: 'Most services — such as water purifier servicing or filter replacement — take between 30 and 60 minutes. The exact duration depends on the complexity of the issue and your device model. Your technician will give you an estimate on arrival.',
    },
    {
        q: 'How can I track my technician?',
        a: 'Once a technician is assigned to your booking, their name and contact number appear on the Booking Detail screen. The status updates in real time — you\'ll see when they\'ve been assigned, when they\'re on the way, and when work is in progress.',
    },
    {
        q: 'What is the referral program?',
        a: 'Tap "Refer & Earn" in your Profile to find your unique referral code. Share it with friends or family. When they sign up using your code and complete their first booking, you both receive wallet credits that can be used on your next service.',
    },
    {
        q: 'How do I contact customer support?',
        a: 'Go to Profile > Contact Us. You can call us, send an email, or reach us on WhatsApp. Our support team is available Mon–Sat, 9 AM to 6 PM.',
    },
    {
        q: 'What is the return policy for products ordered through the app?',
        a: 'Products like filters and accessories can be returned within 7 days of delivery if they are unused, in original packaging, and in the same condition as received. Raise a return request through Profile > Orders or contact our support team directly.',
    },
    {
        q: 'How do I change my default address?',
        a: 'Go to Profile > My Addresses. Tap the star or "Set as default" option on the address you want to use. Your default address will be pre-selected when you book a service or place an order.',
    },
    {
        q: 'Is my personal data secure?',
        a: 'We use reasonable safeguards to protect your account and app data. Because payments are currently Cash on Delivery, the app does not currently collect card or UPI payment details for checkout. You can delete your account from within the app from the Profile screen.',
    },
];

type Props = { navigation: NativeStackNavigationProp<any> };

export const HelpFAQScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [expanded, setExpanded] = useState<number | null>(null);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[customerColors.primary, customerColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                <Ionicons name="help-circle" size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Help & FAQ</Text>
                        <Text style={styles.headerSubtitle}>Find answers to common questions</Text>
                    </View>
                </View>
            </LinearGradient>
            <ScrollView style={styles.scroll}>
                {FAQ_DATA.map((item, i) => (
                    <TouchableOpacity key={i} style={styles.card} onPress={() => setExpanded(expanded === i ? null : i)} activeOpacity={0.7}>
                        <View style={styles.qRow}>
                            <Text style={styles.q}>{item.q}</Text>
                            <Ionicons name={expanded === i ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
                        </View>
                        {expanded === i && <Text style={styles.a}>{item.a}</Text>}
                    </TouchableOpacity>
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
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
    qRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    q: { ...typography.body, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
    a: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
});
