import fs from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, test } from "vitest";

import { createAction } from "../../scripts/new-action.js";

describe("createAction", () => {
  test("creates directory and action.yml with replaced name", async () => {
    // given
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "new-action-test-"));
    const templatePath = path.join(tmpDir, "action-template.txt");
    const name = "my-action-test";
    const description = "This is a test action";
    const templateContent = "name: <name>\ndescription: <description>\n";
    await fs.writeFile(templatePath, templateContent, "utf8");

    // when
    const { targetDir, actionPath } = await createAction(name, description, tmpDir);

    // then
    const stat = await fs.stat(targetDir);
    expect(stat.isDirectory()).toBe(true);
    const content = await fs.readFile(actionPath, "utf8");
    expect(content).toContain(`name: ${name}`);
    expect(content).toContain(`description: ${description}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
