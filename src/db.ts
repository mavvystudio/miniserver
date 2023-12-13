import mongoose from 'mongoose';
import { AppSchema } from './types';

const getModelFromHandler = (handler: string) => {
  const data = handler
    .split('')
    .map((d) => {
      const u = d.toUpperCase();
      if (u === d) {
        return `,${d}`;
      }
      return d;
    })
    .join('')
    .split(',');
  const target = data.length > 1 ? data.pop() : null;

  return target;
};

export const createDbParams = (inputData: { handler: string; input: any }) => {
  const modelName = getModelFromHandler(inputData.handler);
  const model = modelName ? mongoose.model(modelName) : null;

  return {
    modelName,
    model,
    create: async (input?: any) => model?.create(input || inputData.input),
    update: async (input?: any) => {
      const updateInput = input || inputData.input;
      const { id, ...data } = updateInput;
      const item = await model?.findById(id);
      Object.assign(item, data);
      const res = await item.save();
      return res;
    },
    findById: (id?: string) => model?.findById(id || inputData.input.id),
  };
};

export const initDb = async () => {
  if (!process.env.MONGO_URI) {
    console.log('no_mongo_uri_found');
    return false;
  }
  const db = await mongoose.connect(process.env.MONGO_URI);
  console.log('connected_to_db');
  return db;
};

export const initModels = (schema: AppSchema[]) => {
  if (!schema) {
    console.log('no_schema_found');
    return false;
  }
  schema.forEach((item) => {
    mongoose.model(item.name, new mongoose.Schema(item.fields, item.options));
  });
};
