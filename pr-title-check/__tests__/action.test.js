import fs from "fs/promises";
import path from "path";
import { describe, expect, test } from "vitest";

describe("PR Title Check Action", () => {
  // This regex matches the pattern used in the pr-title-check/action.yml
  const titleRegex = /^(fix|feat|tech|docs|bump|style|refactor|chore|perf|test|revert|breaking)(\([^)]+\))?:/;

  describe("Configuration", () => {
    test("regex pattern matches the one in action.yml", async () => {
      // Given: the action.yml file exists
      const actionPath = path.join(process.cwd(), "pr-title-check", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");

      // When: extracting the regex pattern from the action.yml
      const regexMatch = content.match(/grep -Eq '([^']+)'/);

      // Then: the pattern should be correctly extracted and match our test regex
      expect(regexMatch).toBeTruthy();
      const extractedPattern = regexMatch[1];
      expect(extractedPattern).toBe("^(fix|feat|tech|docs|bump|style|refactor|chore|perf|test|revert|breaking)(\\([^)]+\\))?:");
    });
  });

  describe("Valid PR Title Formats", () => {
    const validFormats = [
      { title: "fix: resolve issue", type: "fix" },
      { title: "feat: add new feature", type: "feat" },
      { title: "tech: update infrastructure", type: "tech" },
      { title: "docs: update readme", type: "docs" },
      { title: "bump: update dependencies", type: "bump" },
      { title: "style: format code", type: "style" },
      { title: "refactor: restructure module", type: "refactor" },
      { title: "chore: update config", type: "chore" },
      { title: "perf: optimize performance", type: "perf" },
      { title: "test: add tests", type: "test" },
      { title: "revert: revert commit", type: "revert" },
      { title: "breaking: remove feature", type: "breaking" },
    ];

    test.each(validFormats)("should accept $type format: \"$title\"", ({ title }) => {
      // Given: a valid PR title with conventional commit format
      // When: checking the title against the regex
      const result = titleRegex.test(title);

      // Then: the title should be accepted
      expect(result).toBe(true);
    });
  });

  describe("Valid PR Title Formats with Scope", () => {
    const validFormatsWithScope = [
      { title: "fix(ui): resolve button issue", type: "fix", scope: "ui" },
      { title: "feat(api): add new endpoint", type: "feat", scope: "api" },
      { title: "tech(ci): update workflow", type: "tech", scope: "ci" },
      { title: "docs(readme): add examples", type: "docs", scope: "readme" },
      { title: "bump(deps): update packages", type: "bump", scope: "deps" },
    ];

    test.each(validFormatsWithScope)("should accept $type($scope) format: \"$title\"", ({ title }) => {
      // Given: a valid PR title with conventional commit format and scope
      // When: checking the title against the regex
      const result = titleRegex.test(title);

      // Then: the title should be accepted
      expect(result).toBe(true);
    });
  });

  describe("Invalid PR Title Formats", () => {
    const invalidFormats = [
      { title: "Fix: resolve issue", reason: "capitalized type" },
      { title: "feature: add new feature", reason: "wrong keyword" },
      { title: "update dependencies", reason: "no prefix" },
      { title: "fix resolve issue", reason: "missing colon" },
      { title: "fix (): empty scope", reason: "empty scope" },
      { title: "random: not a valid type", reason: "invalid type" },
      { title: "Fix(scope): capitalized", reason: "capitalized with scope" },
    ];

    test.each(invalidFormats)("should reject title with $reason: \"$title\"", ({ title }) => {
      // Given: an invalid PR title that doesn't follow conventional commit format
      // When: checking the title against the regex
      const result = titleRegex.test(title);

      // Then: the title should be rejected
      expect(result).toBe(false);
    });
  });

  describe("Action Functionality", () => {
    test("action script validates title correctly", async () => {
      // Given: the action script with validation logic
      const actionPath = path.join(process.cwd(), "pr-title-check", "action.yml");

      // When: reading the action configuration
      const content = await fs.readFile(actionPath, "utf8");

      // Then: it should contain the validation logic
      expect(content).toContain("grep -Eq");
      expect(content).toContain("exit 0");
      expect(content).toContain("exit 1");
    });

    test("action skips check for merge_group events", async () => {
      // Given: the action script
      const actionPath = path.join(process.cwd(), "pr-title-check", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");

      // When: checking for merge_group event handling
      // Then: the action should skip validation for merge_group events
      expect(content).toContain("merge_group");
      expect(content).toContain("Skipping PR title check");
    });

    test("action provides helpful error message", async () => {
      // Given: the action script
      const actionPath = path.join(process.cwd(), "pr-title-check", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");

      // When: checking for error messaging
      // Then: the action should provide clear guidance on valid formats
      expect(content).toContain("❌ Error");
      expect(content).toContain("fix, feat, tech, docs, bump");
      expect(content).toContain("feat(scope):");
    });
  });
});
