import http from 'node:http';
import mongoose from 'mongoose';

import {
  CustomServer,
  Handler,
  Req,
  Res,
  JsonOptions,
  AppSchema,
} from './types';

const privateNames = ['_server', '_schema'];

const PORT = Number(process.env.PORT);

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

const getModelFromHandler = (handler: string) => {
  const data = handler
    .split('')
    .map((d) => {
      const u = d.toUpperCase();
      if (u === d) {
        return `,${d}`;
      }
      return d;
    })
    .join('')
    .split(',');
  const target = data.length > 1 ? data.pop() : null;

  return target;
};

const createDbParams = (inputData: { handler: string; input: any }) => {
  const modelName = getModelFromHandler(inputData.handler);
  const model = modelName ? mongoose.model(modelName) : null;

  return {
    modelName,
    model,
    create: async (input?: any) => model?.create(input || inputData.input),
  };
};

const handleRequest = async (
  handler: { [k: string]: Function },
  req: Req,
  res: Res,
) => {
  const inputData = await req.input();
  const target = handler[inputData.handler];
  if (!target) {
    return res.json({ data: null, error: 'not_found' }, { status: 404 });
  }
  const dbParams = createDbParams(inputData);
  try {
    const data = await target({
      req,
      res,
      input: inputData.input,
      mongoose,
      db: dbParams,
    });
    res.json({ data });
  } catch (e: any) {
    res.json({ data: null, error: e.message }, { status: 400 });
  }
};

const createHandlersObject = (handlers: Handler[]) =>
  handlers.reduce((prev, current) => {
    if (privateNames.includes(current.name)) {
      return prev;
    }
    return {
      ...prev,
      [current.name]: current.handler,
    };
  }, {});

const initModels = (schema: AppSchema[]) => {
  schema.forEach((item) => {
    mongoose.model(item.name, new mongoose.Schema(item.fields, item.options));
  });
};

const initDb = async () => {
  const db = await mongoose.connect(process.env.MONGO_URI!);
  console.log('connected to db');
  return db;
};

const bodyParser = (req: http.IncomingMessage) => ({
  input: () => {
    return new Promise((resolve, reject) => {
      let data = '';

      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        try {
          const d = JSON.parse(data);
          resolve(d);
        } catch (e) {
          console.log('body_parse_error', data);
          reject(null);
        }
      });
    });
  },
});

const json = (res: http.ServerResponse) => ({
  json: (data: any, options?: JsonOptions) => {
    const status = options?.status || 200;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(data));
    res.end();
  },
});

export const serve = async (
  customServer: CustomServer,
  handlers: Handler[],
  schema: AppSchema[],
) => {
  const httpServer = http.createServer();
  const handlersObj = createHandlersObject(handlers);

  await initDb();

  initModels(schema);

  await handleCustomServer(customServer, httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀  Server ready at: ${PORT}`);
  });

  httpServer.on('request', (req: Req, res: Res) => {
    Object.assign(res, json(res));
    Object.assign(req, bodyParser(req));

    if (req.url === '/api' && req.method === 'POST') {
      handleRequest(handlersObj, req, res);
    } else {
      res.json({ data: null, error: 'not_allowed' }, { status: 400 });
    }
  });
};
