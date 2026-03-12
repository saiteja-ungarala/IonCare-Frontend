// Contact Us Screen

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

// Configurable constants
const SUPPORT = {
    phone: '+91-9876543210',
    email: 'support@aquacare.in',
    whatsapp: '919876543210',
};

type Props = { navigation: NativeStackNavigationProp<any> };

const ContactRow = ({ icon, label, value, onPress }: { icon: any; label: string; value: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.iconWrap}>
            <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
);

export const ContactUsScreen: React.FC<Props> = ({ navigation }) => (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contact Us</Text>
        </View>
        <ScrollView style={styles.scroll}>
            <Text style={styles.intro}>We're here to help! Reach out through any of the channels below.</Text>
            <View style={styles.card}>
                <ContactRow icon="call-outline" label="Call Us" value={SUPPORT.phone} onPress={() => Linking.openURL(`tel:${SUPPORT.phone}`)} />
                <ContactRow icon="mail-outline" label="Email" value={SUPPORT.email} onPress={() => Linking.openURL(`mailto:${SUPPORT.email}`)} />
                <ContactRow icon="logo-whatsapp" label="WhatsApp" value={SUPPORT.phone} onPress={() => Linking.openURL(`https://wa.me/${SUPPORT.whatsapp}`)} />
            </View>
            <Text style={styles.hours}>Support Hours: Mon–Sat, 9 AM – 7 PM IST</Text>
        </ScrollView>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, ...shadows.sm },
    backButton: { marginRight: spacing.md },
    headerTitle: { ...typography.h2, fontSize: 20, color: colors.text },
    scroll: { flex: 1, padding: spacing.md },
    intro: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.sm, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    rowLabel: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: 2 },
    rowValue: { ...typography.caption, color: colors.textSecondary },
    hours: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
