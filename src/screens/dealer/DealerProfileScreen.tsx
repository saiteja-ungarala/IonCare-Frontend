import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { dealerTheme } from '../../theme/dealerTheme';
import { DealerScreen } from '../../components/dealer/DealerScreen';
import { useAuthStore, useDealerStore } from '../../store';
import { profileService } from '../../services/profileService';

const getStatusTone = (status: string): { bg: string; text: string } => {
    if (status === 'approved') return { bg: '#E7F3EC', text: dealerTheme.colors.success };
    if (status === 'rejected') return { bg: '#FDECEC', text: dealerTheme.colors.danger };
    if (status === 'pending') return { bg: '#FFF7E7', text: dealerTheme.colors.warning };
    return { bg: '#EDF3F8', text: dealerTheme.colors.textSecondary };
};

export const DealerProfileScreen: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { me, verificationStatus, fetchMe, updateDealerProfile, loadingMe, error } = useDealerStore();

    const [editing, setEditing] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [addressText, setAddressText] = useState('');

    const hydrateForm = useCallback(() => {
        setBusinessName(me?.business_name || '');
        setGstNumber(me?.gst_number || '');
        setAddressText(me?.address_text || '');
    }, [me]);

    useFocusEffect(
        useCallback(() => {
            fetchMe();
        }, [fetchMe])
    );

    useEffect(() => {
        hydrateForm();
    }, [hydrateForm]);

    const save = async () => {
        const ok = await updateDealerProfile({
            business_name: businessName.trim() || undefined,
            gst_number: gstNumber.trim() || undefined,
            address_text: addressText.trim() || undefined,
        });
        if (ok) {
            setEditing(false);
            Alert.alert('Updated', 'Dealer profile updated successfully.');
        }
    };

    const deleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will delete your account from within the app and sign you out. Some order, booking, refund, or compliance records may still be kept where required.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await profileService.deleteAccount();
                            await logout();
                        } catch (deleteError: any) {
                            Alert.alert('Delete Account', deleteError?.message || 'We could not delete your account right now.');
                        }
                    },
                },
            ]
        );
    };

    const status = String(verificationStatus || me?.verification_status || 'unverified').toLowerCase();
    const tone = getStatusTone(status);
    const displayName = user?.name || me?.full_name || 'Dealer User';
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'DU';
    const hasBaseLocation = me?.base_lat !== null && me?.base_lng !== null;
    const pricingAccessLabel = status === 'approved' ? 'Unlocked' : 'Awaiting approval';

    return (
        <DealerScreen>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Dealer Profile</Text>
                <Text style={styles.subtitle}>Business identity, settings, and account readiness</Text>

                <View style={styles.heroCard}>
                    <View style={styles.headerRow}>
                        <View style={styles.heroIdentity}>
                            <View style={styles.avatarBadge}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                            <View style={styles.heroCopy}>
                                <Text style={styles.name}>{displayName}</Text>
                                <Text style={styles.meta}>{user?.email || '-'}</Text>
                                <Text style={styles.meta}>{me?.phone || '-'}</Text>
                            </View>
                        </View>
                        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                            <Text style={[styles.badgeText, { color: tone.text }]}>{status.toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={styles.heroStats}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Pricing Access</Text>
                            <Text style={styles.statValue}>{pricingAccessLabel}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Base Location</Text>
                            <Text style={styles.statValue}>{hasBaseLocation ? 'Configured' : 'Pending'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <Text style={styles.sectionTitle}>Business Details</Text>
                        <TouchableOpacity onPress={() => setEditing((v) => !v)}>
                            <Text style={styles.editText}>{editing ? 'Cancel' : 'Edit'}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.fieldLabel}>Business Name</Text>
                    <TextInput
                        style={[styles.input, !editing ? styles.inputReadonly : null]}
                        editable={editing}
                        value={businessName}
                        onChangeText={setBusinessName}
                        placeholder="Enter business name"
                        placeholderTextColor={dealerTheme.colors.dealerMuted}
                    />

                    <Text style={styles.fieldLabel}>GST Number</Text>
                    <TextInput
                        style={[styles.input, !editing ? styles.inputReadonly : null]}
                        editable={editing}
                        value={gstNumber}
                        onChangeText={setGstNumber}
                        placeholder="Enter GST number"
                        placeholderTextColor={dealerTheme.colors.dealerMuted}
                        autoCapitalize="characters"
                    />

                    <Text style={styles.fieldLabel}>Address</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, !editing ? styles.inputReadonly : null]}
                        editable={editing}
                        value={addressText}
                        onChangeText={setAddressText}
                        placeholder="Enter business address"
                        placeholderTextColor={dealerTheme.colors.dealerMuted}
                        multiline
                    />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {editing ? (
                        <TouchableOpacity style={[styles.primaryButton, loadingMe ? styles.buttonDisabled : null]} onPress={save} disabled={loadingMe}>
                            <Text style={styles.primaryButtonText}>{loadingMe ? 'Saving...' : 'Save Changes'}</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Operations</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Business Address</Text>
                        <Text style={styles.infoValue}>{me?.address_text || 'Not added yet'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Base Coordinates</Text>
                        <Text style={styles.infoValue}>
                            {hasBaseLocation ? `${me?.base_lat}, ${me?.base_lng}` : 'Location not configured'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Verification</Text>
                        <Text style={styles.infoValue}>{status.toUpperCase()}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Pricing Access</Text>
                        <Text style={styles.infoValue}>{pricingAccessLabel}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Additional Profile Info</Text>
                    <Text style={styles.placeholderText}>
                        Add billing contacts, payout preferences, warehouse notes, and dealer support preferences here as the profile expands.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                    <Text style={styles.placeholderText}>
                        Dealer policy documents, payout terms, and compliance checklists can be surfaced in this section without changing the existing dealer flow.
                    </Text>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={deleteAccount}>
                    <Text style={styles.deleteText}>Delete Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </DealerScreen>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: dealerTheme.spacing.lg,
        gap: dealerTheme.spacing.md,
        paddingBottom: dealerTheme.spacing.xxl,
    },
    title: {
        ...dealerTheme.typography.h1,
        color: dealerTheme.colors.textPrimary,
    },
    subtitle: {
        ...dealerTheme.typography.bodySmall,
        color: dealerTheme.colors.textSecondary,
        marginTop: 4,
    },
    heroCard: {
        backgroundColor: dealerTheme.colors.dealerSurface,
        borderRadius: dealerTheme.radius.lg,
        borderWidth: 1,
        borderColor: dealerTheme.colors.border,
        padding: dealerTheme.spacing.md,
    },
    card: {
        backgroundColor: dealerTheme.colors.dealerSurface,
        borderRadius: dealerTheme.radius.lg,
        borderWidth: 1,
        borderColor: dealerTheme.colors.border,
        padding: dealerTheme.spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: dealerTheme.spacing.sm,
    },
    heroIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: dealerTheme.spacing.sm,
    },
    avatarBadge: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: '#E8F1FB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...dealerTheme.typography.h2,
        color: dealerTheme.colors.dealerPrimary,
    },
    heroCopy: {
        flex: 1,
    },
    heroStats: {
        flexDirection: 'row',
        gap: dealerTheme.spacing.sm,
        marginTop: dealerTheme.spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F5FAFE',
        borderRadius: dealerTheme.radius.md,
        borderWidth: 1,
        borderColor: dealerTheme.colors.border,
        padding: dealerTheme.spacing.sm,
    },
    statLabel: {
        ...dealerTheme.typography.caption,
        color: dealerTheme.colors.textSecondary,
    },
    statValue: {
        ...dealerTheme.typography.bodySmall,
        color: dealerTheme.colors.textPrimary,
        marginTop: 4,
        fontWeight: '700',
    },
    name: {
        ...dealerTheme.typography.h2,
        color: dealerTheme.colors.textPrimary,
    },
    meta: {
        ...dealerTheme.typography.bodySmall,
        color: dealerTheme.colors.textSecondary,
        marginTop: 2,
    },
    badge: {
        borderRadius: dealerTheme.radius.full,
        paddingHorizontal: dealerTheme.spacing.sm,
        paddingVertical: 4,
    },
    badgeText: {
        ...dealerTheme.typography.caption,
    },
    sectionTitle: {
        ...dealerTheme.typography.h2,
        color: dealerTheme.colors.textPrimary,
    },
    editText: {
        ...dealerTheme.typography.bodySmall,
        color: dealerTheme.colors.dealerPrimary,
        fontWeight: '700',
    },
    fieldLabel: {
        ...dealerTheme.typography.caption,
        color: dealerTheme.colors.textSecondary,
        marginTop: dealerTheme.spacing.sm,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: dealerTheme.colors.border,
        borderRadius: dealerTheme.radius.md,
        paddingHorizontal: dealerTheme.spacing.sm,
        paddingVertical: dealerTheme.spacing.sm,
        color: dealerTheme.colors.textPrimary,
        backgroundColor: '#FDFEFF',
        ...dealerTheme.typography.bodySmall,
    },
    inputReadonly: {
        backgroundColor: '#F4F8FB',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    errorText: {
        ...dealerTheme.typography.caption,
        color: dealerTheme.colors.danger,
        marginTop: dealerTheme.spacing.sm,
    },
    infoRow: {
        marginTop: dealerTheme.spacing.sm,
        paddingTop: dealerTheme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: dealerTheme.colors.border,
    },
    infoLabel: {
        ...dealerTheme.typography.caption,
        color: dealerTheme.colors.textSecondary,
    },
    infoValue: {
        ...dealerTheme.typography.bodySmall,
        color: dealerTheme.colors.textPrimary,
        marginTop: 4,
    },
    placeholderText: {
        ...dealerTheme.typography.bodySmall,
        color: dealerTheme.colors.textSecondary,
    },
    primaryButton: {
        marginTop: dealerTheme.spacing.md,
        backgroundColor: dealerTheme.colors.dealerPrimary,
        borderRadius: dealerTheme.radius.md,
        paddingVertical: dealerTheme.spacing.sm,
        alignItems: 'center',
    },
    primaryButtonText: {
        ...dealerTheme.typography.button,
        color: dealerTheme.colors.textOnPrimary,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    logoutButton: {
        backgroundColor: '#FDECEC',
        borderRadius: dealerTheme.radius.md,
        borderWidth: 1,
        borderColor: '#F2C5C5',
        paddingVertical: dealerTheme.spacing.sm,
        alignItems: 'center',
    },
    logoutText: {
        ...dealerTheme.typography.button,
        color: dealerTheme.colors.danger,
    },
    deleteButton: {
        backgroundColor: dealerTheme.colors.danger,
        borderRadius: dealerTheme.radius.md,
        paddingVertical: dealerTheme.spacing.sm,
        alignItems: 'center',
    },
    deleteText: {
        ...dealerTheme.typography.button,
        color: dealerTheme.colors.textOnPrimary,
    },
});

