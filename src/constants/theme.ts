/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#252331',
    background: '#FEFDFF',
    surface: '#8EB1C7',
    surfaceMuted: '#DCEAF2',
    backgroundElement: '#EAF3F8',
    backgroundSelected: '#F7D9C3',
    border: '#C8DCE8',
    accent: '#EE8434',
    accentText: '#2B1A10',
    textSecondary: '#5D6370',
    placeholder: '#7D8490',
  },
  dark: {
    text: '#F4F1F7',
    background: '#2C2B3C',
    surface: '#403F4C',
    surfaceMuted: '#373646',
    backgroundElement: '#363545',
    backgroundSelected: '#5B493F',
    border: '#565467',
    accent: '#EE8434',
    accentText: '#2B1A10',
    textSecondary: '#C6C1D2',
    placeholder: '#A9A4B7',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
