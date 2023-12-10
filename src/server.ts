import http from 'node:http';
import mongoose from 'mongoose';

import { CustomServer, Handler } from './types';

type Res = http.ServerResponse & { json: any };

type Req = http.IncomingMessage & { input: any };

type JsonOptions = { status?: number };

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

const handleRequest = async (
  handler: { [k: string]: Function },
  req: Req,
  res: Res,
) => {
  const input = await req.input();
  const target = handler[input.handler];
  if (!target) {
    return res.json({ data: null, error: 'not_found' }, { status: 404 });
  }
  try {
    const data = await target({ req, res });
    res.json({ data });
  } catch (e: any) {
    res.json({ data: null, error: e.message }, { status: 400 });
  }
};

const privateNames = ['_server'];

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
) => {
  const httpServer = http.createServer();
  const handlersObj = createHandlersObject(handlers);

  await initDb();

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
