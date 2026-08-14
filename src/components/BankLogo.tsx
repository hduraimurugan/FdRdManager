import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Avatar from './Avatar';
import { bankAvatar } from '../state/selectors';
import { BANK_LOGOS } from '../data/bankLogos';

// Official, full-color bank logo shown in a rounded white chip; falls back to the
// initials avatar for any bank name not in BANK_LOGOS.
export default function BankLogo({ bankName, size = 38 }: { bankName: string; size?: number }) {
  const logo = BANK_LOGOS[bankName];

  if (!logo) {
    const { avatarBg, avatarFg, bankInitials } = bankAvatar(bankName);
    return <Avatar bg={avatarBg} fg={avatarFg} initials={bankInitials} size={size} />;
  }

  const innerHeight = size * 0.68;
  const paddingH = size * 0.16;
  const innerWidth = Math.min(innerHeight * logo.ratio, size * 2.6);

  return (
    <View
      style={[
        styles.wrap,
        {
          height: size,
          width: innerWidth + paddingH * 2,
          borderRadius: size * 0.29,
        },
      ]}
    >
      <Image source={logo.source} style={{ width: innerWidth, height: innerHeight }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
});
