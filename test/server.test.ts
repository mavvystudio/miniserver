import * as server from '../src/server';

describe('server', () => {
  it('sendError should return an error structure', () => {
    const result = server.sendError('not_found', 404);
    expect(result[0]).toEqual({ data: null, error: 'not_found' });
    expect(result[1]).toEqual({ status: 404 });
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
    const params = { foo: true };
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
      await server.handleRequest(handler, params, reqErr, res);
      expect(spy).toHaveBeenCalledWith(
        { data: null, error: 'server_error' },
        { status: 500 },
      );
    });

    it('should sendError if target handler cannot be found', async () => {
      const req: any = {
        input: new Promise((resolve) => resolve({ handler: 'baz' })),
      };
      await server.handleRequest(handler, params, req, res);
      expect(spy).toHaveBeenCalledWith(
        { data: null, error: 'not_found' },
        { status: 404 },
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
      await server.handleRequest(handlerErr, params, req, res);
      expect(spy).toHaveBeenCalledWith(
        { data: null, error: 'err_message' },
        { status: 400 },
      );
    });

    it('should response a data', async () => {
      const req: any = {
        input: new Promise((resolve) => resolve({ handler: 'fiz' })),
      };

      await server.handleRequest(handler, params, req, res);

      expect(spy).toHaveBeenCalledWith({ data: 'foo' });
    });
  });
});
