import fs from "fs/promises";
import path from "path";
import { describe, expect, test } from "vitest";
import yaml from "yaml";

describe("Release Action", () => {
  describe("Configuration Structure", () => {
    test("action.yml has correct metadata", async () => {
      // Given: the release action configuration file
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: parsing the action configuration
      // Then: it should have correct name, description, and type
      expect(action.name).toBe("release");
      expect(action.description).toContain("semantic-release");
      expect(action.runs.using).toBe("composite");
    });

    test("action requires GitHub token input", async () => {
      // Given: the release action configuration
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: checking input requirements
      // Then: token should be required with proper description
      expect(action.inputs).toHaveProperty("token");
      expect(action.inputs.token.required).toBe(true);
      expect(action.inputs.token.description).toContain("GitHub token");
    });
  });

  describe("Action Workflow Steps", () => {
    test("action performs all required steps for release", async () => {
      // Given: the release action configuration
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: examining the action steps
      const steps = action.runs.steps;

      // Then: it should have all required steps for semantic release
      expect(steps).toBeDefined();
      expect(steps.length).toBeGreaterThan(0);

      const stepNames = steps.map((step) => step.name);
      expect(stepNames).toContain("Checkout code");
      expect(stepNames).toContain("Copy the releaserc to workspace");
      expect(stepNames.some((name) => name.includes("Node"))).toBe(true);
      expect(stepNames.some((name) => name.includes("semantic-release"))).toBe(true);
    });

    test("checkout step fetches full git history", async () => {
      // Given: the release action configuration
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: finding the checkout step
      const checkoutStep = action.runs.steps.find((step) =>
        step.name?.includes("Checkout"),
      );

      // Then: it should fetch full history for semantic versioning
      expect(checkoutStep).toBeDefined();
      expect(checkoutStep.with?.["fetch-depth"]).toBe(0);
      expect(checkoutStep.with?.["persist-credentials"]).toBe(false);
    });

    test("releaserc configuration is copied to workspace", async () => {
      // Given: the release action configuration
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: finding the copy step
      const copyStep = action.runs.steps.find((step) =>
        step.name?.includes("releaserc"),
      );

      // Then: it should copy .releaserc.json to workspace
      expect(copyStep).toBeDefined();
      expect(copyStep.run).toContain("cp");
      expect(copyStep.run).toContain(".releaserc.json");
      expect(copyStep.run).toContain("github.action_path");
      expect(copyStep.run).toContain("github.workspace");
    });

    test("semantic-release action uses correct plugins", async () => {
      // Given: the release action configuration
      const actionPath = path.join(process.cwd(), "release", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: finding the semantic-release step
      const releaseStep = action.runs.steps.find((step) =>
        step.name?.includes("semantic-release"),
      );

      // Then: it should use cycjimmy/semantic-release-action with required plugins
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
      // Given: the .releaserc.json configuration file
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // When: checking branch configuration
      // Then: it should target the main branch
      expect(config.branches).toEqual(["main"]);
      expect(config.plugins).toBeDefined();
      expect(Array.isArray(config.plugins)).toBe(true);
    });

    test("commit analyzer determines version bumps correctly", async () => {
      // Given: the .releaserc.json configuration
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // When: examining commit analyzer rules
      const commitAnalyzer = config.plugins.find((plugin) =>
        Array.isArray(plugin) && plugin[0] === "@semantic-release/commit-analyzer",
      );

      // Then: it should have correct versioning rules
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
      // Given: the .releaserc.json configuration
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // When: finding release notes generator
      const releaseNotesGen = config.plugins.find((plugin) =>
        Array.isArray(plugin) &&
        plugin[0] === "@semantic-release/release-notes-generator",
      );

      // Then: it should use conventional commits preset
      expect(releaseNotesGen).toBeDefined();
      expect(releaseNotesGen[1].preset).toBe("conventionalcommits");
    });

    test("all required semantic-release plugins are configured", async () => {
      // Given: the .releaserc.json configuration
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // When: extracting plugin names
      const pluginNames = config.plugins.map((plugin) =>
        Array.isArray(plugin) ? plugin[0] : plugin,
      );

      // Then: it should include all necessary plugins
      expect(pluginNames).toContain("@semantic-release/changelog"); // Generate CHANGELOG.md
      expect(pluginNames).toContain("@semantic-release/npm"); // Update package.json
      expect(pluginNames).toContain("@semantic-release/exec"); // Execute custom commands
      expect(pluginNames).toContain("@semantic-release/git"); // Commit changes
      expect(pluginNames).toContain("@semantic-release/github"); // Create GitHub release
    });

    test("npm plugin is configured to skip publishing", async () => {
      // Given: the .releaserc.json configuration
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // When: finding npm plugin configuration
      const npmPlugin = config.plugins.find((plugin) =>
        Array.isArray(plugin) && plugin[0] === "@semantic-release/npm",
      );

      // Then: it should skip npm publishing (this is a GitHub Actions repo)
      expect(npmPlugin).toBeDefined();
      expect(npmPlugin[1].npmPublish).toBe(false);
    });

    test("git plugin commits version changes", async () => {
      // Given: the .releaserc.json configuration
      const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
      const content = await fs.readFile(releasercPath, "utf8");
      const config = JSON.parse(content);

      // When: finding git plugin configuration
      const gitPlugin = config.plugins.find((plugin) =>
        Array.isArray(plugin) && plugin[0] === "@semantic-release/git",
      );

      // Then: it should commit CHANGELOG and package.json changes
      expect(gitPlugin).toBeDefined();
      expect(gitPlugin[1].assets).toContain("CHANGELOG.md");
      expect(gitPlugin[1].assets).toContain("package.json");
      expect(gitPlugin[1].message).toContain("chore(release)");
      expect(gitPlugin[1].message).toContain("[skip ci]");
    });
  });
});
