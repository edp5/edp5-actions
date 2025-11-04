import fs from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, test } from "vitest";

import { createAction } from "../../scripts/new-action.js";

describe("createAction", () => {
  test("creates directory and action.yml with replaced name", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "new-action-test-"));
    const templatePath = path.join(tmpDir, "action-template.txt");
    const name = "my-action-test";
    const description = "This is a test action";

    // write a template to the tmp dir
    const templateContent = "name: <name>\ndescription: <description>\n";
    await fs.writeFile(templatePath, templateContent, "utf8");

    // run createAction with baseDir = tmpDir
    const { targetDir, actionPath } = await createAction(name, description, tmpDir);

    // assert directory exists
    const stat = await fs.stat(targetDir);
    expect(stat.isDirectory()).toBe(true);

    // assert file exists
    const content = await fs.readFile(actionPath, "utf8");
    expect(content).toContain(`name: ${name}`);
    expect(content).toContain(`description: ${description}`);

    // cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
