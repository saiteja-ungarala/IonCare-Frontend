// Type definitions for the Water Services App

export type UserRole = 'customer' | 'agent' | 'dealer';

export interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: UserRole;
    avatar?: string;
    address?: Address;
    referralCode?: string;
    referredBy?: string;
    createdAt: string;
}

export interface Address {
    id: string;
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    is_default: boolean;
}

export interface Service {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
    duration: string;
    category: ServiceCategory;
}

export type ServiceCategory =
    | 'water_purifier'
    | 'ro_plant'
    | 'water_softener'
    | 'ionizer';

export interface Product {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewCount: number;
    inStock: boolean;
    category: ProductCategory;
    features: string[];
}

export type ProductCategory =
    | 'water_purifier'
    | 'water_softener'
    | 'water_ionizer';

export interface CartItem {
    id: string;
    type: 'product' | 'service';
    product?: Product;
    service?: Service;
    bookingDate?: string;
    bookingTime?: string;
    quantity: number;
}

export interface Booking {
    id: string;
    service: Service;
    status: BookingStatus;
    scheduledDate: string;
    scheduledTime: string;
    address: Address;
    agent?: Agent;
    totalAmount: number;
    createdAt: string;
    completedAt?: string;
}

export type BookingUpdateType = 'arrived' | 'diagnosed' | 'in_progress' | 'completed' | 'photo' | 'note';

export interface BookingUpdate {
    id: number;
    booking_id: number;
    agent_id: number;
    update_type: BookingUpdateType;
    note: string | null;
    media_url: string | null;
    created_at: string;
}

export type BookingStatus =
    | 'pending'
    | 'confirmed'
    | 'agent_assigned'
    | 'on_the_way'
    | 'in_progress'
    | 'completed'
    | 'cancelled';

export type AgentVerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected';
export type AgentKycDocType = 'aadhaar' | 'pan' | 'driving_license' | 'selfie' | 'other';
export type DealerVerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected';
export type DealerKycDocType = 'gst_certificate' | 'shop_license' | 'pan' | 'aadhaar' | 'bank_proof' | 'selfie' | 'other';

export interface Agent {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
    rating: number;
    totalJobs: number;
}

export interface AgentProfile {
    user_id: string;
    full_name: string;
    phone: string | null;
    verification_status: AgentVerificationStatus | string;
    is_online: boolean;
    service_radius_km: number;
    base_lat: number | null;
    base_lng: number | null;
    last_online_at: string | null;
}

export interface AgentKycDocument {
    id: number;
    doc_type: AgentKycDocType | string;
    file_url: string;
    status: string;
    review_notes?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
}

export interface AgentKycSummary {
    verification_status: AgentVerificationStatus | string;
    latest_document: AgentKycDocument | null;
    counts: Record<string, number>;
}

export interface AgentMePayload {
    profile: AgentProfile;
    kyc: AgentKycSummary;
}

export interface DealerProfile {
    user_id: string;
    full_name: string;
    phone: string | null;
    verification_status: DealerVerificationStatus | string;
    business_name: string | null;
    gst_number: string | null;
    address_text: string | null;
    base_lat: number | null;
    base_lng: number | null;
}

export interface DealerKycDocument {
    id: number;
    doc_type: string;
    file_url: string;
    status: string;
    review_notes?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
}

export interface DealerKycDocSummary {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalCount: number;
    lastReviewNotes?: string | null;
}

export interface DealerPricingProduct {
    product_id: number;
    name: string;
    image_url?: string | null;
    mrp_price: number;
    dealer_price: number;
    margin_type: 'flat' | 'percent' | null;
    margin_value: number | null;
    is_active: boolean;
    margin_display: string;
    earning_preview: number | null;
}

export interface AgentJob {
    id: string;
    user_id: number;
    service_id: number;
    address_id: number | null;
    scheduled_date: string;
    scheduled_time: string;
    status: BookingStatus | 'assigned';
    price: number;
    notes: string | null;
    created_at: string;
    service_name: string;
    service_image: string | null;
    service_category: string | null;
    duration_minutes: number | null;
    address_line1: string | null;
    address_line2: string | null;
    address_city: string | null;
    address_state: string | null;
    address_postal_code: string | null;
    address_latitude: number | null;
    address_longitude: number | null;
    customer_name: string | null;
    customer_phone: string | null;
    distance_km: number | null;
}

