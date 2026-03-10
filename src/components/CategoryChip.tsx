// CategoryChip Component - Horizontal scrollable category selector
// Premium design with proper spacing

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme/theme';

export interface CategoryItem {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface CategoryChipProps {
    categories: CategoryItem[];
    selectedId?: string;
    onSelect: (id: string) => void;
    customColors?: any;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
    categories,
    selectedId,
    onSelect,
    customColors,
}) => {
    const theme = customColors || colors;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {categories.map((category) => {
                const isSelected = category.id === selectedId;
                return (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.chip,
                            { backgroundColor: theme.surface2, borderColor: theme.border },
                            isSelected && {
                                backgroundColor: theme.primary,
                                borderColor: theme.primary,
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.3,
                                shadowRadius: 6,
                                elevation: 4,
                            },
                        ]}
                        onPress={() => onSelect(category.id)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={category.icon}
                            size={16}
                            color={isSelected ? theme.textOnPrimary : theme.textSecondary}
                        />
                        <Text
                            style={[
                                styles.chipText,
                                { color: theme.textSecondary },
                                isSelected && { color: theme.textOnPrimary },
                            ]}
                            numberOfLines={1}
                        >
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 80,
        paddingHorizontal: spacing.md + 2,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs + 2,
    },
    chipText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
});
