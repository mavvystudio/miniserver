import path from 'path';
import fs from 'fs-extra';

export const importFile = async (path: string) => {
  try {
    const data = await import(path);

    if (data.default) {
      return data.default;
    }
    return data;
  } catch (e) {
    return undefined;
  }
};

export const readFile = (path: string) =>
  new Promise((resolve) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        return resolve(null);
      }
      resolve(data.toString());
    });
  });

export const link = async (cwd: string, target: string, omit?: string[]) => {
  const targetDir = path.join(cwd, target);

  const files = fs.readdirSync(targetDir);
  const filtered = files.filter((item) => {
    if (omit?.includes(item)) {
      return false;
    }
    const stats = fs.statSync(path.join(cwd, target, item));
    return !stats.isDirectory();
  });

  const fileNames = filtered.map((item) => item.split('.')[0]);

  const fileImports = filtered.map(
    (item) => import(`${cwd}/${target}/${item}`),
  );
  const fileContents = await Promise.all(fileImports);
  const items = fileNames.map((name, index) => ({
    ...fileContents[index],
    name,
  }));

  return items;
};