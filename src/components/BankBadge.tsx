import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { bankAbbreviation, findBank, normalizeBankName } from '../data/banks';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

export default function BankBadge({
  bankName,
  size = 44,
}: {
  bankName: string;
  size?: number;
}) {
  const theme = useTheme();
  const abbreviation = bankAbbreviation(bankName);
  const identity = findBank(bankName)?.id ?? normalizeBankName(bankName);
  const hash = Array.from(identity).reduce(
    (n, char) => (n * 31 + char.codePointAt(0)!) >>> 0,
    0,
  );
  const palette =
    theme.mode === 'dark'
      ? ['#b3aafa', '#9bc9f5', '#8fdfbe', '#f5c18f']
      : ['#5144ae', '#265f92', '#236747', '#875421'];
  const color = palette[hash % palette.length];
  return (
    <View
      accessible
      accessibilityLabel={bankName || 'Bank'}
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: theme.tint(color, 0.13),
        },
      ]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={[
          styles.text,
          {
            color,
            fontSize:
              size *
              (abbreviation.length > 4
                ? 0.23
                : abbreviation.length > 3
                ? 0.27
                : 0.32),
          },
        ]}
      >
        {abbreviation}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    paddingHorizontal: 3,
  },
  text: { fontFamily: fontFamily.bold, letterSpacing: -0.3 },
});
