// Help & FAQ Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    const [expanded, setExpanded] = useState<number | null>(null);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & FAQ</Text>
            </View>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, ...shadows.sm },
    backButton: { marginRight: spacing.md },
    headerTitle: { ...typography.h2, fontSize: 20, color: colors.text },
    scroll: { flex: 1, padding: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
    qRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    q: { ...typography.body, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
    a: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
});
