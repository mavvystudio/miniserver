import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET!;
const jwtAlgorithm = process.env.JWT_ALGORITHM!;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN!;

export type Payload = {
  id: string;
  clientToken: string;
};

export const generate = (payload: Payload, o?: jwt.SignOptions) => {
  const expiresIn = jwtExpiresIn;
  const algorithm = jwtAlgorithm;
  const options: any = {
    expiresIn,
    algorithm,
  };
  const token = jwt.sign(payload, jwtSecret, {
    ...(o || {}),
    ...options,
  });

  return token;
};

const verify = async (token: string) => {
  return jwt.verify(token, jwtSecret);
};

const decode = async (token: string) => {
  await verify(token);

  return jwt.decode(token, { complete: true });
};

/**
 * Will verify and decode the token.
 */
export const verifyAndDecode = (token: string) => decode(token);
