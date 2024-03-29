import type { ServiceItem, Services } from './types';
import * as ctx from './context.js';

export const fetcher = async (
  name: string,
  url: string,
  input: any,
  headers?: any,
) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
      [ctx.headerKey]: ctx.toString(),
    },
    body: JSON.stringify({
      handler: name,
      input,
    }),
  });

  return res.json();
};

const createServices = (s: null | ServiceItem[]) => {
  if (!s) {
    return null;
  }

  return s.reduce(
    (prev, current) => ({
      ...prev,
      [current.name]: (current.methods || []).reduce(
        (p, c) => ({
          ...p,
          [c]: (input?: any, h?: any) => fetcher(c, current.url, input, h),
        }),
        {},
      ),
    }),
    {},
  );
};

const getServices = (services: Services) => {
  if (!services) {
    return null;
  }

  const servicesData = Object.entries(services).reduce(
    (prev, current: [string, any]) =>
      prev.concat({
        name: current[0],
        url: current[1].url,
        methods: current[1].methods,
      }),
    [] as ServiceItem[],
  );

  return servicesData;
};

/**
const applyContext =
  (services: Services) =>
  async ({ req }: { req: any }) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return '';
    }

    const input = {
      token,
    };

    const res = await fetcher('context', services.auth.url, input);

    return res.data;
  };
*/

export function convert(services?: Services | null) {
  if (!services) {
    return null;
  }

  const servicesData = createServices(getServices(services));

  const param = { services: servicesData };

  /**
  const context = applyContext(services);
   */

  return {
    param,

    // context,
  };
}
