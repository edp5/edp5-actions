
import fs from "fs/promises";
import path from "path";
import { describe, expect, test } from "vitest";
import yaml from "yaml";

describe("Update Node Version Action", () => {
  describe("Configuration Structure", () => {
    test("action.yml has correct metadata", async () => {
      // given
      const actionPath = path.join(process.cwd(), "update-node-version", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");

      // when
      const action = yaml.parse(content);

      // then
      expect(action.name).toBe("update-node-version");
      expect(action.description).toContain("latest node");
      expect(action.runs.using).toBe("composite");
    });

    test("action requires GitHub token input", async () => {
      // given
      const actionPath = path.join(process.cwd(), "update-node-version", "action.yml");
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
    test("action declares expected steps", async () => {
      // given
      const actionPath = path.join(process.cwd(), "update-node-version", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const steps = action.runs.steps;

      // then
      expect(steps).toBeDefined();
      const stepNames = steps.map((s) => s.name);
      expect(stepNames).toContain("Checkout code");
      expect(stepNames).toContain("Get latest Node.js version");
      expect(stepNames).toContain("Check if .nvmrc file is up to date");
      expect(stepNames).toContain("Update .nvmrc file");
      expect(stepNames).toContain("Create Pull Request");
    });

    test("checkout step uses actions/checkout", async () => {
      // given
      const actionPath = path.join(process.cwd(), "update-node-version", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const checkoutStep = action.runs.steps.find((step) =>
        step.name?.includes("Checkout"),
      );

      // then
      expect(checkoutStep).toBeDefined();
      expect(checkoutStep.uses).toContain("actions/checkout");
    });

    test("Get latest Node.js step fetches index.json and sets LATEST_VERSION", async () => {
      // given
      const actionPath = path.join(process.cwd(), "update-node-version", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const getLatest = action.runs.steps.find((step) =>
        step.name?.includes("Get latest Node.js"),
      );

      // then
      expect(getLatest).toBeDefined();
      expect(getLatest.shell).toBe("bash");
      expect(getLatest.run).toContain("nodejs.org/dist/index.json");
      expect(getLatest.run).toContain("jq -r");
      expect(getLatest.run).toContain("echo \"LATEST_VERSION=");
    });

    test("Check .nvmrc step handles missing file and sets UP_TO_DATE output", async () => {
      // given
      const actionPath = path.join(process.cwd(), "update-node-version", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const checkStep = action.runs.steps.find((step) =>
        step.name?.includes(".nvmrc"),
      );

      // then
      expect(checkStep).toBeDefined();
      expect(checkStep.id).toBe("check-nvmrc");
      expect(checkStep.shell).toBe("bash");
      expect(checkStep.run).toContain("if [ ! -f .nvmrc ]");
      expect(checkStep.run).toContain("UP_TO_DATE=false");
      expect(checkStep.run).toContain("UP_TO_DATE=true");
    });

    test("Update step creates branch and commits .nvmrc when not up to date", async () => {
      // given
      const actionPath = path.join(process.cwd(), "update-node-version", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const updateStep = action.runs.steps.find((step) =>
        step.name?.includes("Update .nvmrc"),
      );

      // then
      expect(updateStep).toBeDefined();
      expect(updateStep.if).toContain("steps.check-nvmrc.outputs.UP_TO_DATE");
      expect(updateStep.run).toContain("git checkout -b update-node-version-to-${{ steps.get-latest-node.outputs.LATEST_VERSION }}");
      expect(updateStep.run).toContain("git commit -m");
      expect(updateStep.run).toContain("git push origin update-node-version-to-${{ steps.get-latest-node.outputs.LATEST_VERSION }}");
    });

    test("Create Pull Request step uses gh and receives token from inputs", async () => {
      // given
      const actionPath = path.join(process.cwd(), "update-node-version", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const prStep = action.runs.steps.find((step) =>
        step.name?.includes("Pull Request"),
      );

      // then
      expect(prStep).toBeDefined();
      expect(prStep.run).toContain("gh pr create");
      expect(prStep.env).toBeDefined();
      expect(prStep.env.GITHUB_TOKEN).toContain("inputs.token");
    });
  });

  describe("Action Security", () => {
    test("all run steps use bash shell", async () => {
      // given
      const actionPath = path.join(process.cwd(), "update-node-version", "action.yml");
      const content = await fs.readFile(actionPath, "utf8");
      const action = yaml.parse(content);

      // when
      const shellSteps = action.runs.steps.filter((step) => step.run);

      // then
      shellSteps.forEach((step) => {
        expect(step.shell).toBe("bash");
      });
    });
  });
});
