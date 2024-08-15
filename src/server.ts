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
import * as ctx from './context.js';
import * as auth from './auth.js';

const defaultRootUri = '/api';
const PORT = Number(process.env.PORT) || 3000;

const createContext = (req: any) => {
  const contextStr = ctx.extract(req);

  ctx.save(contextStr);
};

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

export const handleRequest = async ({
  handler,
  req,
  res,
  services,
  config,
}: {
  handler: {
    [k: string]: {
      handler: (
        params: HandlerParams,
      ) => Promise<{ data: null | any; error: string | null }>;
      model?: string;
      roles?: string[];
    };
  };
  services: any;
  req: Req;
  res: Res;
  config?: Config;
}) => {
  const inputData = await req.input;

  if (!inputData) {
    return res.json(...sendError('server_error', 200));
  }

  const target = handler[inputData.handler];

  if (!target) {
    return res.json(...sendError('not_found', 200));
  }

  const dbParams = createDbParams(inputData, target.model);

  try {
    await auth.handleAuth({
      db: dbParams,
      req,
      res,
      config,
      services,
      roles: target.roles,
    });
    auth.verifyContextRole(target.roles);

    const data = await target.handler({
      services,
      req,
      res,
      input: inputData.input,
      mongoose,
      db: dbParams,
      context: ctx,
    });

    res.json({ data });
  } catch (e: any) {
    res.json(...sendError(e.message, 200));
  }
};

export const generateInput = (req: http.IncomingMessage) => {
  return new Promise((resolve) => {
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
        console.log('body_parse_error:body', body);
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
        console.log('body_parse_error:data', data);
        resolve(null);
      }
    });
  });
};

/**
 * Returns an object that contains an input function.
 * The input function reads the data on the
 * Request which returns a Promise.
 */
export const bodyParser = (req: http.IncomingMessage) => ({
  input: generateInput(req),
});

export const generateJsonResponse = (res: http.ServerResponse) => {
  return (data: any, options?: JsonOptions) => {
    const jsonData = createJsonStr(data);
    const status = options?.status || 200;

    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.write(jsonData);
    res.end();
  };
};

const json = (res: http.ServerResponse) => ({
  json: generateJsonResponse(res),
});

export const handleCors = (res: Res, config?: Config) => {
  if (config?.DISABLE_CORS) {
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
  (config: Config, handlersObj: any, params: { services: any }) =>
  (req: Req, res: Res) => {
    handleCors(res, config);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    createContext(req);

    Object.assign(res, json(res));
    Object.assign(req, bodyParser(req));

    const rootUri = createRootUri(config);
    const isValidRequest = validateRequest(req, rootUri);

    if (isValidRequest) {
      handleRequest({
        handler: handlersObj,
        services: params.services,
        req,
        res,
        config,
      });
    } else {
      res.json(...sendError('not_allowed', 200));
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

  await initDb(process.env.MONGO_URI, config?.MONGOOSE_CONNECT_OPTIONS);

  initModels(schema);

  await handlePreInit(config, httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀  Server ready at: ${PORT}`);
  });

  const requestHandler = httpServerOnRequest(config, handlersObj, params);

  httpServer.on('request', requestHandler);
};
