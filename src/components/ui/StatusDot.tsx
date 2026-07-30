import { View } from 'react-native';

type Props = {
  color: string;
  size?: number;
  // When true, draws a hollow ring instead of a filled dot.
  hollow?: boolean;
};

export function StatusDot({ color, size = 10, hollow = false }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: hollow ? 'transparent' : color,
        borderWidth: hollow ? 2 : 0,
        borderColor: color,
      }}
    />
  );
}
