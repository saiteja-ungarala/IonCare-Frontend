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
    { q: 'How do I book a service?', a: 'Go to the Home tab, browse available services, select one, pick a date & time, and confirm your booking.' },
    { q: 'How can I track my booking?', a: 'Navigate to the Bookings tab to see the real-time status of all your service requests.' },
    { q: 'What payment methods are accepted?', a: 'We currently support wallet payments. UPI, cards, and net banking are coming soon.' },
    { q: 'How does Refer & Earn work?', a: 'Share your referral code with friends. When they sign up and complete their first booking, you both earn wallet credits.' },
    { q: 'How do I change my default address?', a: 'Go to Profile → Addresses, then tap the star icon on the address you want to set as default.' },
    { q: 'Can I cancel a booking?', a: 'Yes, you can cancel a pending booking from the Bookings tab. Cancellation policy applies based on timing.' },
    { q: 'How do I contact customer support?', a: 'Go to Profile → Contact Us for phone, email, and WhatsApp support options.' },
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
