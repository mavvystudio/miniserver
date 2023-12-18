import { HandlerFn } from '@mavvy/miniserver';

export const handler: HandlerFn<{ name: string }> = async ({
  mongoose,
  input,
}) => {
  const model = mongoose.model('Product');
  const res = await model.create(input);

  return res;
};
