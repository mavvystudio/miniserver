import express from 'express';
import mongoose from 'mongoose';

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

const runHandler = async ({ input, handler }: any) => {
  const options = {
    currentModel: mongoose.model(defaultModelName),
    model: mongoose.model,
    input,
  };

  const data = await handler(options);

  return data;
};

export const serve = async (models: ServiceModel[], handlers: Handler[]) => {
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
