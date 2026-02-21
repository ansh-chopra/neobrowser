export const colors = {
  // Backgrounds
  cream: '#FAF9F7',
  warmBg: '#F7F5F2',
  white: '#FFFFFF',
  black: '#000000',

  // Grays - refined warm stone palette
  gray50: '#FAFAF9',
  gray100: '#F0EDEA',
  gray200: '#E5E2DD',
  gray300: '#CEC9C1',
  gray400: '#A8A29E',
  gray500: '#78716C',
  gray600: '#57534E',
  gray700: '#3F3B37',
  gray800: '#1E1B18',
  gray900: '#141210',

  // Accent - function coded
  blue: '#2563EB',
  green: '#16A34A',
  pink: '#EC4899',
  orange: '#EA580C',
  purple: '#7C3AED',
  teal: '#0D9488',
  cyan: '#0891B2',
  red: '#DC2626',
  indigo: '#4F46E5',

  // Semantic
  send: '#2563EB',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#EA580C',

  // AI Colors
  gemini: '#1A73E8',
  claude: '#C2410C',
  neo: '#18181B',

  // Privacy & VPN
  shield: '#F59E0B',
  vpn: '#10B981',
  shieldBg: '#FFFBEB',
  vpnBg: '#ECFDF5',
} as const;

// Dark mode color overrides
export const darkColors = {
  ...colors,
  cream: '#0F0F0F',
  warmBg: '#141414',
  white: '#1A1A1A',
  black: '#FFFFFF',

  gray50: '#1E1E1E',
  gray100: '#2A2A2A',
  gray200: '#3A3A3A',
  gray300: '#555555',
  gray400: '#888888',
  gray500: '#A0A0A0',
  gray600: '#BBBBBB',
  gray700: '#D4D4D4',
  gray800: '#EEEEEE',
  gray900: '#F8F8F8',

  shieldBg: '#2A2000',
  vpnBg: '#0A2A1A',
} as const;

export const shadows = {
  soft: {
    shadowColor: '#1E1B18',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#1E1B18',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  lifted: {
    shadowColor: '#1E1B18',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  glow: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;
