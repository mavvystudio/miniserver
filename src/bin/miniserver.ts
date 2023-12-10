#!/usr/bin/env node

import * as fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { execSync, spawn } from 'child_process';

const configFile = 'miniserver.config.js';
const schemaFile = 'schema.js';
const buildDir = '.miniserver';
const argv = process.argv;

if (argv[2] === 'start') {
  fse.emptyDirSync(buildDir);
  execSync(`tsc --outDir "${buildDir}"`);

  const fileContent = `import * as service from '@mavvy/miniserver';
import path from 'path';

const init = async () => {
  const customServer = await service.utils.importFile(path.join(process.cwd(), '${buildDir}/_server.js'));
  const schema = await service.utils.importFile(path.join(process.cwd(), '${buildDir}/_schema.js'));

  const configFile = await service.utils.importFile(path.join(process.cwd(), '${configFile}'));
  const handlers = await service.utils.link(process.cwd(), '${buildDir}', ['_server.js', '_schema.js']);

  service.server.serve(customServer, handlers, schema);
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
