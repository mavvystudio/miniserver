#!/usr/bin/env node

import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { execSync, spawn } from 'child_process';

const schemaFile = '_schema.js';
const serverFile = '_config.js';
const buildDir = process.env.BUILD_DIR || '.miniserver';
const argv = process.argv;

const build = () => {
  fse.emptyDirSync(buildDir);
  execSync(`tsc --outDir "${buildDir}"`);

  const fileContent = `import * as service from '@mavvy/miniserver';
import path from 'path';

const init = async () => {
  const customServer = await service.utils.importFile(path.join(process.cwd(), '${buildDir}/${serverFile}'));
  const schema = await service.utils.importFile(path.join(process.cwd(), '${buildDir}/${schemaFile}'));
  const handlers = await service.utils.link(process.cwd(), '${buildDir}', ['${serverFile}', '${schemaFile}', 'index.js']);

  service.server.serve(customServer, handlers, schema);
}

init();
`;
  const filePath = path.join(buildDir, 'index.js');

  fs.writeFileSync(filePath, fileContent);
};

if (argv[2] === 'start') {
  build();
  const runner = spawn(`node ${buildDir}/index.js`, { shell: true });

  runner.stdout.on('data', (data) => console.log(data.toString()));
  runner.stderr.on('data', (data) => console.log(data.toString()));

  process.on('SIGINT', () => {
    process.exit();
  });
}

if (argv[2] === 'build') {
  build();
}
