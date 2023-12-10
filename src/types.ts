import http from 'node:http';

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
