import fs from "fs/promises";
import path from "path";
import { describe, expect, test } from "vitest";
import yaml from "yaml";

describe("Auto Merge Action", () => {
  describe("Configuration Structure", () => {
    test("action.yml has correct metadata", async () => {
      // Given: the auto-merge action configuration file
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: parsing the action configuration
      // Then: it should have correct name, description, and type
      expect(action.name).toBe("Auto merge");
      expect(action.description).toContain("Automatically merge pull requests");
      expect(action.runs.using).toBe("composite");
    });

    test("action requires GitHub token input", async () => {
      // Given: the auto-merge action configuration
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
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
    test("action performs all required steps in order", async () => {
      // Given: the auto-merge action configuration
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: examining the action steps
      const steps = action.runs.steps;

      // Then: it should have all required steps
      expect(steps).toBeDefined();
      expect(steps.length).toBeGreaterThan(0);

      const stepNames = steps.map((step) => step.name);
      expect(stepNames).toContain("Checkout code");
      expect(stepNames).toContain("Rebase branch");
      expect(stepNames).toContain("Enable auto merge or merge pull request");
      expect(stepNames).toContain("Approve pull request if it's from dependabot");
    });

    test("checkout step uses provided token", async () => {
      // Given: the auto-merge action configuration
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: finding the checkout step
      const checkoutStep = action.runs.steps.find((step) =>
        step.name?.includes("Checkout"),
      );

      // Then: it should use the provided token
      expect(checkoutStep).toBeDefined();
      expect(checkoutStep.uses).toContain("actions/checkout");
      expect(checkoutStep.with?.token).toContain("inputs.token");
    });

    test("rebase step uses GitHub CLI", async () => {
      // Given: the auto-merge action configuration
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: finding the rebase step
      const rebaseStep = action.runs.steps.find((step) =>
        step.name?.includes("Rebase"),
      );

      // Then: it should use gh CLI to rebase the PR
      expect(rebaseStep).toBeDefined();
      expect(rebaseStep.run).toContain("gh pr update-branch");
      expect(rebaseStep.run).toContain("--rebase");
      expect(rebaseStep.shell).toBe("bash");
      expect(rebaseStep.env?.GITHUB_TOKEN).toContain("inputs.token");
    });

    test("merge step enables auto-merge with squash", async () => {
      // Given: the auto-merge action configuration
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: finding the merge step
      const mergeStep = action.runs.steps.find((step) =>
        step.name?.includes("Enable auto merge"),
      );

      // Then: it should use gh CLI with auto and squash flags
      expect(mergeStep).toBeDefined();
      expect(mergeStep.run).toContain("gh pr merge");
      expect(mergeStep.run).toContain("--auto");
      expect(mergeStep.run).toContain("-s"); // squash flag
      expect(mergeStep.env?.GITHUB_TOKEN).toContain("inputs.token");
    });

    test("approve step is conditional for dependabot", async () => {
      // Given: the auto-merge action configuration
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: finding the approve step
      const approveStep = action.runs.steps.find((step) =>
        step.name?.includes("Approve"),
      );

      // Then: it should be conditional and approve dependabot PRs
      expect(approveStep).toBeDefined();
      expect(approveStep.if).toContain("dependabot");
      expect(approveStep.run).toContain("gh pr review");
      expect(approveStep.run).toContain("--approve");
    });
  });

  describe("Action Security", () => {
    test("all shell steps use bash", async () => {
      // Given: the auto-merge action configuration
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: checking shell steps
      const shellSteps = action.runs.steps.filter((step) => step.run);

      // Then: all should use bash shell
      shellSteps.forEach((step) => {
        expect(step.shell).toBe("bash");
      });
    });

    test("token is properly propagated through environment", async () => {
      // Given: the auto-merge action configuration
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // When: checking steps that need authentication
      const stepsWithToken = action.runs.steps.filter(
        (step) => step.env?.GITHUB_TOKEN || step.with?.token,
      );

      // Then: all authenticated steps should reference inputs.token
      expect(stepsWithToken.length).toBeGreaterThan(0);
      stepsWithToken.forEach((step) => {
        if (step.env?.GITHUB_TOKEN) {
          expect(step.env.GITHUB_TOKEN).toContain("inputs.token");
        }
        if (step.with?.token) {
          expect(step.with.token).toContain("inputs.token");
        }
      });
    });
  });
});
