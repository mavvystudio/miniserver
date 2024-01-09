export const handler = async ({ services, input }) => {
  const articles = await services.article.article(input.userId);

  return articles.data;
};
