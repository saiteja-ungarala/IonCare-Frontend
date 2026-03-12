// Notifications Screen — Local toggles

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEY = 'notification_prefs';

interface Prefs {
    push: boolean;
    email: boolean;
    sms: boolean;
    promo: boolean;
}

const defaults: Prefs = { push: true, email: true, sms: false, promo: true };

type Props = { navigation: NativeStackNavigationProp<any> };

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
    const [prefs, setPrefs] = useState<Prefs>(defaults);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((val: string | null) => {
            if (val) setPrefs(JSON.parse(val));
        });
    }, []);

    const toggle = useCallback((key: keyof Prefs) => {
        setPrefs((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const Row = ({ label, subtitle, pref }: { label: string; subtitle: string; pref: keyof Prefs }) => (
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowSub}>{subtitle}</Text>
            </View>
            <Switch
                value={prefs[pref]}
                onValueChange={() => toggle(pref)}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={prefs[pref] ? colors.primary : colors.surface3}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <ScrollView style={styles.scroll}>
                <View style={styles.card}>
                    <Row label="Push Notifications" subtitle="Order updates, delivery status" pref="push" />
                    <Row label="Email Notifications" subtitle="Order confirmations, receipts" pref="email" />
                    <Row label="SMS Alerts" subtitle="OTPs, delivery alerts" pref="sms" />
                    <Row label="Promotional" subtitle="Offers, deals, recommendations" pref="promo" />
                </View>
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
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.sm, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: 2 },
    rowSub: { ...typography.caption, color: colors.textSecondary },
});
