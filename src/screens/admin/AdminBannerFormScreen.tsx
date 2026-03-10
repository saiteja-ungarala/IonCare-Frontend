import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { adminColors } from '../../theme/adminTheme';
import { createBanner, updateBanner, uploadBannerImage } from '../../services/adminService';

const SERVER_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:3000/api').replace(/\/api$/, '');

type RouteParams = {
    mode: 'create' | 'edit';
    id?: number;
    item?: {
        id: number;
        title: string;
        subtitle: string | null;
        image_url: string | null;
        link_type: string;
        link_value: string | null;
        is_active: number;
        display_order: number;
        starts_at: string | null;
        expires_at: string | null;
    };
};

const LINK_TYPES = ['none', 'service', 'product', 'screen', 'url'];

function useToast() {
    const [visible, setVisible] = useState(false);
    const [msg, setMsg]         = useState('');
    const show = (message: string) => {
        setMsg(message);
        setVisible(true);
        setTimeout(() => setVisible(false), 1800);
    };
    return { visible, msg, show };
}

type DropdownProps = {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
};

function Dropdown({ label, value, options, onChange }: DropdownProps) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
                <Text style={styles.dropdownBtnText}>{value}</Text>
                <Ionicons name="chevron-down" size={16} color={adminColors.textMuted} />
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
                    <View style={styles.dropdownList}>
                        <Text style={styles.dropdownListTitle}>{label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={o => o}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.dropdownOption, item === value && styles.dropdownOptionActive]}
                                    onPress={() => { onChange(item); setOpen(false); }}
                                >
                                    <Text style={[styles.dropdownOptionText, item === value && styles.dropdownOptionTextActive]}>
                                        {item}
                                    </Text>
                                    {item === value && <Ionicons name="checkmark" size={16} color={adminColors.primary} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

export default function AdminBannerFormScreen() {
    const navigation = useNavigation<any>();
    const route      = useRoute();
    const { mode, item } = route.params as RouteParams;
    const toast = useToast();

    const [title,      setTitle]     = useState(item?.title ?? '');
    const [subtitle,   setSubtitle]  = useState(item?.subtitle ?? '');
    const [linkType,   setLinkType]  = useState(item?.link_type ?? 'none');
    const [linkValue,  setLinkValue] = useState(item?.link_value ?? '');
    const [startsAt,   setStartsAt]  = useState(item?.starts_at ?? '');
    const [expiresAt,  setExpiresAt] = useState(item?.expires_at ?? '');
    const [isActive,   setIsActive]  = useState(item ? Boolean(item.is_active) : true);

    // Image state
    const [imageUri,    setImageUri]    = useState<string | null>(null);  // local picked URI
    const [existingUrl, setExistingUrl] = useState<string | null>(item?.image_url ?? null); // server path

    const [saving, setSaving] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow photo library access.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
            allowsEditing: true,
            aspect: [16, 6],
        });
        if (!result.canceled && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Validation', 'Title is required.');
            return;
        }

        setSaving(true);
        try {
            let image_url = existingUrl;

            // Upload new image if picked
            if (imageUri) {
                const fd = new FormData();
                const filename = imageUri.split('/').pop() ?? 'banner.jpg';
                const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
                const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
                fd.append('image', { uri: imageUri, name: filename, type: mime } as any);
                const uploaded = await uploadBannerImage(fd);
                image_url = uploaded.image_url;
            }

            const data: Record<string, any> = {
                title: title.trim(),
                subtitle: subtitle.trim() || null,
                link_type: linkType,
                link_value: linkType !== 'none' ? (linkValue.trim() || null) : null,
                starts_at:  startsAt.trim()  || null,
                expires_at: expiresAt.trim() || null,
                is_active:  isActive ? 1 : 0,
            };
            if (image_url) data.image_url = image_url;

            if (mode === 'create') {
                await createBanner(data);
            } else if (item) {
                await updateBanner(item.id, data);
            }

            toast.show(mode === 'create' ? 'Banner created!' : 'Banner updated!');
            setTimeout(() => navigation.goBack(), 1800);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save banner.');
        } finally {
            setSaving(false);
        }
    };

    const previewUri = imageUri ?? (existingUrl ? SERVER_BASE + existingUrl : null);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={adminColors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {mode === 'create' ? 'New Banner' : 'Edit Banner'}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                    {saving
                        ? <ActivityIndicator size="small" color={adminColors.textOnPrimary} />
                        : <Text style={styles.saveBtnText}>Save</Text>
                    }
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

                    {/* Image picker */}
                    <Text style={styles.fieldLabel}>Banner Image</Text>
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.7}>
                        {previewUri ? (
                            <Image source={{ uri: previewUri }} style={styles.imagePreview} resizeMode="cover" />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="camera-outline" size={32} color={adminColors.textMuted} />
                                <Text style={styles.imagePlaceholderText}>Tap to pick image</Text>
                            </View>
                        )}
                        {previewUri && (
                            <View style={styles.imageOverlay}>
                                <Ionicons name="camera" size={20} color="#FFFFFF" />
                                <Text style={styles.imageOverlayText}>Change</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Title */}
                    <Text style={styles.fieldLabel}>Title <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Summer Sale"
                        placeholderTextColor={adminColors.textLight}
                    />

                    {/* Subtitle */}
                    <Text style={styles.fieldLabel}>Subtitle</Text>
                    <TextInput
                        style={styles.input}
                        value={subtitle}
                        onChangeText={setSubtitle}
                        placeholder="Short description"
                        placeholderTextColor={adminColors.textLight}
                    />

                    {/* Link Type */}
                    <Dropdown
                        label="Link Type"
                        value={linkType}
                        options={LINK_TYPES}
                        onChange={setLinkType}
                    />

                    {/* Link Value */}
                    {linkType !== 'none' && (
                        <>
                            <Text style={styles.fieldLabel}>Link Value</Text>
                            <TextInput
                                style={styles.input}
                                value={linkValue}
                                onChangeText={setLinkValue}
                                placeholder={linkType === 'url' ? 'https://...' : `${linkType} ID or slug`}
                                placeholderTextColor={adminColors.textLight}
                                autoCapitalize="none"
                            />
                        </>
                    )}

                    {/* Starts At */}
                    <Text style={styles.fieldLabel}>Starts At (ISO date, optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={startsAt}
                        onChangeText={setStartsAt}
                        placeholder="e.g. 2026-04-01T00:00:00"
                        placeholderTextColor={adminColors.textLight}
                        autoCapitalize="none"
                    />

                    {/* Expires At */}
                    <Text style={styles.fieldLabel}>Expires At (ISO date, optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={expiresAt}
                        onChangeText={setExpiresAt}
                        placeholder="e.g. 2026-04-30T23:59:59"
                        placeholderTextColor={adminColors.textLight}
                        autoCapitalize="none"
                    />

                    {/* Active toggle */}
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Active</Text>
                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                            trackColor={{ false: adminColors.border, true: adminColors.accent }}
                            thumbColor={isActive ? adminColors.primary : adminColors.textMuted}
                        />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Toast */}
            {toast.visible && (
                <View style={styles.toast}>
                    <Text style={styles.toastText}>{toast.msg}</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: adminColors.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: adminColors.surface,
        borderBottomWidth: 1, borderBottomColor: adminColors.border,
        gap: 12,
    },
    backBtn:      { padding: 4 },
    headerTitle:  { flex: 1, fontSize: 18, fontWeight: '700', color: adminColors.text },
    saveBtn: {
        backgroundColor: adminColors.primary,
        paddingHorizontal: 20, paddingVertical: 8,
        borderRadius: 8, minWidth: 64, alignItems: 'center',
    },
    saveBtnText:  { fontSize: 14, fontWeight: '700', color: adminColors.textOnPrimary },
    form:         { padding: 20, paddingBottom: 60 },
    fieldLabel:   { fontSize: 13, fontWeight: '600', color: adminColors.textSecondary, marginBottom: 6, marginTop: 16 },
    required:     { color: adminColors.error },
    input: {
        backgroundColor: adminColors.surface,
        borderWidth: 1, borderColor: adminColors.border,
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
        fontSize: 15, color: adminColors.text,
    },
    // Dropdown
    dropdownBtn: {
        backgroundColor: adminColors.surface,
        borderWidth: 1, borderColor: adminColors.border,
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    dropdownBtnText: { fontSize: 15, color: adminColors.text, textTransform: 'capitalize' },
    overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
    dropdownList: {
        backgroundColor: adminColors.surface,
        borderRadius: 14, overflow: 'hidden',
        paddingBottom: 8,
    },
    dropdownListTitle: {
        fontSize: 14, fontWeight: '700', color: adminColors.textSecondary,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: adminColors.border,
    },
    dropdownOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 13,
    },
    dropdownOptionActive: { backgroundColor: adminColors.primaryLight },
    dropdownOptionText:   { fontSize: 15, color: adminColors.text, textTransform: 'capitalize' },
    dropdownOptionTextActive: { fontWeight: '700', color: adminColors.primary },
    // Image
    imagePicker: {
        height: 140, borderRadius: 12, overflow: 'hidden',
        borderWidth: 1, borderColor: adminColors.border,
        backgroundColor: adminColors.backgroundAlt,
    },
    imagePreview:    { width: '100%', height: '100%' },
    imagePlaceholder: {
        flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    imagePlaceholderText: { fontSize: 13, color: adminColors.textMuted },
    imageOverlay: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 6,
        borderTopLeftRadius: 10,
    },
    imageOverlayText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
    // Switch
    switchRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 20, backgroundColor: adminColors.surface,
        borderWidth: 1, borderColor: adminColors.border,
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    },
    switchLabel: { fontSize: 15, fontWeight: '600', color: adminColors.text },
    // Toast
    toast: {
        position: 'absolute', bottom: 40, alignSelf: 'center',
        backgroundColor: adminColors.success,
        paddingHorizontal: 24, paddingVertical: 12,
        borderRadius: 24, elevation: 10,
    },
    toastText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
