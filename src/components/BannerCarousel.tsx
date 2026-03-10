import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    useWindowDimensions,
    TouchableOpacity,
    NativeSyntheticEvent,
    NativeScrollEvent,
    ImageBackground,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/theme';

export interface BannerItem {
    id: string;
    title: string;
    subtitle: string;
    image?: any;
    ctaText?: string;
    backgroundColor: string;
}

interface BannerCarouselProps {
    banners: BannerItem[];
    autoPlayInterval?: number;
    onBannerPress?: (banner: BannerItem) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
    banners,
    autoPlayInterval = 3500,
    onBannerPress,
}) => {
    const { width: screenWidth } = useWindowDimensions();
    const CARD_MARGIN = spacing.lg;
    const CARD_WIDTH = screenWidth - CARD_MARGIN * 2;
    const BANNER_HEIGHT = 200;

    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isInteracting = useRef(false);

    // Auto-play logic
    useEffect(() => {
        if (isInteracting.current) return;
        const nextIndex = (activeIndex + 1) % banners.length;
        timerRef.current = setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setActiveIndex(nextIndex);
        }, autoPlayInterval);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [activeIndex, autoPlayInterval, banners.length]);

    const onScrollBeginDrag = () => {
        isInteracting.current = true;
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.x;
        const index = Math.round(offset / screenWidth);
        if (index !== activeIndex) setActiveIndex(index);
        isInteracting.current = false;
    };

    const onScrollFailed = (info: { index: number }) => {
        flatListRef.current?.scrollToOffset({ offset: info.index * screenWidth, animated: true });
    };

    const renderItem = ({ item }: { item: BannerItem }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onBannerPress?.(item)}
            style={[styles.itemContainer, { width: screenWidth }]}
        >
            {item.image ? (
                <ImageBackground
                    source={item.image}
                    style={[styles.card, { width: CARD_WIDTH, height: BANNER_HEIGHT, marginHorizontal: CARD_MARGIN }]}
                    imageStyle={styles.cardImage}
                >
                    <View style={styles.imageOverlay} />
                </ImageBackground>
            ) : (
                <View style={[styles.card, { backgroundColor: item.backgroundColor, width: CARD_WIDTH, height: BANNER_HEIGHT, marginHorizontal: CARD_MARGIN }]}>
                    <View style={styles.imageOverlay} />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={banners}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScrollBeginDrag={onScrollBeginDrag}
                onMomentumScrollEnd={onMomentumScrollEnd}
                onScrollToIndexFailed={onScrollFailed}
                getItemLayout={(_, index) => ({
                    length: screenWidth,
                    offset: screenWidth * index,
                    index,
                })}
                snapToInterval={screenWidth}
                decelerationRate="fast"
                bounces={false}
            />
            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {banners.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === activeIndex ? styles.activeDot : styles.inactiveDot,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    itemContainer: {
        alignItems: 'center',
    },
    card: {
        borderRadius: 18,
        overflow: 'hidden',
        flexDirection: 'row',
        position: 'relative',
    },
    cardImage: {
        borderRadius: 18,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 18,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.sm + 2,
        gap: 6,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    activeDot: {
        width: 24,
        backgroundColor: colors.primary,
    },
    inactiveDot: {
        width: 8,
        backgroundColor: colors.textMuted,
        opacity: 0.25,
    },
});
