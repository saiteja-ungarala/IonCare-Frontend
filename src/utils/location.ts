import { Alert } from 'react-native';
import * as Location from 'expo-location';
import api from '../services/api';

export interface AddressFields {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
}

/**
 * Shows an explanation alert first, then requests foreground location permission.
 * Returns true if granted.
 */
export async function requestLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
        Alert.alert(
            'Location Access',
            'AquaCare needs your location to find nearby technicians and auto-fill your address.',
            [
                {
                    text: 'Not Now',
                    style: 'cancel',
                    onPress: () => resolve(false),
                },
                {
                    text: 'Continue',
                    onPress: async () => {
                        try {
                            const { status } = await Location.requestForegroundPermissionsAsync();
                            resolve(status === 'granted');
                        } catch {
                            resolve(false);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    });
}

/**
 * Gets the current device location.
 * Returns { latitude, longitude } or null on any error.
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
        const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch {
        return null;
    }
}

/**
 * Calls GET /utils/geocode?lat=&lng= to reverse-geocode coordinates.
 * Returns AddressFields or null on any error.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<AddressFields | null> {
    try {
        const response = await api.get('/utils/geocode', { params: { lat, lng } });
        const data = response.data?.data;
        if (!data) return null;
        return {
            line1: data.line1 || '',
            city: data.city || '',
            state: data.state || '',
            postal_code: data.postal_code || '',
        };
    } catch {
        return null;
    }
}
