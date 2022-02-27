import { arraysOrderAreEqual } from '../utils.js'

describe("Tests for utils.arraysOrderAreEqual()", () => {
  test("arrays equal", () => {
    const a = [1, 2, 3];
    const b = [1, 2, 3];
    expect(arraysOrderAreEqual(a, b)).toBe(true);
  });
  test("ensure order matters", () => {
    const a = [3, 1, 2];
    const b = [1, 2, 3];
    expect(arraysOrderAreEqual(a, b)).toBe(false);
  });
  test("ensure length matters", () => {
    const a = [1, 2, 3, 4];
    const b = [1, 2, 3];
    expect(arraysOrderAreEqual(a, b)).toBe(false);
  });
});
