import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { glass, radii, type GlassLevel, type RadiusToken } from '@/config/theme';

type Props = ViewProps & {
  level?: GlassLevel;
  radius?: RadiusToken;
};

// Translucent glass surface: blur + tint + hairline border. Content (children)
// renders above the blur/tint fills. Padding is supplied by the caller's style.
export function GlassCard({ level = 'panel', radius = 'lg', style, children, ...rest }: Props) {
  const g = glass[level];
  return (
    <View
      {...rest}
      style={[
        styles.wrap,
        { borderRadius: radii[radius], borderColor: g.borderColor, borderWidth: g.borderWidth },
        style,
      ]}
    >
      <BlurView intensity={g.intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: g.backgroundColor }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
});
