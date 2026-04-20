// Store Service - API calls for Store section

import api from './api';

// Types
export interface StoreCategory {
    id: number;
    name: string;
    slug: string;
    icon_key: string | null;
    sort_order: number;
    iconKey: string | null;
    sortOrder: number;
}

export interface StoreBrand {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
    logoUrl: string | null;
    banner_url: string | null;
    bannerUrl: string | null;
}

export interface StoreProduct {
    id: number;
    name: string;
    description: string | null;
    price: number;
    mrp: number | null;
    stock_qty: number;
    stockQty: number;
    image_url: string | null;
    image_url_full: string | null;
    image_url1: string | null;
    image_url2: string | null;
    image_url3: string | null;
    image_url4: string | null;
    image_url5: string | null;
    imageUrl: string | null;
    imageUrlFull: string | null;
    imageUrl1: string | null;
    imageUrl2: string | null;
    imageUrl3: string | null;
    imageUrl4: string | null;
    imageUrl5: string | null;
    sku: string | null;
    category: {
        id: number;
        name: string;
        slug: string;
        icon_key?: string | null;
        sort_order?: number;
    };
    brand: {
        id: number;
        name: string;
        slug: string;
        logo_url: string | null;
        logoUrl: string | null;
    };
    created_at: string;
    createdAt: string;
}

export interface ProductsResponse {
    items: StoreProduct[];
    page: number;
    limit: number;
    total: number;
}

export interface ProductQueryParams {
    category_id?: number;
    brand_id?: number;
    search?: string;
    // Legacy filters retained for backward compatibility.
    category?: string;
    q?: string;
    sort?: 'popular' | 'new' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
}

const toNullableString = (value: unknown): string | null => {
    const normalized = String(value ?? '').trim();
    return normalized || null;
};

const mapCategory = (raw: any): StoreCategory => ({
    id: Number(raw.id),
    name: String(raw.name || ''),
    slug: String(raw.slug || ''),
    icon_key: toNullableString(raw.icon_key ?? raw.iconKey),
    sort_order: Number(raw.sort_order ?? raw.sortOrder ?? 0),
    iconKey: toNullableString(raw.icon_key ?? raw.iconKey),
    sortOrder: Number(raw.sort_order ?? raw.sortOrder ?? 0),
});

const mapBrand = (raw: any): StoreBrand => ({
    id: Number(raw.id),
    name: String(raw.name || ''),
    slug: String(raw.slug || ''),
    logo_url: toNullableString(raw.logo_url ?? raw.logoUrl),
    logoUrl: toNullableString(raw.logo_url ?? raw.logoUrl),
    banner_url: toNullableString(raw.banner_url ?? raw.bannerUrl),
    bannerUrl: toNullableString(raw.banner_url ?? raw.bannerUrl),
});

const mapProduct = (raw: any): StoreProduct => {
    const imageUrl1 = toNullableString(raw.image_url1 ?? raw.imageUrl1);
    const imageUrl2 = toNullableString(raw.image_url2 ?? raw.imageUrl2);
    const imageUrl3 = toNullableString(raw.image_url3 ?? raw.imageUrl3);
    const imageUrl4 = toNullableString(raw.image_url4 ?? raw.imageUrl4);
    const imageUrl5 = toNullableString(raw.image_url5 ?? raw.imageUrl5);
    const imageUrlFull = toNullableString(raw.image_url_full ?? raw.imageUrlFull);
    const imageUrlRaw = toNullableString(raw.image_url ?? raw.imageUrl);
    const preferredImage = imageUrl1 || imageUrl2 || imageUrl3 || imageUrl4 || imageUrl5 || imageUrlRaw || imageUrlFull;

    return {
        id: Number(raw.id),
        name: String(raw.name || ''),
        description: toNullableString(raw.description),
        price: Number(raw.price ?? 0),
        mrp: raw.mrp != null ? Number(raw.mrp) : null,
        stock_qty: Number(raw.stock_qty ?? raw.stockQty ?? 0),
        stockQty: Number(raw.stock_qty ?? raw.stockQty ?? 0),
        image_url: imageUrlRaw,
        image_url_full: imageUrlFull,
        image_url1: imageUrl1,
        image_url2: imageUrl2,
        image_url3: imageUrl3,
        image_url4: imageUrl4,
        image_url5: imageUrl5,
        imageUrl: preferredImage,
        imageUrlFull: imageUrlFull,
        imageUrl1: imageUrl1,
        imageUrl2: imageUrl2,
        imageUrl3: imageUrl3,
        imageUrl4: imageUrl4,
        imageUrl5: imageUrl5,
        sku: toNullableString(raw.sku),
        category: {
            id: Number(raw.category?.id ?? 0),
            name: String(raw.category?.name || ''),
            slug: String(raw.category?.slug || ''),
            icon_key: toNullableString(raw.category?.icon_key ?? raw.category?.iconKey),
            sort_order: Number(raw.category?.sort_order ?? raw.category?.sortOrder ?? 0),
        },
        brand: {
            id: Number(raw.brand?.id ?? 0),
            name: String(raw.brand?.name || ''),
            slug: String(raw.brand?.slug || ''),
            logo_url: toNullableString(raw.brand?.logo_url ?? raw.brand?.logoUrl),
            logoUrl: toNullableString(raw.brand?.logo_url ?? raw.brand?.logoUrl),
        },
        created_at: String(raw.created_at ?? raw.createdAt ?? ''),
        createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    };
};

// API Methods
export const storeService = {
    /**
     * Get all active product categories
     */
    async getCategories(): Promise<StoreCategory[]> {
        const response = await api.get('/store/categories');
        const rows = Array.isArray(response.data.data) ? response.data.data : [];
        return rows.map(mapCategory);
    },

    /**
     * Get active brands that have products for a category
     */
    async getBrandsByCategory(categoryId: number): Promise<StoreBrand[]> {
        const response = await api.get(`/store/categories/${categoryId}/brands`);
        const rows = Array.isArray(response.data.data) ? response.data.data : [];
        return rows.map(mapBrand);
    },

    /**
     * Get products with optional filters
     */
    async getProducts(params?: ProductQueryParams): Promise<ProductsResponse> {
        const response = await api.get('/store/products', { params });
        const data = response.data.data || {};
        const items = Array.isArray(data.items) ? data.items.map(mapProduct) : [];

        return {
            items,
            page: Number(data.page || 1),
            limit: Number(data.limit || items.length || 20),
            total: Number(data.total || items.length || 0),
        };
    },

    /**
     * Get a single product by ID
     */
    async getProductById(id: number): Promise<StoreProduct> {
        const response = await api.get(`/store/products/${id}`);
        return mapProduct(response.data.data || {});
    },
};

export default storeService;
