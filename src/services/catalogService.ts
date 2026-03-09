// Catalog Service - Services and Products API
import api from './api';
import { Service, Product } from '../models/types';

// Helper to map backend service to frontend Service type
const mapBackendService = (backendService: any): Service => {
    // Backend uses base_price; frontend expects price
    const price = Number(backendService.base_price) || Number(backendService.price) || 0;
    // Backend uses duration_minutes (number); frontend expects duration (string)
    const mins = backendService.duration_minutes;
    const duration = mins ? `${mins} mins` : (backendService.duration || '45-60 mins');

    return {
        id: String(backendService.id),
        name: backendService.name,
        description: backendService.description || '',
        image: backendService.image_url || backendService.image || 'https://images.unsplash.com/photo-1624958723474-a6e0e9d4e4b0?w=400',
        price,
        duration,
        category: backendService.category || 'water_purifier',
    };
};

// Helper to map backend product to frontend Product type
const mapBackendProduct = (backendProduct: any): Product => {
    return {
        id: String(backendProduct.id),
        name: backendProduct.name,
        description: backendProduct.description || '',
        image: backendProduct.image_url || backendProduct.image || 'https://images.unsplash.com/photo-1624958723474-a6e0e9d4e4b0?w=400',
        price: Number(backendProduct.price) || 0,
        originalPrice: backendProduct.original_price ? Number(backendProduct.original_price) : undefined,
        rating: Number(backendProduct.rating) || 4.0,
        reviewCount: Number(backendProduct.review_count) || 0,
        inStock: backendProduct.in_stock !== false,
        category: backendProduct.category || 'water_purifier',
        features: backendProduct.features || [],
    };
};

export const catalogService = {
    // Get all services
    async getServices(): Promise<Service[]> {
        try {
            const response = await api.get('/services');
            const data = response.data?.data;

            // Handle both array and paginated response formats
            const list = Array.isArray(data) ? data : (data?.list || data?.services || []);
            return list.map(mapBackendService);
        } catch (error: any) {
            console.error('Error fetching services:', error.message);
            return [];
        }
    },

    // Get service by ID
    async getServiceById(id: string): Promise<Service | null> {
        try {
            const response = await api.get(`/services/${id}`);
            const { data } = response.data;
            return mapBackendService(data);
        } catch (error: any) {
            console.error('Error fetching service:', error.message);
            return null;
        }
    },

    // Get all products
    async getProducts(): Promise<Product[]> {
        try {
            const response = await api.get('/products');
            const data = response.data?.data;

            // Handle both array and paginated response formats
            const list = Array.isArray(data) ? data : (data?.list || data?.products || []);
            return list.map(mapBackendProduct);
        } catch (error: any) {
            console.error('Error fetching products:', error.message);
            return [];
        }
    },

    // Get product by ID
    async getProductById(id: string): Promise<Product | null> {
        try {
            const response = await api.get(`/products/${id}`);
            const { data } = response.data;
            return mapBackendProduct(data);
        } catch (error: any) {
            console.error('Error fetching product:', error.message);
            return null;
        }
    },
};
