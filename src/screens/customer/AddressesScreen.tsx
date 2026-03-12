// Addresses Screen — List, delete, set default

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { profileService } from '../../services/profileService';
import { Address } from '../../models/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = { navigation: NativeStackNavigationProp<any> };

export const AddressesScreen: React.FC<Props> = ({ navigation }) => {
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Addresses</Text>
                <View style={{ width: 40 }} />
            </View>
            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.surface, ...shadows.sm },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...typography.h2, fontSize: 20, color: colors.text },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { ...typography.bodySmall, fontWeight: '700', color: colors.text, marginBottom: 4 },
    line: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
    defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
    defaultText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.lg },
});
