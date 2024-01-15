import type { Handler } from './types';

const privateNames = ['index', '_config', '_schema'];

/**
 * Converts the handlers array into an Object. Where
 * the key is the name f the file and the value
 * is an Object that has contains
 * handler and model.
 */
export const createHandlersObject = (
  handlers: Handler[],
): { [k: string]: any } =>
  handlers.reduce((prev, current) => {
    const isPrivate = privateNames.includes(current.name);
    const invalidHandler = !current.name || !current.handler;
    if (invalidHandler || isPrivate) {
      return prev;
    }
    return {
      ...prev,
      [current.name]: {
        handler: current.handler,
        model: current.model,
        roles: current.roles,
      },
    };
  }, {});
