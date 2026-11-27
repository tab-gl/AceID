import React from 'react';
import type { KeyboardTypeOptions } from 'react-native';
import { Input as BeuiInput } from '@/components/input';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './Text';

/** A labelled input powered by beUI Native Input. */
export function TextField({
  label,
  value,
  onChangeText,
  prefix,
  keyboardType,
  autoCapitalize = 'sentences',
  autoComplete,
  placeholder,
  editable = true,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  prefix?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'off' | 'email' | 'name' | 'username';
  placeholder?: string;
  editable?: boolean;
  error?: string | boolean;
}) {
  const { colors } = useTheme();
  return (
    <BeuiInput
      label={label}
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete}
      autoCorrect={false}
      disabled={!editable}
      error={error}
      leftIcon={
        prefix ? (
          <AppText variant="titleMedium" color={colors.muted}>
            {prefix}
          </AppText>
        ) : undefined
      }
    />
  );
}
