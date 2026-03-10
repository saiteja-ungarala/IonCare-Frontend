import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { adminColors } from '../../theme/adminTheme';
import {
    approveAgent,
    approveDealer,
    getKycAgentDetail,
    getKycDealerDetail,
    rejectAgent,
    rejectDealer,
} from '../../services/adminService';

const SERVER_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:3000/api').replace(/\/api$/, '');
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type RouteParams = {
    type: 'agent' | 'dealer';
    userId: number;
};

type KycDocument = {
    id: number;
    doc_type: string;
    file_url: string;
    status: string;
    uploaded_at: string;
};

type KycDetail = {
    id: number;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    verification_status: string;
    review_notes: string | null;
    reviewed_at: string | null;
    reviewed_by_name: string | null;
    // dealer only
    business_name?: string;
    gst_number?: string;
    documents: KycDocument[];
};

function formatDocType(raw: string): string {
    return raw
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

const STATUS_CHIP: Record<string, { bg: string; text: string; label: string }> = {
    pending:    { bg: 'rgba(245,158,11,0.15)',  text: '#B45309', label: 'Pending' },
    approved:   { bg: 'rgba(22,163,74,0.15)',   text: '#15803D', label: 'Approved' },
    rejected:   { bg: 'rgba(239,68,68,0.15)',   text: '#DC2626', label: 'Rejected' },
    unverified: { bg: 'rgba(113,128,150,0.15)', text: '#4A5568', label: 'Unverified' },
};

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

export default function AdminKycDetailScreen() {
    const navigation = useNavigation<any>();
    const route      = useRoute();
    const { type, userId } = route.params as RouteParams;
    const toast = useToast();

    const [detail,      setDetail]      = useState<KycDetail | null>(null);
    const [loading,     setLoading]     = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Reject state
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectNotes,     setRejectNotes]     = useState('');

    // Fullscreen image viewer
    const [lightboxUri,  setLightboxUri]  = useState<string | null>(null);
    const [lightboxLabel, setLightboxLabel] = useState('');

    const loadDetail = useCallback(async () => {
        setLoading(true);
        try {
            const fn   = type === 'agent' ? getKycAgentDetail : getKycDealerDetail;
            const data = await fn(userId);
            setDetail(data);
        } catch (e) {
            console.error('[KycDetail] load error:', e);
            Alert.alert('Error', 'Failed to load KYC detail.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [type, userId]);

    useFocusEffect(useCallback(() => {
        loadDetail();
    }, [loadDetail]));

    const handleApprove = () => {
        Alert.alert(
            'Approve KYC',
            `Approve ${detail?.name}'s KYC? This will activate their account.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            if (type === 'agent') await approveAgent(userId);
                            else                   await approveDealer(userId);
                            toast.show('KYC approved!');
                            setTimeout(() => navigation.goBack(), 1800);
                        } catch (e: any) {
                            Alert.alert('Error', e?.response?.data?.message ?? 'Failed to approve.');
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ],
        );
    };

    const handleReject = async () => {
        if (!rejectNotes.trim()) {
            Alert.alert('Required', 'Please enter review notes before rejecting.');
            return;
        }
        setActionLoading(true);
        try {
            if (type === 'agent') await rejectAgent(userId, rejectNotes.trim());
            else                   await rejectDealer(userId, rejectNotes.trim());
            toast.show('KYC rejected.');
            setTimeout(() => navigation.goBack(), 1800);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Failed to reject.');
        } finally {
            setActionLoading(false);
        }
    };

    const openLightbox = (doc: KycDocument) => {
        setLightboxUri(SERVER_BASE + doc.file_url);
        setLightboxLabel(formatDocType(doc.doc_type));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={adminColors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!detail) return null;

    const st  = detail.verification_status || 'unverified';
    const chip = STATUS_CHIP[st] ?? STATUS_CHIP.unverified;
    const isPending = st === 'pending';

    const docs = detail.documents ?? [];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={adminColors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{detail.name}</Text>
                <View style={[styles.headerChip, { backgroundColor: chip.bg }]}>
                    <Text style={[styles.headerChipText, { color: chip.text }]}>{chip.label}</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* ── Profile section ───────────────────────────────────── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Profile</Text>

                        <Row icon="person-outline"       label="Name"     value={detail.name} />
                        <Row icon="mail-outline"         label="Email"    value={detail.email} />
                        <Row icon="call-outline"         label="Phone"    value={detail.phone || '—'} />
                        <Row icon="shield-outline"       label="Role"     value={type.charAt(0).toUpperCase() + type.slice(1)} />
                        <Row icon="calendar-outline"     label="Joined"   value={formatDate(detail.created_at)} />

                        {type === 'dealer' && detail.business_name && (
                            <Row icon="business-outline" label="Business" value={detail.business_name} />
                        )}
                        {type === 'dealer' && detail.gst_number && (
                            <Row icon="receipt-outline"  label="GST"      value={detail.gst_number} />
                        )}
                    </View>

                    {/* ── Documents section ─────────────────────────────────── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Documents ({docs.length})</Text>

                        {docs.length === 0 ? (
                            <View style={styles.noDocs}>
                                <Ionicons name="document-outline" size={32} color={adminColors.textMuted} />
                                <Text style={styles.noDocsText}>No documents uploaded</Text>
                            </View>
                        ) : (
                            <View style={styles.docGrid}>
                                {docs.map(doc => {
                                    const dSt   = doc.status || 'pending';
                                    const dChip = STATUS_CHIP[dSt] ?? STATUS_CHIP.pending;
                                    const imgUri = SERVER_BASE + doc.file_url;
                                    return (
                                        <TouchableOpacity
                                            key={doc.id}
                                            style={styles.docCard}
                                            activeOpacity={0.8}
                                            onPress={() => openLightbox(doc)}
                                        >
                                            <Text style={styles.docTypeLabel} numberOfLines={1}>
                                                {formatDocType(doc.doc_type)}
                                            </Text>
                                            <Image
                                                source={{ uri: imgUri }}
                                                style={styles.docThumb}
                                                resizeMode="cover"
                                            />
                                            <View style={styles.docFooter}>
                                                <View style={[styles.docStatusChip, { backgroundColor: dChip.bg }]}>
                                                    <Text style={[styles.docStatusText, { color: dChip.text }]}>
                                                        {dSt.charAt(0).toUpperCase() + dSt.slice(1)}
                                                    </Text>
                                                </View>
                                                <Ionicons name="expand-outline" size={14} color={adminColors.textMuted} />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* ── Action section (pending only) ─────────────────────── */}
                    {isPending && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Action</Text>

                            {/* Approve */}
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.approveBtn]}
                                onPress={handleApprove}
                                disabled={actionLoading}
                                activeOpacity={0.8}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                                        <Text style={styles.actionBtnText}>Approve KYC</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Reject */}
                            {!showRejectInput ? (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.rejectBtn]}
                                    onPress={() => setShowRejectInput(true)}
                                    disabled={actionLoading}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="close-circle-outline" size={20} color="#FFF" />
                                    <Text style={styles.actionBtnText}>Reject KYC</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.rejectBox}>
                                    <Text style={styles.rejectLabel}>Review Notes <Text style={styles.required}>*</Text></Text>
                                    <TextInput
                                        style={styles.rejectInput}
                                        value={rejectNotes}
                                        onChangeText={setRejectNotes}
                                        placeholder="Explain reason for rejection..."
                                        placeholderTextColor={adminColors.textLight}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                    />
                                    <View style={styles.rejectBtns}>
                                        <TouchableOpacity
                                            style={styles.rejectCancel}
                                            onPress={() => { setShowRejectInput(false); setRejectNotes(''); }}
                                        >
                                            <Text style={styles.rejectCancelText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.rejectConfirm, actionLoading && { opacity: 0.6 }]}
                                            onPress={handleReject}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading
                                                ? <ActivityIndicator size="small" color="#FFF" />
                                                : <Text style={styles.rejectConfirmText}>Confirm Reject</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* ── Review history ────────────────────────────────────── */}
                    {detail.reviewed_at && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Review History</Text>
                            <View style={styles.historyBox}>
                                {detail.reviewed_by_name && (
                                    <Row icon="person-circle-outline" label="Reviewed by" value={detail.reviewed_by_name} />
                                )}
                                <Row icon="time-outline" label="Reviewed at" value={formatDate(detail.reviewed_at)} />
                                {detail.review_notes && (
                                    <View style={styles.notesRow}>
                                        <Text style={styles.notesLabel}>Notes</Text>
                                        <Text style={styles.notesValue}>{detail.review_notes}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Toast */}
            {toast.visible && (
                <View style={styles.toast}>
                    <Text style={styles.toastText}>{toast.msg}</Text>
                </View>
            )}

            {/* Fullscreen Lightbox */}
            <Modal
                visible={!!lightboxUri}
                transparent
                animationType="fade"
                onRequestClose={() => setLightboxUri(null)}
                statusBarTranslucent
            >
                <View style={styles.lightbox}>
                    {/* Close button */}
                    <TouchableOpacity
                        style={styles.lightboxClose}
                        onPress={() => setLightboxUri(null)}
                    >
                        <Ionicons name="close" size={26} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Doc type label */}
                    {lightboxLabel ? (
                        <Text style={styles.lightboxLabel}>{lightboxLabel}</Text>
                    ) : null}

                    {/* Zoomable image via ScrollView */}
                    <ScrollView
                        style={styles.lightboxScroll}
                        contentContainerStyle={styles.lightboxContent}
                        maximumZoomScale={4}
                        minimumZoomScale={1}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        centerContent
                        pinchGestureEnabled
                    >
                        {lightboxUri && (
                            <Image
                                source={{ uri: lightboxUri }}
                                style={styles.lightboxImage}
                                resizeMode="contain"
                            />
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={rowStyles.row}>
            <Ionicons name={icon as any} size={16} color={adminColors.textMuted} style={rowStyles.icon} />
            <Text style={rowStyles.label}>{label}</Text>
            <Text style={rowStyles.value} numberOfLines={2}>{value}</Text>
        </View>
    );
}

const rowStyles = StyleSheet.create({
    row:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
    icon:  { marginTop: 2, width: 18 },
    label: { width: 90, fontSize: 13, color: adminColors.textMuted, flexShrink: 0 },
    value: { flex: 1, fontSize: 14, color: adminColors.text, fontWeight: '500' },
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll:    { padding: 16, paddingBottom: 60 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: adminColors.surface,
        borderBottomWidth: 1, borderBottomColor: adminColors.border,
        gap: 10,
    },
    backBtn:       { padding: 4 },
    headerTitle:   { flex: 1, fontSize: 17, fontWeight: '700', color: adminColors.text },
    headerChip:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    headerChipText: { fontSize: 12, fontWeight: '700' },

    // Section
    section: {
        backgroundColor: adminColors.surface,
        borderRadius: 14, borderWidth: 1, borderColor: adminColors.border,
        padding: 16, marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 13, fontWeight: '700', color: adminColors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 14,
    },

    // Docs
    noDocs:     { alignItems: 'center', paddingVertical: 20, gap: 8 },
    noDocsText: { fontSize: 14, color: adminColors.textMuted },
    docGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    },
    docCard: {
        width: (SCREEN_W - 32 - 32 - 10) / 2, // 2 cols, padding 16 each side + gap 10
        backgroundColor: adminColors.backgroundAlt,
        borderRadius: 10, overflow: 'hidden',
        borderWidth: 1, borderColor: adminColors.border,
    },
    docTypeLabel: {
        fontSize: 11, fontWeight: '700', color: adminColors.textSecondary,
        paddingHorizontal: 8, paddingVertical: 6,
        backgroundColor: adminColors.surface,
    },
    docThumb:    { width: '100%', height: 90 },
    docFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 8, paddingVertical: 6,
    },
    docStatusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    docStatusText: { fontSize: 10, fontWeight: '700' },

    // Actions
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 12, marginBottom: 10, gap: 8,
    },
    approveBtn:     { backgroundColor: adminColors.success },
    rejectBtn:      { backgroundColor: adminColors.error },
    actionBtnText:  { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    // Reject box
    rejectBox: {
        backgroundColor: adminColors.backgroundAlt,
        borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: adminColors.border,
    },
    rejectLabel:  { fontSize: 13, fontWeight: '600', color: adminColors.textSecondary, marginBottom: 8 },
    required:     { color: adminColors.error },
    rejectInput: {
        backgroundColor: adminColors.surface,
        borderWidth: 1, borderColor: adminColors.border,
        borderRadius: 8, padding: 10,
        fontSize: 14, color: adminColors.text,
        minHeight: 80,
        marginBottom: 12,
    },
    rejectBtns:        { flexDirection: 'row', gap: 10 },
    rejectCancel: {
        flex: 1, paddingVertical: 11, borderRadius: 8,
        borderWidth: 1, borderColor: adminColors.border,
        alignItems: 'center',
    },
    rejectCancelText:  { fontSize: 14, fontWeight: '600', color: adminColors.textSecondary },
    rejectConfirm: {
        flex: 2, paddingVertical: 11, borderRadius: 8,
        backgroundColor: adminColors.error, alignItems: 'center',
        flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    rejectConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

    // History
    historyBox: {},
    notesRow:   { marginTop: 4 },
    notesLabel: { fontSize: 13, color: adminColors.textMuted, marginBottom: 4 },
    notesValue: { fontSize: 14, color: adminColors.text, lineHeight: 20 },

    // Toast
    toast: {
        position: 'absolute', bottom: 40, alignSelf: 'center',
        backgroundColor: adminColors.success,
        paddingHorizontal: 24, paddingVertical: 12,
        borderRadius: 24, elevation: 10,
    },
    toastText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

    // Lightbox
    lightbox: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.94)',
        justifyContent: 'center',
    },
    lightboxClose: {
        position: 'absolute', top: 52, right: 20, zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20, padding: 8,
    },
    lightboxLabel: {
        position: 'absolute', top: 56, left: 20, zIndex: 10,
        fontSize: 14, fontWeight: '600', color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10,
    },
    lightboxScroll:  { flex: 1 },
    lightboxContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    lightboxImage:   { width: SCREEN_W, height: SCREEN_H * 0.8 },
});
