import fs from "fs/promises";
import path from "path";
import { describe, expect, test } from "vitest";
import yaml from "yaml";

describe("Release Action", () => {
  describe("Configuration Structure", () => {
    test("action.yml has correct metadata", async () => {
      // given
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");

      // when
      const action = yaml.parse(content);

      // then
      expect(action.name).toBe("release");
      expect(action.description).toContain("semantic-release");
      expect(action.runs.using).toBe("composite");
    });

    test("action requires GitHub token input", async () => {
      // given
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when & then
      expect(action.inputs).toHaveProperty("token");
      expect(action.inputs.token.required).toBe(true);
      expect(action.inputs.token.description).toContain("GitHub token");
    });
  });

  describe("Action Workflow Steps", () => {
    test("action performs all required steps for release", async () => {
      // given
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const steps = action.runs.steps;

      // then
      expect(steps).toBeDefined();
      expect(steps.length).toBeGreaterThan(0);

      const stepNames = steps.map((step) => step.name);
      expect(stepNames).toContain("Checkout code");
      expect(stepNames).toContain("Copy the releaserc to workspace");
      expect(stepNames.some((name) => name.includes("Node"))).toBe(true);
      expect(stepNames.some((name) => name.includes("semantic-release"))).toBe(true);
    });

    test("checkout step fetches full git history", async () => {
      // given
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const checkoutStep = action.runs.steps.find((step) =>
        step.name?.includes("Checkout"),
      );

      // then
      expect(checkoutStep).toBeDefined();
      expect(checkoutStep.with?.["fetch-depth"]).toBe(0);
      expect(checkoutStep.with?.["persist-credentials"]).toBe(false);
    });

    test("releaserc configuration is copied to workspace", async () => {
      // given
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const copyStep = action.runs.steps.find((step) =>
        step.name?.includes("releaserc"),
      );

      // then
      expect(copyStep).toBeDefined();
      expect(copyStep.run).toContain("cp");
      expect(copyStep.run).toContain(".releaserc.json");
      expect(copyStep.run).toContain("github.action_path");
      expect(copyStep.run).toContain("github.workspace");
    });

    test("semantic-release action uses correct plugins", async () => {
      // given
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const releaseStep = action.runs.steps.find((step) =>
        step.name?.includes("semantic-release"),
      );

      // then
      expect(releaseStep).toBeDefined();
      expect(releaseStep.uses).toContain("semantic-release-action");
      expect(releaseStep.with.extra_plugins).toBeTruthy();
      expect(releaseStep.with.extra_plugins).toContain("@semantic-release/exec");
      expect(releaseStep.with.extra_plugins).toContain("@semantic-release/changelog");
      expect(releaseStep.with.extra_plugins).toContain("@semantic-release/git");
      expect(releaseStep.with.extra_plugins).toContain("conventional-changelog-conventionalcommits");
      expect(releaseStep.env?.GITHUB_TOKEN).toContain("inputs.token");
    });
  });

  describe("Semantic Release Configuration", () => {
    test("releaserc.json exists and targets main branch", async () => {
      // given
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // when & then
      expect(config.branches).toEqual(["main"]);
      expect(config.plugins).toBeDefined();
      expect(Array.isArray(config.plugins)).toBe(true);
    });

    test("commit analyzer determines version bumps correctly", async () => {
      // given
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // when
      const commitAnalyzer = config.plugins.find((plugin) =>
        Array.isArray(plugin) && plugin[0] === "@semantic-release/commit-analyzer",
      );

      // then
      expect(commitAnalyzer).toBeDefined();
      expect(commitAnalyzer[1].preset).toBe("conventionalcommits");

      const releaseRules = commitAnalyzer[1].releaseRules;
      const breakingRule = releaseRules.find((rule) => rule.type === "breaking");
      const featRule = releaseRules.find((rule) => rule.type === "feat");
      const fixRule = releaseRules.find((rule) => rule.type === "fix");

      // Breaking changes trigger major version
      expect(breakingRule.release).toBe("major");
      // Features trigger minor version
      expect(featRule.release).toBe("minor");
      // Fixes trigger patch version
      expect(fixRule.release).toBe("patch");
    });

    test("release notes generator uses conventional commits", async () => {
      // given
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // when
      const releaseNotesGen = config.plugins.find((plugin) =>
        Array.isArray(plugin) &&
        plugin[0] === "@semantic-release/release-notes-generator",
      );

      // then
      expect(releaseNotesGen).toBeDefined();
      expect(releaseNotesGen[1].preset).toBe("conventionalcommits");
    });

    test("all required semantic-release plugins are configured", async () => {
      // given
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // when
      const pluginNames = config.plugins.map((plugin) =>
        Array.isArray(plugin) ? plugin[0] : plugin,
      );

      // then
      expect(pluginNames).toContain("@semantic-release/changelog"); // Generate CHANGELOG.md
      expect(pluginNames).toContain("@semantic-release/npm"); // Update package.json
      expect(pluginNames).toContain("@semantic-release/exec"); // Execute custom commands
      expect(pluginNames).toContain("@semantic-release/git"); // Commit changes
      expect(pluginNames).toContain("@semantic-release/github"); // Create GitHub release
    });

    test("npm plugin is configured to skip publishing", async () => {
      // given
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // when
      const npmPlugin = config.plugins.find((plugin) =>
        Array.isArray(plugin) && plugin[0] === "@semantic-release/npm",
      );

      // then
      expect(npmPlugin).toBeDefined();
      expect(npmPlugin[1].npmPublish).toBe(false);
    });

    test("git plugin commits version changes", async () => {
      // given
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // when
      const gitPlugin = config.plugins.find((plugin) =>
        Array.isArray(plugin) && plugin[0] === "@semantic-release/git",
      );

      // then
      expect(gitPlugin).toBeDefined();
      expect(gitPlugin[1].assets).toContain("CHANGELOG.md");
      expect(gitPlugin[1].assets).toContain("package.json");
      expect(gitPlugin[1].message).toContain("chore(release)");
      expect(gitPlugin[1].message).toContain("[skip ci]");
    });
  });
});
