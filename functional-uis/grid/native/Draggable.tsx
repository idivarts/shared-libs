import { MARGIN, getOrder, getPosition } from '@/shared-libs/utils/drag-component';
import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface DraggableProps {
    children: React.ReactNode;
    positions: { value: Record<string, number> };
    id: number;
    onPositionsUpdate?: (updatedPositions: Record<string, number>) => void;
}

const Draggable: React.FC<DraggableProps> = ({
    children,
    positions,
    id,
    onPositionsUpdate,
}) => {
    const position = getPosition(Number(positions.value[id]));
    const translateX = useSharedValue(position.x);
    const translateY = useSharedValue(position.y);
    const isGestureActive = useSharedValue(false);
    const startX = useSharedValue(0);
    const startY = useSharedValue(0);

    useAnimatedReaction(
        () => positions.value[id],
        newOrder => {
            const newPositions = getPosition(newOrder);
            translateX.value = withTiming(newPositions.x);
            translateY.value = withTiming(newPositions.y);
        }
    );

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            startX.value = translateX.value;
            startY.value = translateY.value;
            isGestureActive.value = true;
        })
        .onUpdate((evt) => {
            translateX.value = startX.value + evt.translationX;
            translateY.value = startY.value + evt.translationY;

            const oldOrder = positions.value[id];
            const newOrder = getOrder(translateX.value, translateY.value);

            if (oldOrder !== newOrder) {
                const idToSwap = Object.keys(positions.value).find(
                    key => positions.value[key] === newOrder
                );

                if (idToSwap) {
                    const newPositions = { ...positions.value };
                    newPositions[id] = newOrder;
                    newPositions[idToSwap] = oldOrder;
                    positions.value = newPositions;
                }
            }
        })
        .onEnd(() => {
            const destination = getPosition(positions.value[id]);
            translateX.value = withTiming(destination.x);
            translateY.value = withTiming(destination.y);
            isGestureActive.value = false;
        })
        .onFinalize(() => {
            if (onPositionsUpdate) {
                runOnJS(onPositionsUpdate)(positions.value);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const zIndex = isGestureActive.value ? 1000 : 1;
        const scale = isGestureActive.value ? 1.01 : 1;
        return {
            position: 'absolute',
            margin: MARGIN,
            zIndex,
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale },
            ],
        };
    });

    return (
        <Animated.View style={animatedStyle}>
            <GestureDetector gesture={panGesture}>
                <Animated.View>{children}</Animated.View>
            </GestureDetector>
        </Animated.View>
    );
};

export default Draggable;
