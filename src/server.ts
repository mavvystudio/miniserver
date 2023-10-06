import express from 'express';
import mongoose from 'mongoose';

type ServiceItem = {
  name: string;
  url: string;
  methods: string[];
};

type Handler = {
  name: string;
  handler: Function;
};

type ServiceModel = {
  name: string;
  schema: mongoose.Schema;
  schemaOptions: mongoose.SchemaOptions;
};

const app = express();

app.use(express.json());

const PORT = Number(process.env.PORT);
const defaultModelName = process.env.DEFAULT_MODEL!;

const initModels = (models: ServiceModel[]) => {
  models.forEach((item) => {
    const schema = new mongoose.Schema(item.schema, item.schemaOptions);
    mongoose.model(item.name, schema);
  });
};

const runHandler = async ({ input, handler, services }: any) => {
  const options = {
    currentModel: mongoose.model(defaultModelName),
    model: mongoose.model,
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

export const serve = async (
  models: ServiceModel[],
  handlers: Handler[],
  servicesConfigFile: null | string,
) => {
  const servicesData = getServices(servicesConfigFile);
  const services = createServices(servicesData);

  await mongoose.connect(process.env.MONGODB_URI!);

  initModels(models);

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
