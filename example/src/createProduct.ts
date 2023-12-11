export const handler = async ({ mongoose, input }) => {
  const model = mongoose.model('Product');
  const res = await model.create(input);

  return res;
};
