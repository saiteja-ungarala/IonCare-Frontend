export type TechnicianEarningLevel = {
    id: 'silver' | 'gold' | 'platinum' | 'diamond';
    label: string;
    minSales: number;
    commissionPercent: number;
    color: string;
    icon: 'medal' | 'trophy' | 'diamond';
};

export const TECHNICIAN_EARNING_SCHEME: TechnicianEarningLevel[] = [
    { id: 'silver', label: 'Silver', minSales: 10, commissionPercent: 10, color: '#A7B0B9', icon: 'medal' },
    { id: 'gold', label: 'Gold', minSales: 25, commissionPercent: 20, color: '#D4A72C', icon: 'medal' },
    { id: 'platinum', label: 'Platinum', minSales: 50, commissionPercent: 30, color: '#4F8EDC', icon: 'trophy' },
    { id: 'diamond', label: 'Diamond', minSales: 100, commissionPercent: 40, color: '#22B8CF', icon: 'diamond' },
];

export type TechnicianSchemeProgress = {
    currentLevel: TechnicianEarningLevel | null;
    nextLevel: TechnicianEarningLevel | null;
    remainingSales: number;
    normalizedProgress: number;
};

export const getTechnicianSchemeProgress = (salesCount: number): TechnicianSchemeProgress => {
    const safeSales = Math.max(0, Number(salesCount || 0));

    let currentLevel: TechnicianEarningLevel | null = null;
    for (const level of TECHNICIAN_EARNING_SCHEME) {
        if (safeSales >= level.minSales) {
            currentLevel = level;
        }
    }

    const nextLevel = TECHNICIAN_EARNING_SCHEME.find((level) => safeSales < level.minSales) || null;

    if (!currentLevel && nextLevel) {
        return {
            currentLevel: null,
            nextLevel,
            remainingSales: Math.max(0, nextLevel.minSales - safeSales),
            normalizedProgress: Math.min(1, safeSales / Math.max(1, nextLevel.minSales)),
        };
    }

    if (currentLevel && nextLevel) {
        const span = Math.max(1, nextLevel.minSales - currentLevel.minSales);
        const done = safeSales - currentLevel.minSales;
        return {
            currentLevel,
            nextLevel,
            remainingSales: Math.max(0, nextLevel.minSales - safeSales),
            normalizedProgress: Math.min(1, Math.max(0, done / span)),
        };
    }

    return {
        currentLevel: currentLevel || TECHNICIAN_EARNING_SCHEME[TECHNICIAN_EARNING_SCHEME.length - 1],
        nextLevel: null,
        remainingSales: 0,
        normalizedProgress: 1,
    };
};

export const getTechnicianSchemeMotivation = (salesCount: number): string => {
    const progress = getTechnicianSchemeProgress(salesCount);
    if (!progress.nextLevel) {
        return 'Diamond level unlocks elite earnings 💎 You are already at the top with 40% commission.';
    }

    if (!progress.currentLevel) {
        return `You are on your way to ${progress.nextLevel.label.toUpperCase()} 🚀 Sell ${progress.remainingSales} more products to unlock ${progress.nextLevel.commissionPercent}% commission.`;
    }

    return `You are on your way to ${progress.nextLevel.label.toUpperCase()} 🚀 Sell ${progress.remainingSales} more products to unlock ${progress.nextLevel.commissionPercent}% commission.`;
};

