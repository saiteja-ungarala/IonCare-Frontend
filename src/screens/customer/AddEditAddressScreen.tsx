// Add / Edit Address Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { profileService } from '../../services/profileService';
import { Address, RootStackParamList } from '../../models/types';
import { requestLocationPermission, getCurrentLocation, reverseGeocode } from '../../utils/location';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { customerColors } from '../../theme/customerTheme';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AddEditAddress'>;
    route: RouteProp<RootStackParamList, 'AddEditAddress'>;
};

export const AddEditAddressScreen: React.FC<Props> = ({ navigation, route }) => {
    const existing = route.params?.address;
    const isEdit = !!existing;

    const [label, setLabel] = useState(existing?.label || '');
    const [line1, setLine1] = useState(existing?.line1 || '');
    const [line2, setLine2] = useState(existing?.line2 || '');
    const [city, setCity] = useState(existing?.city || '');
    const [state, setState] = useState(existing?.state || '');
    const [postalCode, setPostalCode] = useState(existing?.postal_code || '');
    const [isDefault, setIsDefault] = useState(existing?.is_default || false);
    const [saving, setSaving] = useState(false);
    const [locating, setLocating] = useState(false);
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

    const handleUseLocation = async () => {
        const granted = await requestLocationPermission();
        if (!granted) {
            Alert.alert('Location Denied', 'Location denied. Fill address manually.');
            return;
        }
        setLocating(true);
        const position = await getCurrentLocation();
        if (!position) {
            setLocating(false);
            Alert.alert('Location Error', 'Unable to get location. Fill manually.');
            return;
        }
        setCoords(position);
        const address = await reverseGeocode(position.latitude, position.longitude);
        setLocating(false);
        if (!address) {
            Alert.alert('Geocode Error', 'Unable to fetch address. Fill manually.');
            return;
        }
        setLine1(address.line1);
        setCity(address.city);
        setState(address.state);
        setPostalCode(address.postal_code);
    };

    const handleSave = async () => {
        if (!line1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
            Alert.alert('Validation', 'Address line 1, city, state, and postal code are required.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                label: label.trim() || undefined,
                line1: line1.trim(),
                line2: line2.trim() || undefined,
                city: city.trim(),
                state: state.trim(),
                postal_code: postalCode.trim(),
                is_default: isDefault,
                ...(coords ? { lat: coords.latitude, lng: coords.longitude } : {}),
            };

            console.log('[AddAddress] Saving payload:', JSON.stringify(payload));

            if (isEdit) {
                await profileService.updateAddress(existing!.id, payload);
                console.log('[AddAddress] Update success');
            } else {
                await profileService.addAddress(payload as Omit<Address, 'id'>);
                console.log('[AddAddress] Create success');
            }

            // Navigate back directly — no Alert dependency
            navigation.goBack();
        } catch (error: any) {
            console.error('[AddAddress] Save failed:', JSON.stringify(error?.response?.data || error?.message));
            setSaving(false);
            const msg = error?.response?.data?.message
                || error?.response?.data?.details?.[0]?.message
                || error?.message
                || 'Failed to save address';
            Alert.alert('Error', String(msg));
        }
    };
    const insets = useSafeAreaInsets();

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
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color={customerColors.textOnPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{isEdit ? 'Edit Address' : 'Add Address'}</Text>
                        <Text style={styles.headerSubtitle}>Set your delivery destination</Text>
                    </View>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView style={styles.scroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity
                        style={[styles.locationBtn, locating && { opacity: 0.6 }]}
                        onPress={handleUseLocation}
                        disabled={locating}
                    >
                        {locating ? (
                            <ActivityIndicator size="small" color={customerColors.primary} style={{ marginRight: 8 }} />
                        ) : (
                            <Ionicons name="location-outline" size={18} color={customerColors.primary} style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.locationBtnText}>
                            {locating ? 'Getting location...' : 'Use My Current Location'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Label</Text>
                        <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="e.g. Home, Office" placeholderTextColor={customerColors.textMuted} />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Address Line 1 *</Text>
                        <TextInput style={styles.input} value={line1} onChangeText={setLine1} placeholder="Street, building, area" placeholderTextColor={customerColors.textMuted} />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Address Line 2</Text>
                        <TextInput style={styles.input} value={line2} onChangeText={setLine2} placeholder="Apartment, floor (optional)" placeholderTextColor={customerColors.textMuted} />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>City *</Text>
                        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={customerColors.textMuted} />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>State *</Text>
                        <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="State" placeholderTextColor={customerColors.textMuted} />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Postal Code *</Text>
                        <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} placeholder="Postal code" placeholderTextColor={customerColors.textMuted} keyboardType="number-pad" />
                    </View>

                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchLabel}>Set as Default</Text>
                            <Text style={styles.switchSub}>Use this for all new orders</Text>
                        </View>
                        <Switch
                            value={isDefault}
                            onValueChange={setIsDefault}
                            trackColor={{ false: customerColors.border, true: customerColors.primary + '60' }}
                            thumbColor={isDefault ? customerColors.primary : customerColors.surface3}
                        />
                    </View>

                    <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color={customerColors.textOnPrimary} /> : <Text style={styles.saveBtnText}>{isEdit ? 'Update Address' : 'Add Address'}</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: customerColors.background },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxxl,
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
        color: customerColors.textOnPrimary,
        fontSize: 22,
    },
    headerSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 2,
    },

    scroll: { flex: 1 },
    form: { padding: spacing.lg },
    field: { marginBottom: spacing.md },
    fieldLabel: { ...typography.bodySmall, fontWeight: '600', color: customerColors.textSecondary, marginBottom: spacing.xs },
    input: { backgroundColor: customerColors.surface, borderRadius: borderRadius.md, padding: spacing.md, ...typography.body, color: customerColors.text, borderWidth: 1, borderColor: customerColors.border },
    switchRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: customerColors.surface, borderRadius: borderRadius.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: customerColors.border },
    switchLabel: { ...typography.body, fontWeight: '600', color: customerColors.text },
    switchSub: { ...typography.caption, color: customerColors.textSecondary },
    saveBtn: { backgroundColor: customerColors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
    saveBtnText: { ...typography.button, color: customerColors.textOnPrimary },
    locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: customerColors.primary, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg, backgroundColor: customerColors.surface },
    locationBtnText: { ...typography.body, color: customerColors.primary, fontWeight: '600' },
});
