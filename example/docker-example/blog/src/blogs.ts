export const handler = async ({ services }) => {
  const articles = await services.article.articles();

  return articles.data;
};
