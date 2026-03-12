// Service Details Screen — with Address Selection + Booking

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackScreenProps, Address } from '../../models/types';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { Button } from '../../components';
import { profileService } from '../../services/profileService';
import { useBookingsStore } from '../../store';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    const createBooking = useBookingsStore((s) => s.createBooking);

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
            const bookingPrice = newBooking ? (newBooking.totalAmount ?? 0) : service.price;

            if (bookingPrice > 0 && bookingId > 0) {
                // Paid booking — go to payment screen
                navigation.navigate('PaymentScreen', {
                    amount: bookingPrice,
                    entityType: 'booking',
                    entityId: bookingId,
                    description: service.name,
                });
            } else {
                // First Service Free — show success overlay
                setBookingSuccess(true);
                setTimeout(() => navigation.goBack(), 2000);
            }
        } catch (error: any) {
            console.error('[Booking] Error:', error);
            setBookingError(error.message || 'Booking failed. Please try again.');
            setTimeout(() => setBookingError(null), 4000);
        } finally {
            setBooking(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={styles.header}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={getIcon()} size={48} color={colors.primary} />
                        </View>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceDuration}>{service.duration}</Text>
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
                            <Ionicons name="information-circle" size={18} color={colors.info} />
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
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                <Text style={styles.includeText}>Deep cleaning of all filters</Text>
                            </View>
                            <View style={styles.includeItem}>
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                <Text style={styles.includeText}>TDS and water quality check</Text>
                            </View>
                            <View style={styles.includeItem}>
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                <Text style={styles.includeText}>Sanitization of tank</Text>
                            </View>
                            <View style={styles.includeItem}>
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
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
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Booking Success Overlay */}
            {bookingSuccess && (
                <View style={styles.successOverlay}>
                    <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                    <Text style={styles.successTitle}>Booked Successfully! ✅</Text>
                    <Text style={styles.successDesc}>
                        {service.name} scheduled for {selectedTime ? (timeLabels[selectedTime] || selectedTime) : ''} on {selectedDate}
                    </Text>
                </View>
            )}

            {/* Error Banner */}
            {bookingError && (
                <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={20} color={colors.error} />
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
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        {loadingAddresses ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
                        ) : addresses.length === 0 ? (
                            <View style={styles.emptyAddr}>
                                <Ionicons name="location-outline" size={48} color={colors.textLight} />
                                <Text style={styles.emptyAddrText}>No addresses found</Text>
                                <Text style={styles.emptyAddrSub}>Add one from your Profile → Addresses</Text>
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
                                                color={isSelected ? colors.primary : colors.textMuted}
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
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl },
    backButton: { position: 'absolute', top: spacing.md, left: spacing.md, zIndex: 1, padding: spacing.sm },
    headerContent: { alignItems: 'center', paddingTop: spacing.lg },
    iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    serviceName: { ...typography.h2, color: colors.textOnPrimary, textAlign: 'center' },
    serviceDuration: { ...typography.body, color: colors.secondaryLight, marginTop: spacing.xs },
    content: { padding: spacing.md },
    priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.md, marginBottom: spacing.lg },
    priceLabel: { ...typography.bodySmall, color: colors.textSecondary },
    priceValue: { ...typography.h2, color: colors.primary, fontWeight: '700' },
    priceNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    priceNoteText: { ...typography.caption, color: colors.info },
    section: { marginBottom: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    description: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
    includesList: { gap: spacing.sm },
    includeItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    includeText: { ...typography.body, color: colors.text },
    dateList: { gap: spacing.sm },
    dateCard: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
    dateCardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    dateDay: { ...typography.caption, color: colors.textSecondary },
    dateDaySelected: { color: colors.textOnPrimary },
    dateNum: { ...typography.h3, color: colors.text },
    dateNumSelected: { color: colors.textOnPrimary },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    timeSlot: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
    timeSlotSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    timeText: { ...typography.bodySmall, color: colors.text },
    timeTextSelected: { color: colors.textOnPrimary },
    // Address selector
    addressSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
    addressMain: { ...typography.body, fontWeight: '600', color: colors.text },
    addressSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    addressPlaceholder: { ...typography.body, color: colors.textMuted, flex: 1 },
    // Bottom
    bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    bottomTotal: { ...typography.caption, color: colors.textSecondary },
    bottomPrice: { ...typography.h3, color: colors.text, fontWeight: '700' },
    bookButton: { paddingHorizontal: spacing.xl },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    modalTitle: { ...typography.h2, fontSize: 18, color: colors.text },
    emptyAddr: { alignItems: 'center', padding: spacing.xl },
    emptyAddrText: { ...typography.body, color: colors.text, fontWeight: '600', marginTop: spacing.md },
    emptyAddrSub: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    addrItem: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md },
    addrItemSelected: { backgroundColor: colors.primaryLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm },
    addrLabel: { ...typography.body, fontWeight: '700', color: colors.text },
    addrLine: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    addrCity: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    defaultBadge: { backgroundColor: colors.primary + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
    defaultBadgeText: { ...typography.caption, fontSize: 10, color: colors.primary, fontWeight: '700' },
    // Success Overlay
    successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: spacing.xl },
    successTitle: { ...typography.h2, color: colors.success, marginTop: spacing.md, textAlign: 'center' },
    successDesc: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
    // Error Banner
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.error + '15', padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.error + '30' },
    errorBannerText: { ...typography.bodySmall, color: colors.error, flex: 1, fontWeight: '600' },

});
