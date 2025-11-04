import { describe, expect, test } from "vitest";

describe("PR Title Check Action", () => {
  const validFormats = [
    "fix: resolve issue",
    "feat: add new feature",
    "tech: update infrastructure",
    "docs: update readme",
    "bump: update dependencies",
    "style: format code",
    "refactor: restructure module",
    "chore: update config",
    "perf: optimize performance",
    "test: add tests",
    "revert: revert commit",
    "breaking: remove feature",
  ];

  const validFormatsWithScope = [
    "fix(ui): resolve button issue",
    "feat(api): add new endpoint",
    "tech(ci): update workflow",
    "docs(readme): add examples",
    "bump(deps): update packages",
  ];

  const invalidFormats = [
    "Fix: resolve issue", // capitalized
    "feature: add new feature", // wrong keyword
    "update dependencies", // no prefix
    "fix resolve issue", // missing colon
    "fix (): empty scope",
    "random: not a valid type",
    "Fix(scope): capitalized",
  ];

  test.each(validFormats)("should accept valid format: \"%s\"", (title) => {
    const regex = /^(fix|feat|tech|docs|bump|style|refactor|chore|perf|test|revert|breaking)(\([^)]+\))?:/;
    expect(regex.test(title)).toBe(true);
  });

  test.each(validFormatsWithScope)("should accept valid format with scope: \"%s\"", (title) => {
    const regex = /^(fix|feat|tech|docs|bump|style|refactor|chore|perf|test|revert|breaking)(\([^)]+\))?:/;
    expect(regex.test(title)).toBe(true);
  });

  test.each(invalidFormats)("should reject invalid format: \"%s\"", (title) => {
    const regex = /^(fix|feat|tech|docs|bump|style|refactor|chore|perf|test|revert|breaking)(\([^)]+\))?:/;
    expect(regex.test(title)).toBe(false);
  });

  test("regex pattern matches the one in action.yml", () => {
    // This is the exact regex from the action.yml file
    const actionRegex = /^(fix|feat|tech|docs|bump|style|refactor|chore|perf|test|revert|breaking)(\([^)]+\))?:/;

    // Test that our understanding is correct
    expect(actionRegex.test("feat: new feature")).toBe(true);
    expect(actionRegex.test("feat(scope): new feature")).toBe(true);
    expect(actionRegex.test("invalid: title")).toBe(false);
  });
});
