import * as server from '../src/server';
import * as form from '../src/form';
import * as auth from '../src/auth';

jest.mock('../src/form');
jest.mock('../src/auth');

const req = {
  headers: {
    'content-type': 'multipart/form-data',
  },
} as any;

describe('server', () => {
  it('sendError should return an error structure', () => {
    const result = server.sendError('not_found', 404);
    expect(result[0]).toEqual({ data: null, error: 'not_found' });
    expect(result[1]).toEqual({ status: 200 });
  });

  describe('handlePreInit ', () => {
    it('should return null if config is not set', async () => {
      const result = await server.handlePreInit(null, {} as any);
      expect(result).toBeNull();
    });

    it('should do nothing if config has no PRE_INIT hook', async () => {
      const result = await server.handlePreInit({}, {} as any);
      expect(result).toBeUndefined();
    });

    it('should call the PRE_INIT hook', async () => {
      const configData = { PRE_INIT: async () => {} };
      const serverData = {} as any;
      const spy = jest.spyOn(configData, 'PRE_INIT');
      const result = await server.handlePreInit(configData, serverData);
      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalledWith({});
    });
  });

  describe('handleRequest', () => {
    const res: any = { json: (data: any, status: any) => ({ data, status }) };
    const params: any = { foo: true };
    const handler: any = {
      fiz: {
        handler: () => 'foo',
      },
    };

    const spy = jest.spyOn(res, 'json');

    it('should sendError if input does not exist', async () => {
      const reqErr: any = {
        input: new Promise((resolve) => resolve(null)),
      };
      await server.handleRequest({
        handler,
        services: params,
        req: reqErr,
        res,
      });
      expect(spy).toHaveBeenCalledWith(
        { data: null, error: 'server_error' },
        { status: 200 },
      );
    });

    it('should sendError if target handler cannot be found', async () => {
      const req: any = {
        input: new Promise((resolve) => resolve({ handler: 'baz' })),
      };
      await server.handleRequest({ handler, services: params, req, res });
      expect(spy).toHaveBeenCalledWith(
        { data: null, error: 'not_found' },
        { status: 200 },
      );
    });

    it('should sendError if target handler throws an error', async () => {
      const req: any = {
        input: new Promise((resolve) => resolve({ handler: 'bar' })),
      };
      const handlerErr: any = {
        bar: {
          handler: () => {
            throw new Error('err_message');
          },
        },
      };
      await server.handleRequest({
        handler: handlerErr,
        services: params,
        req,
        res,
      });
      expect(spy).toHaveBeenCalledWith(
        { data: null, error: 'err_message' },
        { status: 200 },
      );
    });

    it('should response a data', async () => {
      const req: any = {
        input: new Promise((resolve) => resolve({ handler: 'fiz' })),
      };

      await server.handleRequest({ handler, services: params, req, res });

      expect(spy).toHaveBeenCalledWith({ data: 'foo' });
    });

    it('should call auth functions', async () => {
      const req: any = {
        input: new Promise((resolve) => resolve({ handler: 'fiz' })),
      };
      const handleAuthSpy = jest
        .spyOn(auth, 'handleAuth')
        .mockImplementation(
          (_params: any) => new Promise<any>((resolve) => resolve(true)),
        );
      const verifyContextRoleSpy = jest
        .spyOn(auth, 'verifyContextRole')
        .mockImplementation((_roles: any) => true);

      await server.handleRequest({ handler, services: params, req, res });

      expect(handleAuthSpy).toHaveBeenCalled();
      expect(verifyContextRoleSpy).toHaveBeenCalled();
    });
  });

  it('bodyParser should return an input field', () => {
    const res = server.bodyParser(req as any);
    expect(res.input).toBeTruthy();
  });

  describe('generateInput', () => {
    it('should handle multipart/form-data', async () => {
      const spy = jest
        .spyOn(form, 'handleMultipartForm')
        .mockImplementation((_, resolve) => resolve('foo'));
      const res = await server.generateInput(req);

      expect(res).toEqual('foo');
      expect(spy).toHaveBeenCalled();
    });

    it('should handle body', async () => {
      const req = {
        headers: {
          'content-type': 'application/json',
          body: JSON.stringify({ handler: 'foo' }),
        },
      } as any;
      const res = await server.generateInput(req);
      expect(res).toEqual({ handler: 'foo' });
    });

    it('should handle data chunk', async () => {
      const req = {
        headers: {
          'content-type': 'application/json',
        },
        on: (t: string, cb: any) => {
          if (t === 'data') {
            cb(JSON.stringify({ handler: 'foo' }));
          } else {
            cb();
          }
        },
      };
      const res = await server.generateInput(req as any);
      expect(res).toEqual({ handler: 'foo' });
    });
  });

  describe('generateJsonResponse', () => {
    it('should response with the json data', () => {
      const res = {
        writeHead: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      const json = server.generateJsonResponse(res as any);
      json({});
      expect(res.write).toHaveBeenCalledWith('{}');
    });
  });

  describe('handleCors', () => {
    const res = {
      setHeader: jest.fn(),
    } as any;
    it('should not write headers if cors is disabled', () => {
      const result = server.handleCors(res, { DISABLE_CORS: true });
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(result).toEqual(false);
    });

    it('should write headers', () => {
      const result = server.handleCors(res, { DISABLE_CORS: undefined });
      expect(res.setHeader).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('validateRequest', () => {
    it('should have valid request', () => {
      const r: any = {
        url: '/api',
        method: 'POST',
      };
      const result = server.validateRequest(r, '/api');
      expect(result).toEqual(true);
    });
  });

  describe('createRootUri', () => {
    it('should return the root uri from config', () => {
      const config = { ROOT_URI: '/foo' };
      const result = server.createRootUri(config);
      expect(result).toEqual('/foo');
    });

    it('should return the default root uri', () => {
      const config = { ROOT_URI: undefined };
      const result = server.createRootUri(config);
      expect(result).toEqual('/api');
    });
  });
});
