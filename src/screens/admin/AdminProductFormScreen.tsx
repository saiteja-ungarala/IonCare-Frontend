import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { adminColors } from '../../theme/adminTheme';
import {
    createProduct, updateProduct,
    createCategory, updateCategory,
    createBrand, updateBrand,
    createService, updateService,
    getAdminCategories, getAdminBrands,
} from '../../services/adminService';

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemType = 'product' | 'category' | 'brand' | 'service';

type AdminProductFormRouteProp = RouteProp<{
    AdminProductForm: { mode: 'create' | 'edit'; type: ItemType; id?: number; item?: any };
}, 'AdminProductForm'>;

type AdminProductFormNavProp = NativeStackNavigationProp<any>;

// ─── Slug helper ──────────────────────────────────────────────────────────────

function toSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Dropdown component ───────────────────────────────────────────────────────

interface DropdownOption { id: number; label: string }

function Dropdown({
    label,
    value,
    options,
    placeholder,
    onChange,
}: {
    label: string;
    value: number | null;
    options: DropdownOption[];
    placeholder: string;
    onChange: (id: number | null) => void;
}) {
    const [visible, setVisible] = useState(false);
    const selected = options.find((o) => o.id === value);

    return (
        <View style={formStyles.field}>
            <Text style={formStyles.label}>{label}</Text>
            <TouchableOpacity
                style={formStyles.dropdownBtn}
                onPress={() => setVisible(true)}
            >
                <Text style={[formStyles.dropdownText, !selected && { color: adminColors.textMuted }]}>
                    {selected?.label ?? placeholder}
                </Text>
                <Ionicons name="chevron-down" size={16} color={adminColors.textMuted} />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade">
                <TouchableOpacity
                    style={formStyles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={formStyles.modalSheet}>
                        <View style={formStyles.modalHeader}>
                            <Text style={formStyles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Ionicons name="close" size={22} color={adminColors.text} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={formStyles.optionRow}
                            onPress={() => { onChange(null); setVisible(false); }}
                        >
                            <Text style={[formStyles.optionText, { color: adminColors.textMuted }]}>
                                — None —
                            </Text>
                        </TouchableOpacity>
                        <FlatList
                            data={options}
                            keyExtractor={(o) => String(o.id)}
                            renderItem={({ item: opt }) => (
                                <TouchableOpacity
                                    style={[
                                        formStyles.optionRow,
                                        opt.id === value && formStyles.optionRowSelected,
                                    ]}
                                    onPress={() => { onChange(opt.id); setVisible(false); }}
                                >
                                    <Text style={[
                                        formStyles.optionText,
                                        opt.id === value && { color: adminColors.accent, fontWeight: '700' },
                                    ]}>
                                        {opt.label}
                                    </Text>
                                    {opt.id === value && (
                                        <Ionicons name="checkmark" size={18} color={adminColors.accent} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
    label,
    value,
    onChange,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric' | 'decimal-pad';
    multiline?: boolean;
    required?: boolean;
}) {
    return (
        <View style={formStyles.field}>
            <Text style={formStyles.label}>
                {label}{required && <Text style={{ color: adminColors.error }}> *</Text>}
            </Text>
            <TextInput
                style={[formStyles.input, multiline && formStyles.inputMultiline]}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder ?? label}
                placeholderTextColor={adminColors.textMuted}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? 3 : 1}
                autoCorrect={false}
            />
        </View>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(() => {
        setVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setVisible(false), 1800);
    }, []);

    const Toast = visible ? (
        <View style={toastStyles.toast}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={toastStyles.toastText}>Saved!</Text>
        </View>
    ) : null;

    return { show, Toast };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminProductFormScreen() {
    const navigation = useNavigation<AdminProductFormNavProp>();
    const route      = useRoute<AdminProductFormRouteProp>();
    const { mode, type, item } = route.params;

    const isEdit = mode === 'edit';
    const { show: showToast, Toast } = useToast();

    // ── Dropdown options ──
    const [categories, setCategories] = useState<DropdownOption[]>([]);
    const [brands,     setBrands]     = useState<DropdownOption[]>([]);
    const [loadingOpts, setLoadingOpts] = useState(false);

    // ── Form state ──
    const [name,            setName]            = useState(item?.name ?? '');
    const [description,     setDescription]     = useState(item?.description ?? '');
    const [slug,            setSlug]            = useState(item?.slug ?? '');
    const [slugManual,      setSlugManual]       = useState(isEdit);
    const [categoryId,      setCategoryId]       = useState<number | null>(item?.category_id ?? null);
    const [brandId,         setBrandId]          = useState<number | null>(item?.brand_id ?? null);
    const [parentId,        setParentId]         = useState<number | null>(item?.parent_id ?? null);
    const [price,           setPrice]            = useState(item?.price != null ? String(item.price) : '');
    const [mrp,             setMrp]              = useState(item?.mrp != null ? String(item.mrp) : '');
    const [stockQty,        setStockQty]         = useState(item?.stock_qty != null ? String(item.stock_qty) : '');
    const [sku,             setSku]              = useState(item?.sku ?? '');
    const [imageUrl,        setImageUrl]         = useState(item?.image_url ?? '');
    const [logoUrl,         setLogoUrl]          = useState(item?.logo_url ?? '');
    const [iconKey,         setIconKey]          = useState(item?.icon_key ?? '');
    const [sortOrder,       setSortOrder]        = useState(item?.sort_order != null ? String(item.sort_order) : '0');
    const [basePrice,       setBasePrice]        = useState(item?.base_price != null ? String(item.base_price) : '');
    const [durationMinutes, setDurationMinutes]  = useState(item?.duration_minutes != null ? String(item.duration_minutes) : '');
    const [category,        setCategory]         = useState(item?.category ?? '');
    const [saving,          setSaving]           = useState(false);

    // Auto-generate slug from name
    useEffect(() => {
        if (!slugManual && name) setSlug(toSlug(name));
    }, [name, slugManual]);

    // Load dropdown options
    useEffect(() => {
        if (type !== 'product' && type !== 'category') return;
        setLoadingOpts(true);
        const promises: Promise<any>[] = [getAdminCategories()];
        if (type === 'product') promises.push(getAdminBrands());

        Promise.all(promises)
            .then(([cats, brnds]) => {
                setCategories((cats ?? []).map((c: any) => ({ id: c.id, label: c.name })));
                if (brnds) setBrands((brnds ?? []).map((b: any) => ({ id: b.id, label: b.name })));
            })
            .catch(() => {})
            .finally(() => setLoadingOpts(false));
    }, [type]);

    const validate = (): string | null => {
        if (!name.trim()) return 'Name is required';
        if (type === 'product'  && !price.trim())     return 'Price is required';
        if (type === 'service'  && !basePrice.trim()) return 'Base price is required';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) { Alert.alert('Validation Error', err); return; }

        setSaving(true);
        try {
            let data: Record<string, any> = {};

            if (type === 'product') {
                data = {
                    name: name.trim(),
                    description: description.trim() || null,
                    category_id: categoryId,
                    brand_id:    brandId,
                    price:       parseFloat(price),
                    mrp:         mrp       ? parseFloat(mrp)       : null,
                    stock_qty:   stockQty  ? parseInt(stockQty)    : 0,
                    sku:         sku.trim() || null,
                    image_url:   imageUrl.trim() || null,
                };
                isEdit ? await updateProduct(item!.id, data) : await createProduct(data);
            }

            if (type === 'category') {
                data = {
                    name:       name.trim(),
                    slug:       slug.trim() || toSlug(name),
                    parent_id:  parentId,
                    icon_key:   iconKey.trim() || null,
                    sort_order: parseInt(sortOrder) || 0,
                };
                isEdit ? await updateCategory(item!.id, data) : await createCategory(data);
            }

            if (type === 'brand') {
                data = {
                    name:     name.trim(),
                    slug:     slug.trim() || toSlug(name),
                    logo_url: logoUrl.trim() || null,
                };
                isEdit ? await updateBrand(item!.id, data) : await createBrand(data);
            }

            if (type === 'service') {
                data = {
                    name:             name.trim(),
                    description:      description.trim() || null,
                    category:         category.trim() || null,
                    base_price:       parseFloat(basePrice),
                    duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
                    image_url:        imageUrl.trim() || null,
                };
                isEdit ? await updateService(item!.id, data) : await createService(data);
            }

            showToast();
            setTimeout(() => navigation.goBack(), 1800);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Save failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const typeTitles: Record<ItemType, string> = {
        product:  'Product',
        category: 'Category',
        brand:    'Brand',
        service:  'Service',
    };

    return (
        <SafeAreaView style={formStyles.safeArea} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={formStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={formStyles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={formStyles.headerTitle}>
                    {isEdit ? 'Edit' : 'New'} {typeTitles[type]}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {loadingOpts ? (
                    <View style={formStyles.centered}>
                        <ActivityIndicator color={adminColors.primary} />
                    </View>
                ) : (
                    <ScrollView
                        style={formStyles.scroll}
                        contentContainerStyle={formStyles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* ── PRODUCT fields ── */}
                        {type === 'product' && (
                            <>
                                <Field label="Name" value={name} onChange={setName} required />
                                <Field label="Description" value={description} onChange={setDescription} multiline placeholder="Optional description" />
                                <Dropdown label="Category" value={categoryId} options={categories} placeholder="Select category" onChange={setCategoryId} />
                                <Dropdown label="Brand"    value={brandId}    options={brands}     placeholder="Select brand"    onChange={setBrandId} />
                                <Field label="Price (₹)"   value={price}    onChange={setPrice}    keyboardType="decimal-pad" required />
                                <Field label="MRP (₹)"     value={mrp}      onChange={setMrp}      keyboardType="decimal-pad" placeholder="Optional MRP" />
                                <Field label="Stock Qty"   value={stockQty} onChange={setStockQty} keyboardType="numeric" placeholder="0" />
                                <Field label="SKU"         value={sku}      onChange={setSku}      placeholder="Optional SKU" />
                                <Field label="Image URL"   value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
                            </>
                        )}

                        {/* ── CATEGORY fields ── */}
                        {type === 'category' && (
                            <>
                                <Field label="Name" value={name} onChange={setName} required />
                                <View style={formStyles.field}>
                                    <Text style={formStyles.label}>Slug</Text>
                                    <TextInput
                                        style={formStyles.input}
                                        value={slug}
                                        onChangeText={(v) => { setSlugManual(true); setSlug(v); }}
                                        placeholder="auto-generated"
                                        placeholderTextColor={adminColors.textMuted}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <Text style={formStyles.hint}>Leave blank to auto-generate from name</Text>
                                </View>
                                <Dropdown
                                    label="Parent Category"
                                    value={parentId}
                                    options={categories.filter((c) => c.id !== item?.id)}
                                    placeholder="None (root)"
                                    onChange={setParentId}
                                />
                                <Field label="Icon Key" value={iconKey}    onChange={setIconKey}    placeholder="e.g. water-outline" />
                                <Field label="Sort Order" value={sortOrder} onChange={setSortOrder} keyboardType="numeric" placeholder="0" />
                            </>
                        )}

                        {/* ── BRAND fields ── */}
                        {type === 'brand' && (
                            <>
                                <Field label="Name" value={name} onChange={setName} required />
                                <View style={formStyles.field}>
                                    <Text style={formStyles.label}>Slug</Text>
                                    <TextInput
                                        style={formStyles.input}
                                        value={slug}
                                        onChangeText={(v) => { setSlugManual(true); setSlug(v); }}
                                        placeholder="auto-generated"
                                        placeholderTextColor={adminColors.textMuted}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <Text style={formStyles.hint}>Leave blank to auto-generate from name</Text>
                                </View>
                                <Field label="Logo URL" value={logoUrl} onChange={setLogoUrl} placeholder="https://..." />
                            </>
                        )}

                        {/* ── SERVICE fields ── */}
                        {type === 'service' && (
                            <>
                                <Field label="Name"        value={name}            onChange={setName}            required />
                                <Field label="Description" value={description}      onChange={setDescription}      multiline placeholder="Optional description" />
                                <Field label="Category"    value={category}         onChange={setCategory}         placeholder="e.g. water_purifier" />
                                <Field label="Base Price (₹)" value={basePrice}    onChange={setBasePrice}        keyboardType="decimal-pad" required />
                                <Field label="Duration (minutes)" value={durationMinutes} onChange={setDurationMinutes} keyboardType="numeric" placeholder="e.g. 60" />
                                <Field label="Image URL"   value={imageUrl}         onChange={setImageUrl}         placeholder="https://..." />
                            </>
                        )}

                        {/* Save button */}
                        <TouchableOpacity
                            style={[formStyles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={formStyles.saveBtnText}>
                                    {isEdit ? 'Update' : 'Create'} {typeTitles[type]}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                )}
            </KeyboardAvoidingView>

            {Toast}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const formStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: adminColors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
        backgroundColor: adminColors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,
        gap: 12,
    },
    backBtn:     { width: 40, alignItems: 'flex-start' },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },

    scroll:        { flex: 1 },
    scrollContent: { padding: 20 },

    field:   { marginBottom: 16 },
    label:   { fontSize: 13, fontWeight: '600', color: adminColors.textSecondary, marginBottom: 6 },
    hint:    { fontSize: 11, color: adminColors.textMuted, marginTop: 4 },
    input: {
        backgroundColor: adminColors.surface,
        borderWidth: 1,
        borderColor: adminColors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 14,
        color: adminColors.text,
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 11,
    },

    dropdownBtn: {
        backgroundColor: adminColors.surface,
        borderWidth: 1,
        borderColor: adminColors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownText: { fontSize: 14, color: adminColors.text },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: adminColors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: adminColors.border,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: adminColors.text },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: adminColors.border,
    },
    optionRowSelected: { backgroundColor: adminColors.primaryLight },
    optionText: { fontSize: 14, color: adminColors.text },

    saveBtn: {
        backgroundColor: adminColors.accent,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
    },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

const toastStyles = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 48,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#16A34A',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    toastText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
