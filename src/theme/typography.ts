// Maps the prototype's Inter font-weight values (400/500/600/700/800) to the bundled static font files.
// RN renders custom fonts most reliably by fontFamily alone — don't also set fontWeight alongside these.
export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extrabold: 'Inter-ExtraBold',
} as const;
