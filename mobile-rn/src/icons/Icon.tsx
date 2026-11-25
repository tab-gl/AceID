import React from 'react';
import type { ComponentType } from 'react';
import {
  AltArrowRightIcon as LAltArrowRight,
  ArrowRightIcon as LArrowRight,
  BellIcon as LBell,
  CheckCircleIcon as LCheckCircle,
  CloseCircleIcon as LCloseCircle,
  CloudCheckIcon as LCloudCheck,
  DangerTriangleIcon as LDangerTriangle,
  FingerprintIcon as LFingerprint,
  GlobalIcon as LGlobal,
  HistoryIcon as LHistory,
  HomeIcon as LHome,
  KeyIcon as LKey,
  LetterIcon as LLetter,
  LinkMinimalisticIcon as LLinkMinimalistic,
  LogoutIcon as LLogout,
  MonitorIcon as LMonitor,
  MoonIcon as LMoon,
  PenIcon as LPen,
  RefreshIcon as LRefresh,
  SettingsIcon as LSettings,
  ShieldCheckIcon as LShieldCheck,
  ShieldIcon as LShield,
  ShieldKeyholeIcon as LShieldKeyhole,
  SmartphoneIcon as LSmartphone,
  SquareArrowRightUpIcon as LExternal,
  SunIcon as LSun,
  TrashBinMinimalisticIcon as LTrash,
  UnlinkIcon as LUnlink,
  UserCircleIcon as LUserCircle,
  UserIdIcon as LUserId,
  VerifiedCheckIcon as LVerified,
} from '@solar-icons/react-native/linear';
import {
  AltArrowRightIcon as BAltArrowRight,
  BellIcon as BBell,
  CheckCircleIcon as BCheckCircle,
  CloseCircleIcon as BCloseCircle,
  DangerTriangleIcon as BDangerTriangle,
  FingerprintIcon as BFingerprint,
  HistoryIcon as BHistory,
  HomeIcon as BHome,
  KeyIcon as BKey,
  LinkMinimalisticIcon as BLinkMinimalistic,
  LogoutIcon as BLogout,
  MonitorIcon as BMonitor,
  MoonIcon as BMoon,
  ShieldCheckIcon as BShieldCheck,
  ShieldIcon as BShield,
  SunIcon as BSun,
  UserCircleIcon as BUserCircle,
  VerifiedCheckIcon as BVerified,
} from '@solar-icons/react-native/bold';

// Semantic names keep screens independent of the icon library. Solar Linear
// is the resting style; Solar Bold is used for the active or confirmed state.
const LINEAR = {
  home: LHome,
  shield: LShield,
  shieldCheck: LShieldCheck,
  shieldKeyhole: LShieldKeyhole,
  link: LLinkMinimalistic,
  unlink: LUnlink,
  user: LUserCircle,
  userId: LUserId,
  key: LKey,
  fingerprint: LFingerprint,
  monitor: LMonitor,
  smartphone: LSmartphone,
  history: LHistory,
  logout: LLogout,
  edit: LPen,
  refresh: LRefresh,
  close: LCloseCircle,
  arrow: LArrowRight,
  chevron: LAltArrowRight,
  moon: LMoon,
  sun: LSun,
  check: LCheckCircle,
  alert: LDangerTriangle,
  verified: LVerified,
  cloud: LCloudCheck,
  globe: LGlobal,
  mail: LLetter,
  settings: LSettings,
  external: LExternal,
  trash: LTrash,
  bell: LBell,
} as const;

const BOLD: Partial<Record<keyof typeof LINEAR, ComponentType<IconProps>>> = {
  home: BHome,
  shield: BShield,
  shieldCheck: BShieldCheck,
  link: BLinkMinimalistic,
  user: BUserCircle,
  key: BKey,
  fingerprint: BFingerprint,
  monitor: BMonitor,
  history: BHistory,
  logout: BLogout,
  moon: BMoon,
  sun: BSun,
  check: BCheckCircle,
  alert: BDangerTriangle,
  verified: BVerified,
  close: BCloseCircle,
  chevron: BAltArrowRight,
  arrow: BAltArrowRight,
  bell: BBell,
};

export type IconName = keyof typeof LINEAR;

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 22,
  color,
  active = false,
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  color: string;
  /** Selects the Bold variant where one exists. */
  active?: boolean;
  strokeWidth?: number;
}) {
  const Bold = active ? BOLD[name] : undefined;
  const Glyph = (Bold ?? LINEAR[name]) as ComponentType<IconProps>;
  return <Glyph size={size} color={color} strokeWidth={Bold ? undefined : strokeWidth} />;
}
