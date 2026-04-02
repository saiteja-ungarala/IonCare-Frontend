// Service Details Screen — with Address Selection + Booking

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackScreenProps, Address } from '../../models/types';
import { spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { Button } from '../../components';
import { profileService } from '../../services/profileService';
import { useBookingsStore } from '../../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { customerColors } from '../../theme/customerTheme';

type ServiceDetailsScreenProps = RootStackScreenProps<'ServiceDetails'>;

export const ServiceDetailsScreen: React.FC<ServiceDetailsScreenProps> = ({
    navigation,
    route,
}) => {
    const { service } = route.params;
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [showAddressPicker, setShowAddressPicker] = useState(false);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [booking, setBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
    const createBooking = useBookingsStore((s) => s.createBooking);

    // When user adds an address and returns, re-open picker with fresh list
    const shouldReopenModal = useRef(false);

    useFocusEffect(
        useCallback(() => {
            if (shouldReopenModal.current) {
                shouldReopenModal.current = false;
                void openAddressPicker();
            }
        }, [])
    );

    // Generate next 5 days
    const dates = Array.from({ length: 5 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date.getDate().toString(),
            fullDate: date.toISOString().split('T')[0],
        };
    });

    const timeSlots = [
        '09:00', '10:00', '11:00', '12:00',
        '14:00', '15:00', '16:00', '17:00',
    ];

    const timeLabels: Record<string, string> = {
        '09:00': '9:00 AM', '10:00': '10:00 AM', '11:00': '11:00 AM', '12:00': '12:00 PM',
        '14:00': '2:00 PM', '15:00': '3:00 PM', '16:00': '4:00 PM', '17:00': '5:00 PM',
    };

    // Fetch addresses when address picker opens
    const openAddressPicker = async () => {
        setShowAddressPicker(true);
        setLoadingAddresses(true);
        try {
            const list = await profileService.getAddresses();
            setAddresses(list);
            // Pre-select default address if none selected
            if (!selectedAddress) {
                const def = list.find((a) => a.is_default);
                if (def) setSelectedAddress(def);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAddresses(false);
        }
    };

    // Get icon based on category
    const getIcon = (): keyof typeof Ionicons.glyphMap => {
        switch (service.category) {
            case 'water_purifier': return 'water';
            case 'ro_plant': return 'filter';
            case 'water_softener': return 'beaker';
            case 'ionizer': return 'flash';
            default: return 'construct';
        }
    };

    const handleBookService = async () => {
        // Validate required fields
        if (!selectedDate || !selectedTime) {
            setBookingError('Please select a date and time for your service');
            setTimeout(() => setBookingError(null), 3000);
            return;
        }
        if (!selectedAddress) {
            setBookingError('Please select a service address');
            setTimeout(() => setBookingError(null), 3000);
            return;
        }

        setBooking(true);
        setBookingError(null);
        try {
            const newBooking = await createBooking({
                service_id: Number(service.id),
                address_id: Number(selectedAddress.id),
                scheduled_date: selectedDate,
                scheduled_time: selectedTime + ':00',
                notes: undefined,
            });

            const bookingId = newBooking ? Number(newBooking.id) : 0;
            setCreatedBookingId(bookingId > 0 ? bookingId : null);

            setBookingSuccess(true);
                // Paid booking — go to payment screen
                setTimeout(() => {
                    if (bookingId > 0) {
                        navigation.replace('BookingDetail', { bookingId });
                        return;
                    }
                    navigation.goBack();
                }, 1800);
                // First Service Free — show success overlay
        } catch (error: any) {
            console.error('[Booking] Error:', error);
            setBookingError(error.message || 'Booking failed. Please try again.');
            setTimeout(() => setBookingError(null), 4000);
        } finally {
            setBooking(false);
        }
    };
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                    colors={[customerColors.primary, customerColors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + spacing.md }]}
                >
                    <Ionicons name={getIcon()} size={120} color="rgba(255,255,255,0.1)" style={styles.headerIconBg} />
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={28} color={customerColors.textOnPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>{service.name}</Text>
                            <Text style={styles.headerSubtitle}>{service.duration} Service</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Content */}
                <View style={styles.content}>
                    {/* Price Card */}
                    <View style={styles.priceCard}>
                        <View>
                            <Text style={styles.priceLabel}>Service Price</Text>
                            <Text style={styles.priceValue}>₹{service.price}</Text>
                        </View>
                        <View style={styles.priceNote}>
                            <Ionicons name="information-circle" size={18} color={customerColors.info} />
                            <Text style={styles.priceNoteText}>Includes all materials</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About this service</Text>
                        <Text style={styles.description}>{service.description}</Text>
                    </View>

                    {/* What's Included */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>What's Included</Text>
                        <View style={styles.includesList}>
                            <View style={styles.includeItem}>
                                <Ionicons name="checkmark-circle" size={20} color={customerColors.success} />
                                <Text style={styles.includeText}>Deep cleaning of all filters</Text>
                            </View>
                            <View style={styles.includeItem}>
                                <Ionicons name="checkmark-circle" size={20} color={customerColors.success} />
                                <Text style={styles.includeText}>TDS and water quality check</Text>
                            </View>
                            <View style={styles.includeItem}>
                                <Ionicons name="checkmark-circle" size={20} color={customerColors.success} />
                                <Text style={styles.includeText}>Sanitization of tank</Text>
                            </View>
                            <View style={styles.includeItem}>
                                <Ionicons name="checkmark-circle" size={20} color={customerColors.success} />
                                <Text style={styles.includeText}>30-day service warranty</Text>
                            </View>
                        </View>
                    </View>

                    {/* Select Date */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Date</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.dateList}
                        >
                            {dates.map((d) => (
                                <TouchableOpacity
                                    key={d.fullDate}
                                    style={[
                                        styles.dateCard,
                                        selectedDate === d.fullDate && styles.dateCardSelected,
                                    ]}
                                    onPress={() => setSelectedDate(d.fullDate)}
                                >
                                    <Text
                                        style={[
                                            styles.dateDay,
                                            selectedDate === d.fullDate && styles.dateDaySelected,
                                        ]}
                                    >
                                        {d.day}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.dateNum,
                                            selectedDate === d.fullDate && styles.dateNumSelected,
                                        ]}
                                    >
                                        {d.date}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Select Time */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Time</Text>
                        <View style={styles.timeGrid}>
                            {timeSlots.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.timeSlot,
                                        selectedTime === time && styles.timeSlotSelected,
                                    ]}
                                    onPress={() => setSelectedTime(time)}
                                >
                                    <Text
                                        style={[
                                            styles.timeText,
                                            selectedTime === time && styles.timeTextSelected,
                                        ]}
                                    >
                                        {timeLabels[time]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Select Address */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Service Address</Text>
                        <TouchableOpacity style={styles.addressSelector} onPress={openAddressPicker}>
                            {selectedAddress ? (
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.addressMain}>{selectedAddress.line1}</Text>
                                    <Text style={styles.addressSub}>
                                        {selectedAddress.city}, {selectedAddress.state} – {selectedAddress.postal_code}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.addressPlaceholder}>Select an address</Text>
                            )}
                            <Ionicons name="chevron-forward" size={20} color={customerColors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Booking Success Overlay */}
            {bookingSuccess && (
                <View style={styles.successOverlay}>
                    <Ionicons name="checkmark-circle" size={64} color={customerColors.success} />
                    <Text style={styles.successTitle}>Booked Successfully! ✅</Text>
                    <Text style={styles.successDesc}>
                        {service.name} scheduled for {selectedTime ? (timeLabels[selectedTime] || selectedTime) : ''} on {selectedDate}
                    </Text>
                    <Text style={styles.successSubtext}>Payment for this booking is currently Cash on Delivery.</Text>
                    {createdBookingId ? (
                        <Text style={styles.successSubtext}>Booking #{createdBookingId} is now ready to track.</Text>
                    ) : null}
                </View>
            )}

            {/* Error Banner */}
            {bookingError && (
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={20} color={customerColors.error} />
                    <Text style={styles.errorBannerText}>{bookingError}</Text>
                </View>
            )}

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.bottomTotal}>Total</Text>
                    <Text style={styles.bottomPrice}>₹{service.price}</Text>
                </View>
                <Button
                    title={booking ? 'Booking...' : 'Book Now'}
                    onPress={handleBookService}
                    style={styles.bookButton}
                    disabled={booking || bookingSuccess}
                />
            </View>

            {/* Address Picker Modal */}
            <Modal visible={showAddressPicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Address</Text>
                            <TouchableOpacity onPress={() => setShowAddressPicker(false)}>
                                <Ionicons name="close" size={24} color={customerColors.text} />
                            </TouchableOpacity>
                        </View>
                        {loadingAddresses ? (
                            <ActivityIndicator size="large" color={customerColors.primary} style={{ marginTop: spacing.xl }} />
                        ) : addresses.length === 0 ? (
                            <View style={styles.emptyAddr}>
                                <Ionicons name="location-outline" size={48} color={customerColors.textLight} />
                                <Text style={styles.emptyAddrText}>No addresses found</Text>
                                <Text style={styles.emptyAddrSub}>Add a delivery address to continue</Text>
                                <TouchableOpacity
                                    style={styles.addAddrBtn}
                                    onPress={() => {
                                        setShowAddressPicker(false);
                                        shouldReopenModal.current = true;
                                        navigation.navigate('AddEditAddress', {});
                                    }}
                                >
                                    <Ionicons name="add-circle-outline" size={18} color={customerColors.textOnPrimary} />
                                    <Text style={styles.addAddrBtnText}>Add Address</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <ScrollView style={{ maxHeight: 400 }}>
                                {addresses.map((addr) => {
                                    const isSelected = selectedAddress?.id === addr.id;
                                    return (
                                        <TouchableOpacity
                                            key={addr.id}
                                            style={[styles.addrItem, isSelected && styles.addrItemSelected]}
                                            onPress={() => {
                                                setSelectedAddress(addr);
                                                setShowAddressPicker(false);
                                            }}
                                        >
                                            <Ionicons
                                                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                                size={22}
                                                color={isSelected ? customerColors.primary : customerColors.textMuted}
                                            />
                                            <View style={{ flex: 1, marginLeft: spacing.sm }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                                                    <Text style={styles.addrLabel}>{addr.label || 'Address'}</Text>
                                                    {addr.is_default && (
                                                        <View style={styles.defaultBadge}>
                                                            <Text style={styles.defaultBadgeText}>Default</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={styles.addrLine}>{addr.line1}</Text>
                                                <Text style={styles.addrCity}>
                                                    {addr.city}, {addr.state} – {addr.postal_code}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                                {/* Always-visible Add Address button */}
                                <TouchableOpacity
                                    style={styles.addMoreAddrBtn}
                                    onPress={() => {
                                        setShowAddressPicker(false);
                                        shouldReopenModal.current = true;
                                        navigation.navigate('AddEditAddress', {});
                                    }}
                                >
                                    <Ionicons name="add-circle-outline" size={18} color={customerColors.primary} />
                                    <Text style={styles.addMoreAddrText}>Add New Address</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
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
    content: { padding: spacing.md },
    priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: customerColors.surface, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.md, marginBottom: spacing.lg },
    priceLabel: { ...typography.bodySmall, color: customerColors.textSecondary },
    priceValue: { ...typography.h2, color: customerColors.primary, fontWeight: '700' },
    priceNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    priceNoteText: { ...typography.caption, color: customerColors.info },
    section: { marginBottom: spacing.lg },
    sectionTitle: { ...typography.h3, color: customerColors.text, marginBottom: spacing.md },
    description: { ...typography.body, color: customerColors.textSecondary, lineHeight: 24 },
    includesList: { gap: spacing.sm },
    includeItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    includeText: { ...typography.body, color: customerColors.text },
    dateList: { gap: spacing.sm },
    dateCard: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: customerColors.surface, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: customerColors.border, marginRight: spacing.sm },
    dateCardSelected: { backgroundColor: customerColors.primary, borderColor: customerColors.primary },
    dateDay: { ...typography.caption, color: customerColors.textSecondary },
    dateDaySelected: { color: customerColors.textOnPrimary },
    dateNum: { ...typography.h3, color: customerColors.text },
    dateNumSelected: { color: customerColors.textOnPrimary },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    timeSlot: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: customerColors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: customerColors.border },
    timeSlotSelected: { backgroundColor: customerColors.primary, borderColor: customerColors.primary },
    timeText: { ...typography.bodySmall, color: customerColors.text },
    timeTextSelected: { color: customerColors.textOnPrimary },
    // Address selector
    addressSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: customerColors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: customerColors.border },
    addressMain: { ...typography.body, fontWeight: '600', color: customerColors.text },
    addressSub: { ...typography.caption, color: customerColors.textSecondary, marginTop: 2 },
    addressPlaceholder: { ...typography.body, color: customerColors.textMuted, flex: 1 },
    // Bottom
    bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: customerColors.surface, borderTopWidth: 1, borderTopColor: customerColors.border },
    bottomTotal: { ...typography.caption, color: customerColors.textSecondary },
    bottomPrice: { ...typography.h3, color: customerColors.text, fontWeight: '700' },
    bookButton: { paddingHorizontal: spacing.xl, backgroundColor: customerColors.primary },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: customerColors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    modalTitle: { ...typography.h2, fontSize: 18, color: customerColors.text },
    emptyAddr: { alignItems: 'center', padding: spacing.xl },
    emptyAddrText: { ...typography.body, color: customerColors.text, fontWeight: '600', marginTop: spacing.md },
    emptyAddrSub: { ...typography.caption, color: customerColors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
    addAddrBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: customerColors.primary, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg },
    addAddrBtnText: { ...typography.body, color: customerColors.textOnPrimary, fontWeight: '700' },
    addMoreAddrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: customerColors.border },
    addMoreAddrText: { ...typography.body, color: customerColors.primary, fontWeight: '600' },
    addrItem: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: customerColors.border, paddingVertical: spacing.md },
    addrItemSelected: { backgroundColor: customerColors.primaryLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm },
    addrLabel: { ...typography.body, fontWeight: '700', color: customerColors.text },
    addrLine: { ...typography.bodySmall, color: customerColors.textSecondary, marginTop: 2 },
    addrCity: { ...typography.caption, color: customerColors.textSecondary, marginTop: 2 },
    defaultBadge: { backgroundColor: customerColors.primary + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
    defaultBadgeText: { ...typography.caption, fontSize: 10, color: customerColors.primary, fontWeight: '700' },
    // Success Overlay
    successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: spacing.xl },
    successTitle: { ...typography.h2, color: customerColors.success, marginTop: spacing.md, textAlign: 'center' },
    successDesc: { ...typography.body, color: customerColors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
    successSubtext: { ...typography.bodySmall, color: customerColors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
    // Error Banner
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: customerColors.error + '15', padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: customerColors.error + '30' },
    errorBannerText: { ...typography.bodySmall, color: customerColors.error, flex: 1, fontWeight: '600' },

});
