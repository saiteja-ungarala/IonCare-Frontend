// Edit Profile Screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { useAuthStore } from '../../store';
import { profileService } from '../../services/profileService';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = { navigation: NativeStackNavigationProp<any> };

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { user } = useAuthStore();
    const [fullName, setFullName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Validation', 'Name is required');
            return;
        }
        setSaving(true);
        try {
            const updated = await profileService.updateProfile({
                full_name: fullName.trim(),
                phone: phone.trim(),
            });
            if (updated) {
                // Update local auth store user
                useAuthStore.setState((s) => ({
                    user: s.user ? { ...s.user, name: updated.full_name, phone: updated.phone } : s.user,
                }));
                Alert.alert('Success', 'Profile updated successfully');
                navigation.goBack();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
                    <View style={styles.field}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your name" placeholderTextColor={colors.textMuted} />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <View style={[styles.input, styles.readOnly]}>
                            <Text style={styles.readOnlyText}>{user?.email}</Text>
                            <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Phone</Text>
                        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Enter phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
                    </View>

                    <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.surface, ...shadows.sm },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...typography.h2, fontSize: 20, color: colors.text },
    scrollView: { flex: 1 },
    form: { padding: spacing.lg },
    field: { marginBottom: spacing.lg },
    label: { ...typography.bodySmall, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase' },
    input: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border },
    readOnly: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface3 },
    readOnlyText: { ...typography.body, color: colors.textMuted },
    saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
    saveBtnText: { ...typography.button, color: colors.textOnPrimary },
});
