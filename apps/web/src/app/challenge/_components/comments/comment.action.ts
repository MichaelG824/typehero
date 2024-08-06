'use server';

import { auth } from '~/server/auth';
import { prisma } from '@repo/db';
import type { Comment, CommentRoot, PrismaClient } from '@repo/db/types';
import { isAdminOrModerator, isAuthor } from '~/utils/auth-guards';

/**
 *
 * @param comment a Challenge or Solution-based comment.
 * @returns the prisma create response.
 */
interface CommentToCreate {
  text: string;
  rootType: CommentRoot;
  rootId: number;
}
export async function addComment(comment: CommentToCreate) {
  const session = await auth();

  if (!session?.user?.id) return 'unauthorized';
  if (comment.text.length === 0) return 'text_is_empty';
  if (!session.user.id) return 'unauthorized';
  if (comment.text.length === 0) return 'text_is_empty';

  const { rootId, ...commentToCreate } = {
    ...comment,
    ...(comment.rootType === 'CHALLENGE'
      ? { rootChallengeId: comment.rootId }
      : { rootSolutionId: comment.rootId }),
  };

  return await prisma.comment.create({
    data: {
      ...commentToCreate,
      userId: session.user.id,
    },
  });
}

export async function replyComment(comment: CommentToCreate, parentId: number) {
  const session = await auth();

  if (!session?.user?.id) return 'unauthorized';
  if (comment.text.length === 0) return 'text_is_empty';
  if (!session.user.id) return 'unauthorized';
  if (comment.text.length === 0) return 'text_is_empty';

  const { rootId, ...commentToCreate } = {
    ...comment,
    ...(comment.rootType === 'CHALLENGE'
      ? { rootChallengeId: comment.rootId }
      : { rootSolutionId: comment.rootId }),
  };

  return await prisma.comment.create({
    data: {
      ...commentToCreate,
      parentId,
      userId: session.user.id,
    },
  });
}

export async function updateComment(text: string, id: number) {
  const session = await auth();

  if (!session || !session.user) return 'unauthorized';
  if (text.length === 0) return 'text_is_empty';

  const comment = await prisma.comment.findFirstOrThrow({
    where: {
      id,
    },
  });

  const isAuthorized = isAdminOrModerator(session) || isAuthor(session, comment.userId);
  if (!isAuthorized) {
    return 'unauthorized';
  }

  return await prisma.comment.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      text,
    },
  });
}
/**
 * Deletes a comment given a comment ID. The user must be the author of the comment or have the role of 'ADMIN' or 'MODERATOR'.
 * @param comment_id The ID of the comment to be deleted.
 * @param author The ID of the user who authored the comment.
 * @returns 'unauthorized' if the user is not authorized, 'invalid_comment' if the comment ID is not provided, or undefined if the comment is successfully deleted.
 */
export async function deleteComment(comment_id: number) {
  const session = await auth();

  if (!session) return 'unauthorized';
  if (!comment_id) return 'invalid_comment';

  const rootComment = await prisma.comment.findFirstOrThrow({
    where: {
      id: comment_id,
    },
  });

  const isAuthorized = isAdminOrModerator(session) || isAuthor(session, rootComment.userId);
  if (!isAuthorized) {
    return 'unauthorized';
  }

  await deleteCommentWithChildren(prisma, rootComment);
}

async function deleteCommentWithChildren(prisma: PrismaClient, node: Comment) {
  const children = await prisma.comment.findMany({
    where: {
      parentId: node.id,
    },
  });

  for (const child of children) {
    await deleteCommentWithChildren(prisma, child);
  }

  await prisma.comment.delete({
    where: {
      id: node.id,
    },
  });
}
