// AppBar Component - Top navigation bar with location and actions
// Premium, spacious header with large touch targets

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme/theme';

interface AppBarProps {
    location?: string;
    onLocationPress?: () => void;
    onNotificationPress?: () => void;
    onCartPress?: () => void;
    onProfilePress?: () => void;
    notificationCount?: number;
    cartCount?: number;
    customColors?: any;
}

export const AppBar: React.FC<AppBarProps> = ({
    location = 'Select Location',
    onLocationPress,
    onNotificationPress,
    onCartPress,
    onProfilePress,
    notificationCount = 0,
    cartCount = 0,
    customColors,
}) => {
    const theme = customColors || colors;

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            {/* Location Selector */}
            <TouchableOpacity style={styles.locationButton} onPress={onLocationPress} activeOpacity={0.7}>
                <View style={[styles.locationIcon, { backgroundColor: theme.primaryLight || theme.primary + '15' }]}>
                    <Ionicons name="location" size={20} color={theme.primary} />
                </View>
                <View style={styles.locationTextContainer}>
                    <Text style={[styles.locationLabel, { color: theme.textMuted }]}>DELIVER TO</Text>
                    <View style={styles.locationRow}>
                        <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
                            {location}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={theme.textSecondary} style={{ marginLeft: 4 }} />
                    </View>
                </View>
            </TouchableOpacity>

            {/* Actions */}
            <View style={styles.actions}>
                {/* Profile */}
                {onProfilePress && (
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: theme.primaryLight || theme.primary + '12' }]}
                        onPress={onProfilePress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-circle" size={24} color={theme.primary} />
                    </TouchableOpacity>
                )}

                {/* Notifications */}
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.primaryLight || theme.primary + '12' }]}
                    onPress={onNotificationPress}
                    activeOpacity={0.7}
                >
                    <Ionicons name="notifications-outline" size={22} color={theme.primary} />
                    {notificationCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.error }]}>
                            <Text style={styles.badgeText}>
                                {notificationCount > 9 ? '9+' : notificationCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Cart */}
                {onCartPress && (
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: theme.primaryLight || theme.primary + '12' }]}
                        onPress={onCartPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="cart-outline" size={22} color={theme.primary} />
                        {cartCount > 0 && (
                            <View style={[styles.badge, { backgroundColor: theme.error }]}>
                                <Text style={styles.badgeText}>
                                    {cartCount > 9 ? '9+' : cartCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 4,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        maxWidth: '58%',
        marginRight: spacing.md,
        paddingVertical: spacing.xs,
        minHeight: 48,
    },
    locationIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    locationTextContainer: {
        flex: 1,
        flexShrink: 1,
    },
    locationLabel: {
        fontSize: 10,
        color: colors.textMuted,
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '700',
        flexShrink: 1,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.error,
        borderRadius: borderRadius.full,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '700',
    },
});