export interface AgentJobsMeta {
    distance_filter_applied: boolean;
    note?: string;
    base_lat?: number;
    base_lng?: number;
    service_radius_km?: number;
}

export interface AgentEarnSummary {
    totalsPending: number;
    totalsApproved: number;
    totalsPaid: number;
    bonusPending: number;
    bonusPaid: number;
}

export interface AgentCampaignTier {
    thresholdQty: number;
    bonusAmount: number;
}

export interface AgentCampaign {
    id: number;
    name: string;
    description?: string;
    startAt: string;
    endAt: string;
    tiers: AgentCampaignTier[];
}

export interface AgentEarnProgress {
    soldQty: number;
    nextThreshold: number | null;
    remainingToNextThreshold: number;
    bonusesEarned: number;
    tiersReached: AgentCampaignTier[];
}

export interface AgentProductCommissionPreview {
    id: number;
    name: string;
    price: number;
    commissionType: 'flat' | 'percent' | null;
    commissionValue: number | null;
    commissionAmount: number | null;
    campaignId: number | null;
}

export interface ServiceRequest {
    id: string;
    booking: Booking;
    customerName: string;
    customerPhone: string;
    distance: string;
    estimatedEarning: number;
}

export interface WalletTransaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: string;
    source: 'referral' | 'booking' | 'refund' | 'withdrawal';
}

export interface Wallet {
    balance: number;
    transactions: WalletTransaction[];
}

export interface Order {
    id: string;
    items: CartItem[];
    status: OrderStatus;
    totalAmount: number;
    address: Address;
    createdAt: string;
    deliveredAt?: string;
}

export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

export interface Commission {
    id: string;
    orderId: string;
    amount: number;
    type: 'product_sale' | 'service_referral';
    status: 'pending' | 'paid';
    date: string;
}

// Auth types
export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    selectedRole: UserRole | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
    role: UserRole;
}

export interface SignupData {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    referralCode?: string;
}

// Navigation Types
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
    RoleSelection: undefined;
    Login: undefined;
    Signup: undefined;
    ForgotPassword: undefined;
    OTPVerification: { phone: string };
    PaymentScreen: { amount: number; entityType: 'booking' | 'order'; entityId: number; description: string };
    BookingDetail: { bookingId: number };
    BookingUpdate: { bookingId: number };
    CustomerTabs: undefined;
    Search: undefined;
    ServiceDetails: { service: Service };
    ProductDetails: { productId: number };
    Cart: undefined;
    Bookings: undefined;
    Wallet: undefined;
    Profile: undefined;
    OrderHistory: { enableBack?: boolean } | undefined;
    OrderDetails: { orderId: number };
    EditProfile: undefined;
    Addresses: undefined;
    AddEditAddress: { address?: Address };
    PaymentMethods: undefined;
    Notifications: undefined;
    HelpFAQ: undefined;
    ContactUs: undefined;
    Terms: undefined;
    Privacy: undefined;
    AgentEntry: undefined;
    AgentKycUpload: undefined;
    AgentKycPending: undefined;
    AgentTabs: undefined;
    AgentJobs: undefined;
    AgentActiveJob: undefined;
    AgentEarn: undefined;
    AgentHistory: undefined;
    AgentProfile: undefined;
    AgentCampaignMilestones: { campaignId: number };
    DealerEntry: undefined;
    DealerKycUpload: undefined;
    DealerKycPending: undefined;
    DealerTabs: undefined;
    DealerPricing: undefined;
    DealerProfile: undefined;
    DealerOrders: undefined;
    DealerComingSoon: undefined;
    // Store navigation
    StoreHome: undefined;
    StoreBrands: { categoryId: number; categoryName: string };
    ProductListing: { categoryId: number; brandId: number; categoryName?: string; brandName?: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
