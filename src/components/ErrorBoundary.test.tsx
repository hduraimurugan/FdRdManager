import React from 'react';
import ReactTestRenderer, { act, ReactTestRenderer as Renderer } from 'react-test-renderer';
import { Text } from 'react-native';
import ErrorBoundary from './ErrorBoundary';
import { ThemeProvider } from '../theme/ThemeContext';

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('boom');
  return <Text>All good</Text>;
}

// ErrorBoundary's fallback renders inside ThemeProvider in the real app (App.tsx wraps
// it that way); wrap it here too so useTheme() inside the fallback has a provider.
// act() (matching App.test.tsx's pattern) flushes React's scheduled work synchronously —
// without it, a throwing child's error-recovery render pass can leak into later tests.
async function renderWithTheme(children: React.ReactNode): Promise<Renderer> {
  let tree!: Renderer;
  await act(() => {
    tree = ReactTestRenderer.create(<ThemeProvider mode="light">{children}</ThemeProvider>);
  });
  return tree;
}

describe('ErrorBoundary', () => {
  // React logs caught render errors to console.error by default; silence that noise for
  // these tests since throwing is the point, not a real bug.
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children normally when nothing throws', async () => {
    const tree = await renderWithTheme(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(tree.root.findByType(Text).props.children).toBe('All good');
  });

  it('renders the fallback instead of crashing when a child throws during render', async () => {
    const tree = await renderWithTheme(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );
    const texts = tree.root.findAllByType(Text).map(node => node.props.children);
    expect(texts.flat().join(' ')).toContain('Something went wrong');
  });

  it('"Try again" resets the boundary so a fixed subtree can render again', async () => {
    // Realistic recovery: something elsewhere in the tree re-renders with the underlying
    // problem fixed (here: a prop flip), *and* the user taps Try again — while
    // hasError is still true the boundary shows the fallback regardless of new props,
    // so both steps are needed, matching how a transient error actually recovers.
    let shouldThrow = true;
    // eslint-disable-next-line react/no-unstable-nested-components
    function Wrapper() {
      return (
        <ErrorBoundary>
          <Bomb shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }
    const tree = await renderWithTheme(<Wrapper />);
    expect(tree.root.findAllByType(Text).map(n => n.props.children).flat().join(' ')).toContain('Something went wrong');

    shouldThrow = false;
    await act(() => {
      tree.update(
        <ThemeProvider mode="light">
          <Wrapper />
        </ThemeProvider>,
      );
    });

    const retryButton = tree.root.findByProps({ testID: 'error-boundary-retry' });
    await act(() => {
      retryButton.props.onPress();
    });

    expect(tree.root.findByType(Text).props.children).toBe('All good');
  });
});
