import { commentData } from "./commentData/data.js";

export const handler = ({ input }) =>
  commentData.filter((item) => item.articleId === input);
