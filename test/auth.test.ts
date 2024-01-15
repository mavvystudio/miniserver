import * as auth from '../src/auth';

describe('auth', () => {
  describe('verifyRole', () => {
    it('should return false if no role is defined', () => {
      const res = auth.verifyRole(undefined, undefined);
      expect(res).toBe(false);
    });

    it('should handle verification', () => {
      expect(() => {
        auth.verifyRole(undefined, ['ADMIN']);
      }).toThrowError('unauthorized');
      expect(() => {
        auth.verifyRole({ id: 'a', role: '' }, ['ADMIN']);
      }).toThrowError('unauthorized');
      expect(() => {
        auth.verifyRole({ id: 'a', role: 'Foo' }, ['ADMIN']);
      }).toThrowError('unauthorized');

      const res = auth.verifyRole({ id: 'a', role: 'ADMIN' }, [
        'ADMIN',
        'USER',
      ]);
      expect(res).toBe(undefined);
    });
  });
  it('should add user to context', () => {
    const spy = jest.fn();
    const fn = auth.addUserContext({ add: spy });
    fn('foo', 'bar');
    expect(spy).toHaveBeenCalledWith('_user', { id: 'foo', role: 'bar' });
  });
  describe('handleAuth', () => {
    it('should return immediate if handler is public', async () => {
      const res = await auth.handleAuth({
        req: {},
        res: {},
        services: {},
        config: {},
        roles: undefined,
        db: {},
      } as any);
      expect(res).toEqual(false);
    });

    it('should throw an error if AUTH_HANDLER is undefined', async () => {
      const params: any = {
        req: { headers: { authorization: '' } },
        config: undefined,
        roles: ['ADMIN'],
      };

      expect(() => {
        return auth.handleAuth(params);
      }).rejects.toThrowError('unhandled_authorization');
    });

    it('should call the AUTH_HANDLER', async () => {
      const params: any = {
        req: {
          headers: {
            authorization: 'Bearer Token',
          },
        },
        config: {
          AUTH_HANDLER: jest.fn(),
        },
        roles: ['ADMIN'],
      };

      try {
        await auth.handleAuth(params);
      } catch (e) {}
      expect(params.config.AUTH_HANDLER).toHaveBeenCalled();
    });
  });
});
