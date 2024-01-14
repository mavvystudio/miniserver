export const headerKey = 'X-CONTEXT-BAGGAGE';

const ctx = new Map<string, any>();

export const data = () => {
  const d: { [k: string]: any } = {};
  ctx.forEach((value, key) => {
    d[key] = value;
  });
  return d;
};

const parse = (value: any) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

export const save = (ctxString?: string) => {
  if (ctxString === undefined || ctxString === null) {
    return undefined;
  }

  const arr = ctxString.split(';');

  arr.forEach((current) => {
    if (!current) {
      return false;
    }
    const item = current.split('=');

    ctx.set(item[0], parse(item[1]));
  });
};

export const add = (key: string, value: any) => {
  ctx.set(key, value);
};

export const toString = () => {
  const o = data();

  return Object.entries(o).reduce(
    (prev, current) =>
      prev.concat(`${current[0]}=${JSON.stringify(current[1])};`),
    '',
  );
};

export const clear = () => {
  ctx.clear();
};

export const extract = (req: any) => req.headers[headerKey.toLowerCase()];
