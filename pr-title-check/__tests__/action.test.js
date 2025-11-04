import fs from "fs/promises";
import path from "path";
import { describe, expect, test } from "vitest";

describe("PR Title Check Action", () => {
  // This regex matches the pattern used in the pr-title-check/action.yml
  const titleRegex = /^(fix|feat|tech|docs|bump|style|refactor|chore|perf|test|revert|breaking)(\([^)]+\))?:/;

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
    expect(titleRegex.test(title)).toBe(true);
  });

  test.each(validFormatsWithScope)("should accept valid format with scope: \"%s\"", (title) => {
    expect(titleRegex.test(title)).toBe(true);
  });

  test.each(invalidFormats)("should reject invalid format: \"%s\"", (title) => {
    expect(titleRegex.test(title)).toBe(false);
  });

  test("regex pattern matches the one in action.yml", async () => {
    // Read the actual action.yml file
    const actionPath = path.join(process.cwd(), "pr-title-check", "action.yml");
    const content = await fs.readFile(actionPath, "utf8");

    // Extract the regex pattern from the action.yml
    // The pattern is in the grep -Eq command
    const regexMatch = content.match(/grep -Eq '([^']+)'/);
    expect(regexMatch).toBeTruthy();

    const extractedPattern = regexMatch[1];

    // Verify our test regex matches the extracted pattern
    expect(extractedPattern).toBe("^(fix|feat|tech|docs|bump|style|refactor|chore|perf|test|revert|breaking)(\\([^)]+\\))?:");

    // Test that the regex works as expected
    expect(titleRegex.test("feat: new feature")).toBe(true);
    expect(titleRegex.test("feat(scope): new feature")).toBe(true);
    expect(titleRegex.test("invalid: title")).toBe(false);
  });
});
