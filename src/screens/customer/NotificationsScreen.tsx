// Notifications Screen — Local toggles

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { customerColors } from '../../theme/customerTheme';

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
    const insets = useSafeAreaInsets();
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
        <View style={styles.container}>
            <LinearGradient
                colors={[customerColors.primary, customerColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + spacing.md }]}
            >
                <Ionicons name="notifications" size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <Text style={styles.headerSubtitle}>Stay updated with AquaCare</Text>
                    </View>
                </View>
            </LinearGradient>
            <ScrollView style={styles.scroll}>
                <View style={styles.card}>
                    <Row label="Push Notifications" subtitle="Order updates, delivery status" pref="push" />
                    <Row label="Email Notifications" subtitle="Order confirmations, receipts" pref="email" />
                    <Row label="SMS Alerts" subtitle="OTPs, delivery alerts" pref="sms" />
                    <Row label="Promotional" subtitle="Offers, deals, recommendations" pref="promo" />
                </View>
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
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.sm, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: 2 },
    rowSub: { ...typography.caption, color: colors.textSecondary },
});
