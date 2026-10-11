import React from 'react';
import { Modal, Text, TextInput } from 'react-native';
import type { ReactTestRenderer, ReactTestInstance } from 'react-test-renderer';
import BankPicker from './BankPicker';
import { ThemeProvider } from '../theme/ThemeContext';
import { act, cleanup, render } from '../../tests/support/renderer';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
}));
afterEach(cleanup);
function content(node: ReactTestInstance): string {
  return node.children
    .map(child => (typeof child === 'string' ? child : content(child)))
    .join('');
}
async function press(tree: ReactTestRenderer, label: string) {
  const node = tree.root.findAll(
    n =>
      n.props.accessibilityLabel === label &&
      typeof n.props.onPress === 'function',
  )[0];
  await act(async () => node.props.onPress());
}
async function pressText(tree: ReactTestRenderer, label: string) {
  let node = tree.root.findAllByType(Text).find(n => content(n) === label)!;
  while (!node.props.onPress) node = node.parent!;
  await act(async () => node.props.onPress());
}
async function type(tree: ReactTestRenderer, label: string, value: string) {
  await act(async () =>
    tree.root
      .findAllByType(TextInput)
      .find(n => n.props.accessibilityLabel === label)!
      .props.onChangeText(value),
  );
}
async function setup(value = '', mode: 'light' | 'dark' = 'light') {
  const change = jest.fn();
  const tree = await render(
    <ThemeProvider mode={mode}>
      <BankPicker
        value={value}
        onChange={change}
        usedNames={['My Cooperative Bank']}
      />
    </ThemeProvider>,
  );
  await press(tree, value ? `Bank, ${value}. Change bank` : 'Choose bank');
  return { tree, change };
}
it.each(['light', 'dark'] as const)(
  'searches abbreviations and selects a bank in %s',
  async mode => {
    const { tree, change } = await setup('', mode);
    await type(tree, 'Search banks', 'sbi');
    await press(tree, 'Select State Bank of India');
    expect(change).toHaveBeenCalledWith('State Bank of India');
    expect(tree.root.findByType(Modal).props.visible).toBe(false);
  },
);
it('offers manual entry with no matches, validates blanks, and trims the confirmed name', async () => {
  const { tree, change } = await setup();
  await type(tree, 'Search banks', 'No Matching Institution');
  await pressText(tree, 'Other / Enter manually');
  expect(tree.root.findByType(TextInput).props.value).toBe(
    'No Matching Institution',
  );
  await type(tree, 'Bank name', '   ');
  await pressText(tree, 'Use bank name');
  expect(change).not.toHaveBeenCalled();
  expect(
    tree.root.findAllByType(Text).some(n => content(n) === 'Enter a bank name'),
  ).toBe(true);
  await type(tree, 'Bank name', '  New Cooperative Bank  ');
  await pressText(tree, 'Use bank name');
  expect(change).toHaveBeenCalledWith('New Cooperative Bank');
});
it('prefills a custom name and discards an unconfirmed edit on cancel or Android back', async () => {
  const { tree, change } = await setup('My Cooperative Bank');
  await pressText(tree, 'Other / Enter manually');
  expect(tree.root.findByType(TextInput).props.value).toBe(
    'My Cooperative Bank',
  );
  await type(tree, 'Bank name', 'Unsaved bank');
  await press(tree, 'Cancel bank selection');
  expect(change).not.toHaveBeenCalled();
  await press(tree, 'Bank, My Cooperative Bank. Change bank');
  await act(async () => tree.root.findByType(Modal).props.onRequestClose());
  expect(change).not.toHaveBeenCalled();
});
it('can reuse a previous custom bank and clear search', async () => {
  const { tree, change } = await setup();
  await type(tree, 'Search banks', 'missing');
  await press(tree, 'Clear bank search');
  await press(tree, 'Select My Cooperative Bank');
  expect(change).toHaveBeenCalledWith('My Cooperative Bank');
});
