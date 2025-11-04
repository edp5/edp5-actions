import fs from "fs/promises";
import path from "path";
import { describe, expect, test } from "vitest";
import yaml from "yaml";

describe("Release Action", () => {
  test("action.yml exists and has correct structure", async () => {
    const actionPath = path.join(process.cwd(), "release", "action.yml");
    const content = await fs.readFile(actionPath, "utf8");
    const action = yaml.parse(content);

    expect(action.name).toBe("release");
    expect(action.description).toContain("semantic-release");
    expect(action.runs.using).toBe("composite");
  });

  test("action requires token input", async () => {
    const actionPath = path.join(process.cwd(), "release", "action.yml");
    const content = await fs.readFile(actionPath, "utf8");
    const action = yaml.parse(content);

    expect(action.inputs).toHaveProperty("token");
    expect(action.inputs.token.required).toBe(true);
    expect(action.inputs.token.description).toContain("GitHub token");
  });

  test("action has expected steps", async () => {
    const actionPath = path.join(process.cwd(), "release", "action.yml");
    const content = await fs.readFile(actionPath, "utf8");
    const action = yaml.parse(content);

    expect(action.runs.steps).toBeDefined();
    expect(action.runs.steps.length).toBeGreaterThan(0);

    // Check for checkout step
    const checkoutStep = action.runs.steps.find((step) =>
      step.name?.includes("Checkout"),
    );
    expect(checkoutStep).toBeDefined();
    expect(checkoutStep.with?.["fetch-depth"]).toBe(0);

    // Check for copy releaserc step
    const copyStep = action.runs.steps.find((step) =>
      step.name?.includes("releaserc"),
    );
    expect(copyStep).toBeDefined();
    expect(copyStep.run).toContain(".releaserc.json");

    // Check for Node.js setup step
    const nodeStep = action.runs.steps.find((step) =>
      step.name?.includes("Node.js") || step.name?.includes("node"),
    );
    expect(nodeStep).toBeDefined();

    // Check for semantic-release step
    const releaseStep = action.runs.steps.find((step) =>
      step.name?.includes("semantic-release"),
    );
    expect(releaseStep).toBeDefined();
    expect(releaseStep.uses).toContain("semantic-release-action");
  });

  test("semantic-release action has correct plugins", async () => {
    const actionPath = path.join(process.cwd(), "release", "action.yml");
    const content = await fs.readFile(actionPath, "utf8");
    const action = yaml.parse(content);

    const releaseStep = action.runs.steps.find((step) =>
      step.name?.includes("semantic-release"),
    );

    expect(releaseStep.with.extra_plugins).toBeTruthy();
    expect(releaseStep.with.extra_plugins).toContain("@semantic-release/exec");
    expect(releaseStep.with.extra_plugins).toContain(
      "@semantic-release/changelog",
    );
    expect(releaseStep.with.extra_plugins).toContain("@semantic-release/git");
    expect(releaseStep.with.extra_plugins).toContain(
      "conventional-changelog-conventionalcommits",
    );
  });

  test(".releaserc.json exists and has valid configuration", async () => {
    const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
    const content = await fs.readFile(releasercPath, "utf8");
    const config = JSON.parse(content);

    expect(config.branches).toEqual(["main"]);
    expect(config.plugins).toBeDefined();
    expect(Array.isArray(config.plugins)).toBe(true);
  });

  test(".releaserc.json has correct commit analyzer configuration", async () => {
    const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
    const content = await fs.readFile(releasercPath, "utf8");
    const config = JSON.parse(content);

    const commitAnalyzer = config.plugins.find((plugin) =>
      Array.isArray(plugin) && plugin[0] === "@semantic-release/commit-analyzer",
    );

    expect(commitAnalyzer).toBeDefined();
    expect(commitAnalyzer[1].preset).toBe("conventionalcommits");
    expect(commitAnalyzer[1].releaseRules).toBeDefined();

    const releaseRules = commitAnalyzer[1].releaseRules;
    const breakingRule = releaseRules.find((rule) => rule.type === "breaking");
    expect(breakingRule.release).toBe("major");

    const featRule = releaseRules.find((rule) => rule.type === "feat");
    expect(featRule.release).toBe("minor");

    const fixRule = releaseRules.find((rule) => rule.type === "fix");
    expect(fixRule.release).toBe("patch");
  });

  test(".releaserc.json has release notes generator", async () => {
    const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
    const content = await fs.readFile(releasercPath, "utf8");
    const config = JSON.parse(content);

    const releaseNotesGen = config.plugins.find((plugin) =>
      Array.isArray(plugin) &&
      plugin[0] === "@semantic-release/release-notes-generator",
    );

    expect(releaseNotesGen).toBeDefined();
    expect(releaseNotesGen[1].preset).toBe("conventionalcommits");
  });

  test(".releaserc.json includes required plugins", async () => {
    const releasercPath = path.join(process.cwd(), "release", ".releaserc.json");
    const content = await fs.readFile(releasercPath, "utf8");
    const config = JSON.parse(content);

    const pluginNames = config.plugins.map((plugin) =>
      Array.isArray(plugin) ? plugin[0] : plugin,
    );

    expect(pluginNames).toContain("@semantic-release/changelog");
    expect(pluginNames).toContain("@semantic-release/npm");
    expect(pluginNames).toContain("@semantic-release/exec");
    expect(pluginNames).toContain("@semantic-release/git");
    expect(pluginNames).toContain("@semantic-release/github");
  });
});
