// Addresses Screen — List, delete, set default

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { customerColors } from '../../theme/customerTheme';
import { profileService } from '../../services/profileService';
import { Address } from '../../models/types';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type Props = { navigation: NativeStackNavigationProp<any> };

export const AddressesScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAddresses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await profileService.getAddresses();
            setAddresses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchAddresses(); }, [fetchAddresses]));

    const handleDelete = async (id: string) => {
        // Optimistic: remove from list immediately
        const prev = addresses;
        setAddresses((a) => a.filter((addr) => addr.id !== id));
        try {
            console.log('[Addresses] Deleting id:', id);
            await profileService.deleteAddress(id);
            console.log('[Addresses] Deleted successfully');
        } catch (e: any) {
            console.error('[Addresses] Delete failed:', e?.response?.data || e?.message);
            // Restore list on failure
            setAddresses(prev);
            Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to delete');
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const updated = await profileService.setDefaultAddress(id);
            setAddresses(updated);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const renderItem = ({ item }: { item: Address }) => (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    {item.label && <Text style={styles.label}>{item.label}</Text>}
                    <Text style={styles.line}>{item.line1}</Text>
                    {item.line2 ? <Text style={styles.line}>{item.line2}</Text> : null}
                    <Text style={styles.line}>{item.city}, {item.state} – {item.postal_code}</Text>
                </View>
                {item.is_default && (
                    <View style={styles.defaultBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                        <Text style={styles.defaultText}>Default</Text>
                    </View>
                )}
            </View>
            <View style={styles.actions}>
                {!item.is_default && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(item.id)}>
                        <Ionicons name="star-outline" size={18} color={colors.primary} />
                        <Text style={styles.actionText}>Set Default</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddEditAddress', { address: item })}>
                    <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
            </View>
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
                <Ionicons name="location" size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>My Addresses</Text>
                        <Text style={styles.headerSubtitle}>Manage your delivery locations</Text>
                    </View>
                </View>
            </LinearGradient>
            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={customerColors.primaryDark} /></View>
            ) : addresses.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="location-outline" size={56} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No addresses yet</Text>
                </View>
            ) : (
                <FlatList data={addresses} keyExtractor={(a) => a.id} renderItem={renderItem} contentContainerStyle={{ padding: spacing.md }} />
            )}
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEditAddress', {})}>
                <Ionicons name="add" size={28} color={colors.textOnPrimary} />
            </TouchableOpacity>
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
        ...typography.headerTitle,
        color: colors.textOnPrimary,
    },
    headerSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 2,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { ...typography.bodySmall, fontWeight: '700', color: colors.text, marginBottom: 4 },
    line: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
    defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 124, 145, 0.1)', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
    defaultText: { ...typography.caption, color: customerColors.primaryDark, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { ...typography.caption, color: customerColors.primaryDark, fontWeight: '600' },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: customerColors.primaryDark, alignItems: 'center', justifyContent: 'center', ...shadows.lg },
});
