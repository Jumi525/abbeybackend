import client from "../utils/prisma";
import { publishEvent } from "../utils/kafka";
import AppError from "../utils/appError";

const NOTIF_TOPIC = process.env.NOTIFICATION_TOPIC || "notifications";

export const createPost = async (
  authorId: string,
  content: string,
  media: string[] = []
) => {
  return client.post.create({
    data: { authorId, content, media },
  });
};

export const getFeed = async () => {
  const posts = await client.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!posts.length) {
    throw new AppError("Post not found", 404);
  }
  return posts;
};

export const getMyFeed = async (userId: string) => {
  const posts = await client.post.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      author: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!posts.length) {
    throw new AppError("Your Feed is Empty", 404);
  }
  return posts;
};

export const toggleLike = async (userId: string, postId: string) => {
  const post = await client.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  if (post.authorId === userId) {
    throw new AppError("You cannot like your own post", 400);
  }

  const existingLike = await client.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  if (existingLike) {
    const unlike = await client.like.delete({
      where: {
        id: existingLike.id,
      },
    });
    const event = {
      type: "UNLIKE",
      actorId: userId,
      recipientId: post.authorId,
      postId,
      meta: {},
      createdAt: new Date().toISOString(),
    };
    publishEvent(NOTIF_TOPIC, event).catch((err) =>
      console.error("Failed to publish LIKE event:", err)
    );
    return { liked: false, unlike };
  } else {
    const like = await client.like.create({
      data: { userId, postId },
    });

    const event = {
      type: "LIKE",
      actorId: userId,
      recipientId: post.authorId,
      postId,
      meta: {},
      createdAt: new Date().toISOString(),
    };
    publishEvent(NOTIF_TOPIC, event).catch((err) =>
      console.error("Failed to publish LIKE event:", err)
    );

    return { liked: true, like };
  }
};

export const commentPost = async (
  userId: string,
  postId: string,
  text: string
) => {
  const post = await client.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) throw new AppError("Post not found", 404);

  if (post.authorId === userId) {
    throw new AppError("You cannot comment on your own post", 400);
  }

  const comment = await client.comment.create({
    data: { userId, postId, text },
  });

  const event = {
    type: "COMMENT",
    actorId: userId,
    recipientId: post.authorId,
    postId,
    meta: { commentId: comment.id, text: text.slice(0, 200) },
    createdAt: new Date().toISOString(),
  };

  publishEvent(NOTIF_TOPIC, event).catch((err) =>
    console.error("Failed to publish COMMENT event:", err)
  );

  return comment;
};
