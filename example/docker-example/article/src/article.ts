import { articleData } from './data/data.js';

export const handler = async ({ input, services }) => {
  const userArticles = articleData.filter((item) => item.user === input);

  if (!userArticles.length) {
    return [];
  }

  const comments = await Promise.all(
    userArticles.map((item) => services.comment.comments(item.id)),
  );

  return userArticles.map((item, index) => {
    return {
      ...item,
      comments: comments[index].data,
    };
  });
};
