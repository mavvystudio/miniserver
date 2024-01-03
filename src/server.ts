import http from 'node:http';
import mongoose from 'mongoose';

import type {
  CustomServer,
  Handler,
  Req,
  Res,
  JsonOptions,
  AppSchema,
  HandlerParams,
  Services,
} from './types';

import { createDbParams, initDb, initModels } from './db.js';
import { handleMultipartForm } from './form.js';
import { createJsonStr } from './utils.js';
import { convert } from './service.js';

const getEnvDataField = (val?: string) => {
  if (!val) {
    return false;
  }
  const v = val.toLowerCase();
  return v === 'true';
};

const privateNames = ['index', '_server', '_schema'];

const PORT = Number(process.env.PORT) || 3000;
const excludeDataField = getEnvDataField(process.env.EXCLUDE_DATA_FIELD);

const ROOT_URI = process.env.ROOT_URI || '/api';

const sendError = (
  error: string,
  status: number,
): [{ data: null; error: string }, { status: number }] => [
  { data: null, error },
  { status },
];

const handleCustomServer = async (
  customServer: CustomServer,
  server: http.Server,
) => {
  if (!customServer) {
    return false;
  }

  if (customServer.preInit) {
    await customServer.preInit(server);
  }
};

const handleRequest = async (
  handler: {
    [k: string]: {
      handler: (
        params: HandlerParams,
      ) => Promise<{ data: null | any; error: string | null }>;
      model?: string;
    };
  },
  params: any,
  req: Req,
  res: Res,
) => {
  const inputData = await req.input;
  if (!inputData) {
    return res.json(...sendError('server_error', 500));
  }
  const target = handler[inputData.handler];
  if (!target) {
    return res.json(...sendError('not_found', 404));
  }
  const dbParams = createDbParams(inputData, target.model);

  try {
    const data = await target.handler({
      ...params,
      req,
      res,
      input: inputData.input,
      mongoose,
      db: dbParams,
    });

    if (excludeDataField) {
      res.json(data);
    } else {
      res.json({ data });
    }
  } catch (e: any) {
    res.json(...sendError(e.message, 400));
  }
};

/**
 * Converts the handlers array into an Object. Where
 * the key is the name f the file and the value
 * is an Object that has contains
 * handler and model.
 */
const createHandlersObject = (handlers: Handler[]) =>
  handlers.reduce((prev, current) => {
    if (privateNames.includes(current.name)) {
      return prev;
    }
    return {
      ...prev,
      [current.name]: {
        handler: current.handler,
        model: current.model,
      },
    };
  }, {});

/**
 * Returns an object that contains an input function.
 * The input function reads the data on the
 * Request which returns a Promise.
 */
const bodyParser = (req: http.IncomingMessage) => ({
  input: new Promise((resolve) => {
    const contentType = req.headers['content-type'];
    if (contentType?.includes('multipart/form-data')) {
      return handleMultipartForm(req, resolve);
    }
    const data: string[] = [];

    req.on('data', (chunk) => {
      data.push(chunk);
    });
    req.on('end', () => {
      try {
        const d = JSON.parse(data.join(''));
        resolve(d);
      } catch (e) {
        console.log('body_parse_error', data);
        resolve(null);
      }
    });
  }),
});

const json = (res: http.ServerResponse) => ({
  json: (data: any, options?: JsonOptions) => {
    const jsonData = createJsonStr(data);
    const status = options?.status || 200;

    if (!jsonData) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.write(
        JSON.stringify({ data: null, error: 'invalid_json_structure' }),
      );
      res.end();
      return undefined;
    }

    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.write(jsonData);
    res.end();
  },
});

export const serve = async (
  customServer: CustomServer,
  handlers: Handler[],
  schema: AppSchema[],
  services: Services | null,
) => {
  const httpServer = http.createServer();
  const handlersObj = createHandlersObject(handlers);
  const servicesData = convert(services);
  const params: any = {};

  if (servicesData) {
    params.services = servicesData.param.services;
  }

  await initDb();

  initModels(schema);

  await handleCustomServer(customServer, httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀  Server ready at: ${PORT}`);
  });

  httpServer.on('request', (req: Req, res: Res) => {
    Object.assign(res, json(res));
    Object.assign(req, bodyParser(req));

    if (req.url === ROOT_URI && req.method === 'POST') {
      handleRequest(handlersObj, params, req, res);
    } else {
      res.json(...sendError('not_allowed', 400));
    }
  });
};
