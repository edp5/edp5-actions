import fs from "fs/promises";
import path from "path";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

export async function createAction(name, description = "", baseDir = process.cwd()) {
  if (!name || typeof name !== "string") {
    throw new Error("name is required and must be a string");
  }

  const targetDir = path.resolve(baseDir, name);
  const templatePath = path.resolve(baseDir, "action-template.txt");

  // Check if target exists
  const stat = await fs.stat(targetDir).catch(() => null);
  if (stat) {
    throw new Error(`Target directory already exists: ${targetDir}`);
  }

  // Read template
  const template = await fs.readFile(templatePath, "utf8").catch(() => null);
  if (template === null) {
    throw new Error(`Template not found at ${templatePath}`);
  }

  // Replace placeholders (<name> and <description>) — apply both replacements
  const result = template.replace(/<name>/g, name).replace(/<description>/g, description);

  // Create directory and write action.yml
  await fs.mkdir(targetDir, { recursive: true });
  const actionPath = path.join(targetDir, "action.yml");
  await fs.writeFile(actionPath, result, "utf8");

  return { targetDir, actionPath };
}

// CLI
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const argv = yargs(hideBin(process.argv))
    .option("name", {
      type: "string",
      describe: "Action name",
      demandOption: true,
    })
    .option("description", {
      type: "string",
      describe: "Action description",
      demandOption: true,
    })
    .help()
    .parse();

  createAction(argv.name, argv.description)
    .then(({ actionPath }) => {
      console.log(`Created ${actionPath} from template.`);
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exitCode = 1;
    });
}
