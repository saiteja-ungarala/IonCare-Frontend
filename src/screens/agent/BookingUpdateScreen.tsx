import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Modal,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../models/types';
import { agentTheme } from '../../theme/agentTheme';
import { agentService } from '../../services/agentService';
import { showAgentToast } from '../../utils/agentToast';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingUpdate'>;

type UpdateType = 'arrived' | 'diagnosed' | 'in_progress' | 'completed' | 'note';

interface UpdateTypeOption {
    value: UpdateType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

const UPDATE_TYPES: UpdateTypeOption[] = [
    { value: 'arrived',     label: 'Arrived',     icon: 'location',       color: '#F97316' },
    { value: 'diagnosed',   label: 'Diagnosed',   icon: 'search',         color: agentTheme.colors.agentPrimary },
    { value: 'in_progress', label: 'In Progress', icon: 'construct',      color: '#3B82F6' },
    { value: 'completed',   label: 'Completed',   icon: 'checkmark-circle', color: agentTheme.colors.success },
    { value: 'note',        label: 'Add Note',    icon: 'document-text',  color: agentTheme.colors.textSecondary },
];

const C = agentTheme.colors;
const S = agentTheme.spacing;
const R = agentTheme.radius;
const T = agentTheme.typography;

export const BookingUpdateScreen: React.FC<Props> = ({ navigation, route }) => {
    const { bookingId } = route.params;

    const [selectedType, setSelectedType] = useState<UpdateType | null>(null);
    const [note, setNote] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);

