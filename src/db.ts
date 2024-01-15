import mongoose from 'mongoose';
import { AppSchema, CreateDBParamsOptions } from './types';
import { capitalizeFirstLetter } from './utils.js';

/**
 * Returns the last uppercased first-letter word
 * from the handler name.
 *
 * @example
 * addProduct will return Product
 */
export const getModelFromHandler = (handler: string) => {
  const isKebab = handler.includes('-');
  const splitter = isKebab ? '-' : '';
  const data = handler
    .split(splitter)
    .map((d) => {
      if (isKebab) {
        return `,${capitalizeFirstLetter(d)}`;
      }
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

export const createMongooseModel = (modelName?: string | null) => {
  if (modelName) {
    try {
      return mongoose.model(modelName);
    } catch (e: any) {
      return null;
    }
  }
  return null;
};

/**
 * Creates an object of mongoose CRUD utilities which is
 * added to the handler function parameters.
 */
export const createDbParams = (
  inputData: CreateDBParamsOptions,
  handlerModel?: string,
) => {
  const modelName = handlerModel || getModelFromHandler(inputData.handler);
  const model = (m?: string) => createMongooseModel(m || modelName);

  return {
    modelName,
    model,
    create: async (input?: any) => model()?.create(input || inputData.input),
    update: async (input?: { id: string } & {}) => {
      const updateInput = input || inputData.input;
      const { id, ...data } = updateInput;
      const item = await model()?.findById(id);
      Object.assign(item, data);
      const res = await item.save();
      return res;
    },
    findById: (id?: string) => model()?.findById(id || inputData.input.id),
  };
};

/**
 * Initialize mongoose db connection. Returns false
 * if env MONGO_URI is not present.
 */
export const initDb = async (uri?: string) => {
  if (!uri) {
    console.log('no_mongo_uri_found');
    return false;
  }
  const db = await mongoose.connect(uri);
  console.log('connected_to_db');
  return db;
};

/**
 * Initialize mongoose models from _schema.ts file.
 */
export const initModels = (schema: AppSchema[]) => {
  if (!schema) {
    console.log('no_schema_found');
    return false;
  }
  schema.forEach((item) => {
    mongoose.model(item.name, new mongoose.Schema(item.fields, item.options));
  });
};
