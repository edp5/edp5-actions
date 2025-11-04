import fs from "fs/promises";
import path from "path";
import { describe, expect, test } from "vitest";
import yaml from "yaml";

describe("Auto Merge Action", () => {
  describe("Configuration Structure", () => {
    test("action.yml has correct metadata", async () => {
      // given
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");

      // when
      const action = yaml.parse(content);

      // then
      expect(action.name).toBe("Auto merge");
      expect(action.description).toContain("Automatically merge pull requests");
      expect(action.runs.using).toBe("composite");
    });

    test("action requires GitHub token input", async () => {
      // given
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");

      // when
      const action = yaml.parse(content);

      // then
      expect(action.inputs).toHaveProperty("token");
      expect(action.inputs.token.required).toBe(true);
      expect(action.inputs.token.description).toContain("GitHub token");
    });
  });

  describe("Action Workflow Steps", () => {
    test("action performs all required steps in order", async () => {
      // given
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const steps = action.runs.steps;

      // then
      expect(steps).toBeDefined();
      expect(steps.length).toBeGreaterThan(0);

      const stepNames = steps.map((step) => step.name);
      expect(stepNames).toContain("Checkout code");
      expect(stepNames).toContain("Rebase branch");
      expect(stepNames).toContain("Enable auto merge or merge pull request");
      expect(stepNames).toContain("Approve pull request if it's from dependabot");
    });

    test("checkout step uses provided token", async () => {
      // given
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const checkoutStep = action.runs.steps.find((step) =>
        step.name?.includes("Checkout"),
      );

      // then
      expect(checkoutStep).toBeDefined();
      expect(checkoutStep.uses).toContain("actions/checkout");
      expect(checkoutStep.with?.token).toContain("inputs.token");
    });

    test("rebase step uses GitHub CLI", async () => {
      // given
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const rebaseStep = action.runs.steps.find((step) =>
        step.name?.includes("Rebase"),
      );

      // then
      expect(rebaseStep).toBeDefined();
      expect(rebaseStep.run).toContain("gh pr update-branch");
      expect(rebaseStep.run).toContain("--rebase");
      expect(rebaseStep.shell).toBe("bash");
      expect(rebaseStep.env?.GITHUB_TOKEN).toContain("inputs.token");
    });

    test("merge step enables auto-merge with squash", async () => {
      // given
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const mergeStep = action.runs.steps.find((step) =>
        step.name?.includes("Enable auto merge"),
      );

      // then
      expect(mergeStep).toBeDefined();
      expect(mergeStep.run).toContain("gh pr merge");
      expect(mergeStep.run).toContain("--auto");
      expect(mergeStep.run).toContain("-s");
      expect(mergeStep.env?.GITHUB_TOKEN).toContain("inputs.token");
    });

    test("approve step is conditional for dependabot", async () => {
      // given
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const approveStep = action.runs.steps.find((step) =>
        step.name?.includes("Approve"),
      );

      // then
      expect(approveStep).toBeDefined();
      expect(approveStep.if).toContain("dependabot");
      expect(approveStep.run).toContain("gh pr review");
      expect(approveStep.run).toContain("--approve");
    });
  });

  describe("Action Security", () => {
    test("all shell steps use bash", async () => {
      // given
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const shellSteps = action.runs.steps.filter((step) => step.run);

      // then
      shellSteps.forEach((step) => {
        expect(step.shell).toBe("bash");
      });
    });

    test("token is properly propagated through environment", async () => {
      // given
      const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const stepsWithToken = action.runs.steps.filter(
        (step) => step.env?.GITHUB_TOKEN || step.with?.token,
      );

      // then
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
