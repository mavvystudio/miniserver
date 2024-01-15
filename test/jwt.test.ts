process.env.JWT_ALGORITHM = 'HS256';
process.env.JWT_EXPIRES_IN = '1y';
process.env.JWT_SECRET = 'secret';

import * as jwt from '../src/jwt';
import * as jsonwebtoken from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('jwt', () => {
  it('should generate', () => {
    jwt.generate({ id: 'foo', clientToken: 'token' });
    const spy = jest.spyOn(jsonwebtoken, 'sign');
    expect(spy).toHaveBeenCalledWith(
      { id: 'foo', clientToken: 'token' },
      'secret',
      {
        expiresIn: '1y',
        algorithm: 'HS256',
      },
    );
  });

  it('should verify and decode', async () => {
    const spy = jest.spyOn(jsonwebtoken, 'verify');
    const decodeSpy = jest.spyOn(jsonwebtoken, 'decode');
    await jwt.verifyAndDecode('TOKEN');

    expect(spy).toHaveBeenCalledWith('TOKEN', 'secret');
    expect(decodeSpy).toHaveBeenCalledWith('TOKEN', { complete: true });
  });
});
