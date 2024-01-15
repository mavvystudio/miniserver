import http from 'node:http';
import mongoose from 'mongoose';

export type Config = {
  PRE_INIT?: (server: http.Server) => Promise<any>;
  SERVICES?: Services;
  ROOT_URI?: string;
  DISABLE_CORS?: boolean;
  AUTH_HANDLER?: (...params: any) => Promise<any>;
};

export type ServiceItem = {
  name: string;
  url: string;
  methods: string[];
};

export type Handler = {
  name: string;
  handler: Function;
  model?: string | null;
  roles?: string[];
};

export type Res = http.ServerResponse & {
  json: <T>(
    result: { data: T; error?: null | string },
    options?: { status?: number },
  ) => void;
};

export type Req = http.IncomingMessage & { input: any };

export type JsonOptions = { status?: number };

export type AppSchema = {
  name: string;
  fields: any;
  options?: any;
  apiActions?: {
    create: boolean;
    update: boolean;
  };
};

export type HandlerParams<T = any> = {
  req: Req;
  res: Res;
  input?: T;
  mongoose: typeof mongoose;
  db: {
    modelName?: string | null;
    model: (name?: string) => mongoose.Model<any> | null;
    create: (input?: T) => Promise<any>;
    update: (input?: T) => Promise<any>;
    findById: (id?: string) => undefined | Promise<any>;
  };
};

export type HandlerFn<T = any> = (params: HandlerParams<T>) => Promise<any>;

export type Services = { [k: string]: Omit<ServiceItem, 'name'> };

export type CreateDBParamsOptions = {
  /**
   * handler name.
   */
  handler: string;
  /**
   * input from the request.
   */
  input: any;
};
