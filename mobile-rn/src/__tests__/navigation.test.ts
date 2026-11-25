import { swipeTarget } from '@/navigation/MainShell';

describe('swipeTarget', () => {
  const W = 400;

  it('snaps to the nearest tab on a slow release', () => {
    expect(swipeTarget(0.4, 0, W, 4)).toBe(0);
    expect(swipeTarget(0.6, 0, W, 4)).toBe(1);
  });

  it('a fast flick moves the page in the flick direction', () => {
    expect(swipeTarget(0.1, -1600, W, 4)).toBe(1); // flick left: next tab
    expect(swipeTarget(1.9, 1600, W, 4)).toBe(1); // flick right: previous tab
  });

  it('never leaves the tab range', () => {
    expect(swipeTarget(-0.4, 0, W, 4)).toBe(0);
    expect(swipeTarget(3.6, 0, W, 4)).toBe(3);
    expect(swipeTarget(3, -9000, W, 4)).toBe(3);
  });

  it('handles an unmeasured width without dividing by zero', () => {
    expect(swipeTarget(2.2, -500, 0, 4)).toBe(2);
  });
});
