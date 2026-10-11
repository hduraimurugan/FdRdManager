import React from 'react';
import Renderer, { act, ReactTestRenderer } from 'react-test-renderer';
const mounted: ReactTestRenderer[] = [];
export async function render(element: React.ReactElement) {
  let tree!: ReactTestRenderer;
  await act(async () => { tree = Renderer.create(element); });
  mounted.push(tree);
  return tree;
}
export async function cleanup() {
  await act(async () => { mounted.splice(0).forEach(tree => tree.unmount()); });
}
export { act };