    const selectedOption = UPDATE_TYPES.find((u) => u.value === selectedType);

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Photo library access is needed to add a photo.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            quality: 0.7,
            allowsEditing: true,
        });
        if (!result.canceled && result.assets[0]?.uri) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const doPost = async () => {
        if (!selectedType) return;
        setSubmitting(true);
        try {
            await agentService.postJobUpdate(bookingId, {
                update_type: selectedType,
                note: note.trim() || undefined,
                media_url: photoUri || undefined,
            });
            showAgentToast('Update posted!');
            navigation.goBack();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to post update';
            Alert.alert('Error', msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePost = () => {
        if (!selectedType) {
            Alert.alert('Select update type', 'Please choose what kind of update to post.');
            return;
        }
        if (selectedType === 'completed') {
            setConfirmModalVisible(true);
        } else {
            doPost();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={submitting}>
                    <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post Update</Text>
                <Text style={styles.headerSub}>#{bookingId}</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Update type buttons */}
                <Text style={styles.sectionLabel}>Update Type</Text>
                <View style={styles.typeGrid}>
                    {UPDATE_TYPES.map((opt) => {
                        const active = selectedType === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.typeBtn,
                                    active && { backgroundColor: opt.color, borderColor: opt.color },
                                ]}
                                onPress={() => setSelectedType(opt.value)}
                                activeOpacity={0.75}
                            >
                                <Ionicons
                                    name={opt.icon}
                                    size={20}
                                    color={active ? '#fff' : opt.color}
                                />
                                <Text style={[styles.typeBtnText, active && { color: '#fff' }]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Note input */}
                <Text style={styles.sectionLabel}>Note <Text style={styles.optionalTag}>(optional)</Text></Text>
                <TextInput
                    style={styles.noteInput}
                    placeholder="Add a note about the work done..."
                    placeholderTextColor={C.textSecondary}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!submitting}
                />

                {/* Add Photo */}
                <Text style={styles.sectionLabel}>Photo <Text style={styles.optionalTag}>(optional)</Text></Text>
                {photoUri ? (
                    <View style={styles.photoWrapper}>
                        <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                        <TouchableOpacity
                            style={styles.photoRemove}
                            onPress={() => setPhotoUri(null)}
                        >
                            <Ionicons name="close-circle" size={24} color={C.danger} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto} activeOpacity={0.75}>
                        <Ionicons name="camera-outline" size={22} color={agentTheme.colors.agentPrimary} />
                        <Text style={styles.photoBtnText}>Add Photo</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Post button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.postBtn,
                        (!selectedType || submitting) && styles.postBtnDisabled,
                        selectedOption && { backgroundColor: selectedOption.color },
                    ]}
                    onPress={handlePost}
                    disabled={!selectedType || submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            {selectedOption && (
                                <Ionicons name={selectedOption.icon} size={20} color="#fff" />
                            )}
                            <Text style={styles.postBtnText}>
                                {selectedType ? `Post — ${selectedOption?.label}` : 'Post Update'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Completed confirmation modal */}
            <Modal visible={confirmModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIconWrap}>
                            <Ionicons name="checkmark-circle" size={52} color={C.success} />
                        </View>
                        <Text style={styles.modalTitle}>Mark as Completed?</Text>
                        <Text style={styles.modalMessage}>
                            Mark this job as completed? This cannot be undone.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setConfirmModalVisible(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: C.success }]}
                                onPress={() => {
                                    setConfirmModalVisible(false);
                                    doPost();
                                }}
                            >
                                <Text style={styles.modalBtnConfirmText}>Yes, Complete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: agentTheme.colors.agentSurface },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: S.lg,
        paddingVertical: S.md,
        backgroundColor: C.agentDark,
        gap: S.md,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { ...T.h2, color: C.textOnDark, flex: 1 },
    headerSub: { ...T.caption, color: C.agentPrimary },

    scroll: { flex: 1 },
    scrollContent: { padding: S.lg, paddingBottom: 100, gap: S.sm },

    sectionLabel: {
        ...T.caption,
        color: C.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: S.xs,
        marginTop: S.md,
    },
    optionalTag: { ...T.caption, color: C.agentMuted, fontWeight: '500', textTransform: 'none' },

    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: S.sm,
    },
    typeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S.xs,
        paddingVertical: S.sm,
        paddingHorizontal: S.md,
        borderRadius: R.md,
        borderWidth: 1.5,
        borderColor: C.border,
        backgroundColor: C.agentSurface,
    },
    typeBtnText: { ...T.bodySmall, color: C.textPrimary, fontWeight: '600' },

    noteInput: {
        backgroundColor: C.agentSurface,
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: R.md,
        padding: S.md,
        ...T.body,
        color: C.textPrimary,
        minHeight: 100,
    },

    photoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: S.sm,
        padding: S.md,
        borderRadius: R.md,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: C.agentPrimary,
        backgroundColor: C.agentSurfaceAlt,
        justifyContent: 'center',
    },
    photoBtnText: { ...T.body, color: C.agentPrimary, fontWeight: '600' },
    photoWrapper: { position: 'relative', alignSelf: 'flex-start' },
    photoThumb: {
        width: 140,
        height: 100,
        borderRadius: R.sm,
        backgroundColor: C.border,
    },
    photoRemove: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: C.agentSurface,
        borderRadius: 12,
    },

    footer: {
        padding: S.lg,
        backgroundColor: C.agentSurface,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    postBtn: {
        height: 52,
        borderRadius: R.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: S.sm,
        backgroundColor: C.agentPrimary,
    },
    postBtnDisabled: { opacity: 0.4 },
    postBtnText: { ...T.button, color: '#fff' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: S.xl,
    },
    modalCard: {
        backgroundColor: C.agentSurface,
        borderRadius: R.lg,
        padding: S.xl,
        width: '100%',
        alignItems: 'center',
    },
    modalIconWrap: { marginBottom: S.md },
    modalTitle: { ...T.h2, color: C.textPrimary, marginBottom: S.sm },
    modalMessage: { ...T.body, color: C.textSecondary, textAlign: 'center', marginBottom: S.xl, lineHeight: 22 },
    modalButtons: { flexDirection: 'row', gap: S.md, width: '100%' },
    modalBtn: { flex: 1, height: 46, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
    modalBtnCancel: { backgroundColor: C.agentSurfaceAlt, borderWidth: 1, borderColor: C.border },
    modalBtnCancelText: { ...T.body, fontWeight: '700', color: C.textSecondary },
    modalBtnConfirmText: { ...T.body, fontWeight: '700', color: '#fff' },
});
