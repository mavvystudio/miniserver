import http from 'node:http';
import mongoose from 'mongoose';

export type CustomServer = { preInit: any };

export type ServiceItem = {
  name: string;
  url: string;
  methods: string[];
};

export type Handler = {
  name: string;
  handler: Function;
};

export type Res = http.ServerResponse & { json: any };

export type Req = http.IncomingMessage & { input: any };

export type JsonOptions = { status?: number };

export type AppSchema = {
  name: string;
  fields: any;
  options?: any;
  apiActions: {
    create: boolean;
    update: boolean;
  };
};

export type HandlerParams = {
  req: Req;
  res: Res;
  input?: any;
  mongoose: typeof mongoose;
  db: any;
};

export type HandlerFn = (
  params: HandlerParams,
) => Promise<{ data: null | any; error: null | string }>;
