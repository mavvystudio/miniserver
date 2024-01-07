import http from 'node:http';
import mongoose from 'mongoose';

import type {
  Config,
  Handler,
  Req,
  Res,
  JsonOptions,
  AppSchema,
  HandlerParams,
} from './types';

import { createDbParams, initDb, initModels } from './db.js';
import { handleMultipartForm } from './form.js';
import { createJsonStr } from './utils.js';
import { convert } from './service.js';
import { createHandlersObject } from './handler.js';

const defaultRootUri = '/api';
const PORT = Number(process.env.PORT) || 3000;

export const sendError = (
  error: string,
  status: number,
): [{ data: null; error: string }, { status: number }] => [
  { data: null, error },
  { status },
];

export const handlePreInit = async (
  config: Config | null | undefined,
  server: http.Server,
) => {
  if (!config) {
    return null;
  }

  if (config.PRE_INIT) {
    await config.PRE_INIT(server);
  }
};

export const handleRequest = async (
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

  try {
    const dbParams = createDbParams(inputData, target.model);
    const data = await target.handler({
      ...params,
      req,
      res,
      input: inputData.input,
      mongoose,
      db: dbParams,
    });

    res.json({ data });
  } catch (e: any) {
    res.json(...sendError(e.message, 400));
  }
};

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

    const body = req.headers['body'] as string;
    if (body) {
      try {
        const d = JSON.parse(body);
        resolve(d);
      } catch (e) {
        console.log('body_parse_error', body);
        resolve(null);
      }
      return null;
    }

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

export const handleCors = (res: Res, config: Config) => {
  if (config.DISABLE_CORS) {
    return false;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'HEAD, OPTIONS, POST, GET');
  res.setHeader('Access-Control-Max-Age', 2592000); // 30 days
  res.setHeader('Access-Control-Allow-Headers', '*');
};

export const validateRequest = (req: Req, rootUri: string) => {
  return req.url === rootUri && req.method === 'POST';
};

export const createRootUri = (config: Config) => {
  return config?.ROOT_URI || defaultRootUri;
};

const httpServerOnRequest =
  (config: Config, handlersObj: any, params: any) => (req: Req, res: Res) => {
    handleCors(res, config);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    Object.assign(res, json(res));
    Object.assign(req, bodyParser(req));

    const rootUri = createRootUri(config);
    const isValidRequest = validateRequest(req, rootUri);

    if (isValidRequest) {
      handleRequest(handlersObj, params, req, res);
    } else {
      res.json(...sendError('not_allowed', 400));
    }
  };

export const serve = async (
  config: Config,
  handlers: Handler[],
  schema: AppSchema[],
) => {
  const httpServer = http.createServer();
  const handlersObj = createHandlersObject(handlers);
  const servicesData = convert(config?.SERVICES);
  const params = {
    services: servicesData ? servicesData.param.services : undefined,
  };

  await initDb(process.env.MONGO_URI);

  initModels(schema);

  await handlePreInit(config, httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀  Server ready at: ${PORT}`);
  });

  const requestHandler = httpServerOnRequest(config, handlersObj, params);

  httpServer.on('request', requestHandler);
};
