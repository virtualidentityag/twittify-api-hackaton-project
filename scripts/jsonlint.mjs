/* eslint-disable no-console */
import chalk from 'chalk';
import fse from 'fs-extra';
import glob from 'globby';
import path from 'path';
import { getWorkspaceRoot } from './utils.mjs';

const passMessage = (message) => `✓ ${chalk.gray(message)}`;
const failMessage = (message) => `✗ ${chalk.whiteBright(message)}`;

async function run() {
  const workspaceRoot = getWorkspaceRoot();

  const eslintignoreContent = await fse.readFile(path.join(workspaceRoot, '.eslintignore'), {
    encoding: 'utf8',
  });
  const eslintignore = eslintignoreContent.split(/\r?\n/).slice(0, -1);

  const filenames = await glob('**/*.json', {
    cwd: workspaceRoot,
    gitignore: true,
    ignore: [...eslintignore, '**/tsconfig*.json', '**/tslint.json'],
  });

  let passed = true;
  const checks = filenames.map(async (filename) => {
    const content = await fse.readFile(path.join(workspaceRoot, filename), { encoding: 'utf8' });
    try {
      JSON.parse(content);
      console.log(passMessage(filename));
    } catch (error) {
      passed = false;
      console.error(failMessage(`Error parsing ${filename}:\n\n${String(error)}`));
    }
  });

  await Promise.allSettled(checks);
  if (passed === false) {
    throw new Error('At least one file did not pass. Check the console output');
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
