import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const getWebStorage = (): Storage | null => {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
        return null;
    }
};

export const authStorage = {
    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return getWebStorage()?.getItem(key) ?? null;
        }

        return await SecureStore.getItemAsync(key);
    },

    async setItem(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            getWebStorage()?.setItem(key, value);
            return;
        }

        await SecureStore.setItemAsync(key, value);
    },

    async deleteItem(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            getWebStorage()?.removeItem(key);
            return;
        }

        await SecureStore.deleteItemAsync(key);
    },

    async clearItems(keys: readonly string[]): Promise<void> {
        await Promise.all(keys.map((key) => this.deleteItem(key)));
    },
};
