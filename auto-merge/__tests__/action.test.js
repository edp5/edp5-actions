import fs from "fs/promises";
import path from "path";
import { describe, expect, test } from "vitest";
import yaml from "yaml";

describe("Auto Merge Action", () => {
  test("action.yml exists and has correct structure", async () => {
    const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
    const content = await fs.readFile(actionPath, "utf8");
    const action = yaml.parse(content);

    expect(action.name).toBe("Auto merge");
    expect(action.description).toBeTruthy();
    expect(action.runs.using).toBe("composite");
  });

  test("action requires token input", async () => {
    const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
    const content = await fs.readFile(actionPath, "utf8");
    const action = yaml.parse(content);

    expect(action.inputs).toHaveProperty("token");
    expect(action.inputs.token.required).toBe(true);
    expect(action.inputs.token.description).toContain("GitHub token");
  });

  test("action has expected steps", async () => {
    const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
    const content = await fs.readFile(actionPath, "utf8");
    const action = yaml.parse(content);

    expect(action.runs.steps).toBeDefined();
    expect(action.runs.steps.length).toBeGreaterThan(0);

    // Check for checkout step
    const checkoutStep = action.runs.steps.find((step) =>
      step.name?.includes("Checkout"),
    );
    expect(checkoutStep).toBeDefined();

    // Check for rebase step
    const rebaseStep = action.runs.steps.find((step) =>
      step.name?.includes("Rebase"),
    );
    expect(rebaseStep).toBeDefined();
    expect(rebaseStep.run).toContain("gh pr update-branch");

    // Check for merge step
    const mergeStep = action.runs.steps.find((step) =>
      step.name?.includes("merge"),
    );
    expect(mergeStep).toBeDefined();
    expect(mergeStep.run).toContain("gh pr merge");

    // Check for approve step
    const approveStep = action.runs.steps.find((step) =>
      step.name?.includes("Approve"),
    );
    expect(approveStep).toBeDefined();
    expect(approveStep.if).toContain("dependabot");
  });

  test("steps use shell: bash", async () => {
    const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
    const content = await fs.readFile(actionPath, "utf8");
    const action = yaml.parse(content);

    const shellSteps = action.runs.steps.filter((step) => step.run);
    shellSteps.forEach((step) => {
      expect(step.shell).toBe("bash");
    });
  });

  test("steps use token from inputs", async () => {
    const actionPath = path.join(process.cwd(), "auto-merge", "action.yml");
    const content = await fs.readFile(actionPath, "utf8");
    const action = yaml.parse(content);

    const stepsWithToken = action.runs.steps.filter(
      (step) => step.env?.GITHUB_TOKEN || step.with?.token,
    );

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
