import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ICON_ALIASES, ICON_PATHS } from './ace-icon-paths';

interface AceIconProps {
  name: string;
  color: string;
  size?: number;
}

/** The 24dp outline icon set shared with the web and Android clients. */
export function AceIcon({ name, color, size = 24 }: AceIconProps) {
  const key = ICON_PATHS[name] ? name : ICON_ALIASES[name];
  const d = key ? ICON_PATHS[key] : undefined;
  if (!d) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      <Path d={d} stroke={color} strokeWidth={1.8} strokeLinecap="square" strokeLinejoin="miter" />
    </Svg>
  );
}
