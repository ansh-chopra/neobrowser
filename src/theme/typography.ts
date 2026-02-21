import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  // Display
  hero: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  // Body
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  tiny: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    lineHeight: 14,
  },
} as const;
