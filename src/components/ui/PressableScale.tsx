import { type ReactNode, useMemo } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { animation } from '@/config/theme';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

// Pressable with a quick scale-down feedback (press = 90 ms, informative only).
export function PressableScale({ children, style, scaleTo = 0.96, ...rest }: Props) {
  // useMemo (not useRef.current) keeps a single stable Animated.Value without
  // reading a ref during render.
  const scale = useMemo(() => new Animated.Value(1), []);
  const animateTo = (value: number) =>
    Animated.timing(scale, {
      toValue: value,
      duration: animation.press,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}
