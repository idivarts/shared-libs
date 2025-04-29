import React from 'react';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MARGIN, getOrder, getPosition } from '@/utils/drag-component';

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

  useAnimatedReaction(
    () => positions.value[id],
    newOrder => {
      const newPositions = getPosition(newOrder);
      translateX.value = withTiming(newPositions.x);
      translateY.value = withTiming(newPositions.y);
    }
  );

  const panGesture = useAnimatedGestureHandler({
    onStart: (_, ctx: { startX: number; startY: number }) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
      isGestureActive.value = true;
    },
    onActive: (evt, ctx) => {
      translateX.value = ctx.startX + evt.translationX;
      translateY.value = ctx.startY + evt.translationY;

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
    },
    onEnd: () => {
      const destination = getPosition(positions.value[id]);
      translateX.value = withTiming(destination.x);
      translateY.value = withTiming(destination.y);
      isGestureActive.value = false;
    },
    onFinish: () => {
      if (onPositionsUpdate) {
        runOnJS(onPositionsUpdate)(positions.value);
      }
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
      <PanGestureHandler onGestureEvent={panGesture}>
        <Animated.View>{children}</Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

export default Draggable;
