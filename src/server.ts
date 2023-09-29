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
    const { input, serviceMethod } = req.body;
    const targetHandler = handlers.find((d) => d.name === serviceMethod);
    const data = await runHandler({
      input,
      handler: targetHandler!.handler,
      serviceMethod,
    });
    const result = { data };
    res.json(result);
  });

  app.listen(PORT, () => {
    console.log(`🚀  Server ready at: ${PORT}`);
  });
};
