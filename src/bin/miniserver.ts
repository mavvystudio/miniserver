#!/usr/bin/env node

import * as fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { execSync, spawn } from 'child_process';

const servicesConfigFile = 'servicesconfig.json';
const buildDir = '.miniserver';
const argv = process.argv;

if (argv[2] === 'start') {
  fse.emptyDirSync(buildDir);
  execSync(`tsc --outDir "${buildDir}"`);

  const fileContent = `import * as service from '@mavvy/miniserver';
import path from 'path';

const init = async () => {
  const customServer = await service.utils.importFile(path.join(process.cwd(), '${buildDir}/server.js'));
  const servicesFile = await service.utils.readFile(path.join(process.cwd(), '${servicesConfigFile}'));
  const handlers = await service.utils.link(process.cwd(), '${buildDir}/handlers');

  service.server.serve(customServer, handlers, servicesFile);
}

init();
`;
  const filePath = path.join(buildDir, 'index.js');

  fs.writeFileSync(filePath, fileContent);

  const runner = spawn(`node ${buildDir}/index.js`, { shell: true });

  runner.stdout.on('data', (data) => console.log(data.toString()));
  runner.stderr.on('data', (data) => console.log(data.toString()));

  process.on('SIGINT', () => {
    process.exit();
  });
}
