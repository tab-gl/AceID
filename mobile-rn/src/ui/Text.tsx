import React from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { TYPE, type TypeVariant } from '@/design-system/tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  align?: TextStyle['textAlign'];
}

/** Text in the Ace ID type scale. Colour defaults to the theme's content colour. */
export function AppText({ variant = 'body', color, style, align, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      allowFontScaling
      maxFontSizeMultiplier={1.5}
      style={[TYPE[variant], { color: color ?? colors.content }, align ? { textAlign: align } : null, style]}
    />
  );
}
