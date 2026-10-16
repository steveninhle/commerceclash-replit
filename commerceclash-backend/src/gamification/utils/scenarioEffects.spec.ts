import { effectiveSkillValue, readDeltas } from './scenarioEffects';

describe('Scenario modifier values', () => {
  it.each([
    [6, 2, 8],
    [8, 2, 8],
    [1, -2, 0],
    [4, -2, 2],
    [4, 0, 4],
  ])('combines permanent %i with modifier %i to get %i', (value, modifier, expected) => {
    expect(effectiveSkillValue(value, modifier)).toBe(expected);
  });
  it('ignores malformed ledger deltas', () => {
    expect(
      readDeltas([
        null,
        {},
        { skillId: 'a', amount: -1 },
        { skillId: 'a', amount: 1.5 },
        { skillId: 'a', amount: 2 },
      ]),
    ).toEqual([{ skillId: 'a', amount: 2 }]);
    expect(readDeltas(null)).toEqual([]);
  });
});
