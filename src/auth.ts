import mongoose from 'mongoose';
import * as ctx from './context.js';
import { Req, Res, Config } from './types';
import * as jwt from './jwt.js';

export const userContextKey = '_user';

export const verifyRole = (
  user?: { id: string; role: string },
  roles?: string[],
) => {
  if (!roles || !roles.length) {
    return false;
  }
  if (!user || !user?.role || !roles.includes(user?.role)) {
    throw new Error('unauthorized');
  }
};

export const addUserContext =
  (context: Partial<{ add: (k: string, v: any) => void }>) =>
  (id: string, role: string) => {
    context.add!(userContextKey, {
      id,
      role,
    });
  };

export const verifyContextRole = (roles?: string[]) => {
  verifyRole(ctx.data()[userContextKey], roles);
};

export const handleAuth = async (o: {
  req: Req;
  res: Res;
  services?: any;
  config?: Config;
  roles?: string[];
  db: any;
}) => {
  if (!o.roles || !o.roles.length) {
    return false;
  }

  if (!o.config?.AUTH_HANDLER) {
    throw new Error('unhandled_authorization');
  }

  const data = await o.config.AUTH_HANDLER({
    jwt,
    ctx,
    req: o.req,
    res: o.res,
    services: o.services,
    roles: o.roles,
    db: o.db,
    mongoose,
  });

  addUserContext(ctx)(data.id, data.role);
};
