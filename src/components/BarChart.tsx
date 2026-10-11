import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { formatCompactINR, formatINR } from '../data/portfolioData';
import type { CashFlowMonth } from '../state/selectors';

export default function BarChart({
  bars,
  selectedIndex = 0,
  onSelect,
  height = 156,
}: {
  bars: CashFlowMonth[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  height?: number;
}) {
  const theme = useTheme();
  const max = Math.max(...bars.map(b => b.total), 1);
  const base = Math.pow(10, Math.floor(Math.log10(max / 4)));
  const step = Math.ceil(max / 4 / base) * base;
  const ceiling = step * 4;
  const offset = Math.floor(selectedIndex / 6) * 6;
  const visibleBars = bars.slice(offset, offset + 6);
  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.axis, { height: height + 24 }]}>
          {[4, 3, 2, 1, 0].map(t => (
            <Text
              key={t}
              style={[
                styles.tick,
                { color: theme.textMuted, top: 24 + height * (1 - t / 4) - 6 },
              ]}
            >
              {formatCompactINR(step * t).replace(/ /g, '')}
            </Text>
          ))}
        </View>
        <View style={styles.flex}>
          <View>
            <View style={{ height: height + 24 }}>
              {[0, 1, 2, 3, 4].map(t => (
                <View
                  key={t}
                  style={[
                    styles.gridline,
                    {
                      top: 24 + (height * t) / 4,
                      borderColor: theme.borderStrong,
                    },
                  ]}
                />
              ))}
              <View style={styles.columns}>
                {visibleBars.map((b, i) => {
                  const selected = selectedIndex === offset + i;
                  const barHeight = (b.total / ceiling) * height;
                  return (
                    <Pressable
                      key={b.key}
                      onPress={() => onSelect?.(offset + i)}
                      accessibilityRole="button"
                      accessibilityLabel={`${b.fullLabel}: ${formatINR(
                        b.total,
                      )}. Show receipts`}
                      accessibilityState={{ selected }}
                      style={[
                        styles.column,
                        selected && {
                          backgroundColor: theme.tint(theme.accent, 0.08),
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={[
                          styles.value,
                          {
                            bottom: barHeight + 6,
                            color: selected ? theme.accent : theme.textMuted,
                          },
                        ]}
                      >
                        {formatCompactINR(b.total).replace(/ /g, '')}
                      </Text>
                      {b.total > 0 ? (
                        <LinearGradient
                          colors={
                            selected
                              ? theme.gradientAccent.colors
                              : [
                                  theme.tint(theme.accent, 0.65),
                                  theme.tint(theme.accent, 0.35),
                                ]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={[
                            styles.bar,
                            { height: Math.max(1, barHeight) },
                          ]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.zero,
                            { backgroundColor: theme.borderStrong2 },
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.months}>
              {visibleBars.map((b, i) => (
                <Pressable
                  key={b.key}
                  onPress={() => onSelect?.(offset + i)}
                  accessibilityRole="button"
                  accessibilityLabel={b.fullLabel}
                  accessibilityState={{
                    selected: selectedIndex === offset + i,
                  }}
                  style={styles.month}
                >
                  <Text
                    style={[
                      styles.label,
                      {
                        color:
                          selectedIndex === offset + i
                            ? theme.accent
                            : theme.textMuted,
                      },
                    ]}
                  >
                    {b.label}
                  </Text>
                  <Text style={[styles.year, { color: theme.textMuted }]}>
                    {b.key.slice(2, 4)}
                  </Text>
                  <View
                    style={[
                      styles.selection,
                      selectedIndex === offset + i && {
                        backgroundColor: theme.accent,
                      },
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
      {bars.length > 6 && (
        <View style={[styles.pager, { borderTopColor: theme.divider }]}>
          <Pressable
            accessibilityRole="button"
            disabled={offset === 0}
            accessibilityState={{ disabled: offset === 0 }}
            onPress={() => onSelect?.(offset - 6)}
            style={styles.pageButton}
          >
            <Text
              style={[
                styles.pageText,
                { color: offset === 0 ? theme.textFaint : theme.accent },
              ]}
            >
              ‹ Previous 6
            </Text>
          </Pressable>
          <Text style={[styles.pageCaption, { color: theme.textMuted }]}>
            {offset + 1}–{Math.min(offset + 6, bars.length)} of {bars.length}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={offset + 6 >= bars.length}
            accessibilityState={{ disabled: offset + 6 >= bars.length }}
            onPress={() => onSelect?.(offset + 6)}
            style={styles.pageButton}
          >
            <Text
              style={[
                styles.pageText,
                {
                  color:
                    offset + 6 >= bars.length ? theme.textFaint : theme.accent,
                },
              ]}
            >
              Next 6 ›
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginTop: 8 },
  flex: { flex: 1 },
  axis: { width: 44 },
  tick: {
    position: 'absolute',
    left: 0,
    fontFamily: fontFamily.medium,
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  gridline: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1 },
  columns: { flexDirection: 'row', height: '100%' },
  column: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  bar: {
    width: '54%',
    maxWidth: 30,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  zero: { width: 8, height: 2, borderRadius: 1 },
  value: {
    position: 'absolute',
    left: 2,
    right: 2,
    textAlign: 'center',
    fontFamily: fontFamily.semibold,
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  months: { flexDirection: 'row' },
  month: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    paddingTop: 10,
    gap: 2,
  },
  label: { fontFamily: fontFamily.semibold, fontSize: 10 },
  year: { fontFamily: fontFamily.regular, fontSize: 8 },
  selection: { height: 3, width: 16, borderRadius: 2, marginTop: 3 },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 10,
    gap: 6,
  },
  pageButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  pageText: { fontFamily: fontFamily.semibold, fontSize: 10 },
  pageCaption: { fontFamily: fontFamily.regular, fontSize: 9 },
});
