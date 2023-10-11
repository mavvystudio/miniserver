import express from 'express';

type ServiceItem = {
  name: string;
  url: string;
  methods: string[];
};

type Handler = {
  name: string;
  handler: Function;
};

const app = express();

app.use(express.json());

const PORT = Number(process.env.PORT);

const runHandler = async ({ context, input, handler, services }: any) => {
  const options = {
    context,
    input,
    services,
  };

  const data = await handler(options);

  return data;
};

const createServices = (s: null | ServiceItem[]) => {
  if (!s) {
    return null;
  }

  const fetcher = async (name: string, url: string, input: any) => {
    const res = await fetch(`${url}/service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceMethod: name,
        input,
      }),
    });
    return res.json();
  };
  return s.reduce(
    (prev, current) => ({
      ...prev,
      [current.name]: current.methods.reduce(
        (p, c) => ({
          ...p,
          [c]: (input?: any) => fetcher(c, current.url, input),
        }),
        {},
      ),
    }),
    {},
  );
};

const getServices = (fileData: string | null) => {
  if (!fileData) {
    return null;
  }
  const jsonData = JSON.parse(fileData);
  const servicesData = Object.entries(jsonData).reduce(
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

type CustomServer = { preInit: any };

export const serve = async (
  customServer: null | CustomServer,
  handlers: Handler[],
  servicesConfigFile: null | string,
) => {
  const context = {};
  const addContext = (props: any) => {
    if (props) {
      Object.assign(context, props);
    }
  };
  if (customServer) {
    await customServer.preInit({ addContext });
  }

  const servicesData = getServices(servicesConfigFile);
  const services = createServices(servicesData);

  app.post('/service', async (req, res) => {
    if (!handlers || !handlers.length) {
      return res.json({
        data: null,
        error: {
          title: 'handlers_not_found',
        },
      });
    }
    const { input, serviceMethod } = req.body;

    if (!serviceMethod) {
      return res.json({
        data: null,
        error: {
          title: 'service_method_not_found',
        },
      });
    }

    const targetHandler = handlers.find((d) => d.name === serviceMethod);
    if (!targetHandler) {
      return res.json({
        data: null,
        error: {
          title: 'handler_not_found',
        },
      });
    }
    try {
      const data = await runHandler({
        context,
        input,
        handler: targetHandler!.handler,
        serviceMethod,
        services,
      });
      const result = { data };
      res.json(result);
    } catch (e: any) {
      res.json({
        data: null,
        error: {
          title: 'handler_error',
          message: e.message,
        },
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀  Server ready at: ${PORT}`);
  });
};
