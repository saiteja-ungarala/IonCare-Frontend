// Payment Methods Screen — Coming Soon

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = { navigation: NativeStackNavigationProp<any> };

export const PaymentMethodsScreen: React.FC<Props> = ({ navigation }) => (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment Methods</Text>
        </View>
        <View style={styles.content}>
            <View style={styles.iconWrap}>
                <Ionicons name="card-outline" size={64} color={colors.primary} />
            </View>
            <Text style={styles.title}>Coming Soon</Text>
            <Text style={styles.subtitle}>We're working on adding payment methods.{'\n'}Stay tuned!</Text>
        </View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, ...shadows.sm },
    backButton: { marginRight: spacing.md },
    headerTitle: { ...typography.h2, fontSize: 20, color: colors.text },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    iconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
