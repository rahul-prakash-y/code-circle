import { FastifyRequest, FastifyReply } from 'fastify';
import News from '../models/newsModel';
import mongoose from 'mongoose';

interface NewsQuery {
  search?: string;
  tag?: string;
  page?: string;
  limit?: string;
  includeUnpublished?: string;
}

interface NewsBody {
  title: string;
  content: string;
  coverImage?: string;
  date?: string | Date;
  tags?: string[] | string;
  pinned?: boolean;
  isPublished?: boolean;
}

export const getNews = async (
  request: FastifyRequest<{ Querystring: NewsQuery }>,
  reply: FastifyReply
) => {
  try {
    const { search, tag, page = '1', limit = '20', includeUnpublished } = request.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    // Only allow viewing unpublished if explicitly requested by authorized role
    if (includeUnpublished !== 'true') {
      filter.isPublished = true;
    }

    if (tag && tag.toLowerCase() !== 'all') {
      filter.tags = { $in: [new RegExp(`^${tag}$`, 'i')] };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { content: searchRegex }, { tags: searchRegex }];
    }

    const [total, news] = await Promise.all([
      News.countDocuments(filter),
      News.find(filter)
        .populate('author', 'name rollNo profilePicUrl role')
        .sort({ pinned: -1, date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return reply.send({
      success: true,
      count: news.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      news,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch news feed',
      error: error.message,
    });
  }
};

export const getNewsById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid article ID' });
    }

    const article = await News.findByIdAndUpdate(
      id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).populate('author', 'name rollNo profilePicUrl role');

    if (!article) {
      return reply.status(404).send({ success: false, error: 'News article not found' });
    }

    return reply.send({
      success: true,
      news: article,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to retrieve news article',
      error: error.message,
    });
  }
};

export const createNews = async (
  request: FastifyRequest<{ Body: NewsBody }>,
  reply: FastifyReply
) => {
  try {
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }

    const { title, content, coverImage, date, tags, pinned, isPublished } = request.body;

    if (!title || !title.trim()) {
      return reply.status(400).send({ success: false, error: 'Title is required' });
    }

    if (!content || !content.trim()) {
      return reply.status(400).send({ success: false, error: 'Content is required' });
    }

    let parsedTags: string[] = ['Announcement'];
    if (Array.isArray(tags)) {
      parsedTags = tags.map((t) => t.trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const newArticle = await News.create({
      title: title.trim(),
      content: content.trim(),
      coverImage: coverImage ? coverImage.trim() : '',
      date: date ? new Date(date) : new Date(),
      author: user._id || user.id,
      tags: parsedTags.length > 0 ? parsedTags : ['Announcement'],
      pinned: Boolean(pinned),
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    });

    const populated = await newArticle.populate('author', 'name rollNo profilePicUrl role');

    return reply.status(201).send({
      success: true,
      message: 'News article published successfully',
      news: populated,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to publish news article',
      error: error.message,
    });
  }
};

export const updateNews = async (
  request: FastifyRequest<{ Params: { id: string }; Body: Partial<NewsBody> }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid article ID' });
    }

    const { title, content, coverImage, date, tags, pinned, isPublished } = request.body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (coverImage !== undefined) updates.coverImage = coverImage.trim();
    if (date !== undefined) updates.date = new Date(date);
    if (pinned !== undefined) updates.pinned = Boolean(pinned);
    if (isPublished !== undefined) updates.isPublished = Boolean(isPublished);

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        updates.tags = tags.map((t) => t.trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        updates.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    const updated = await News.findByIdAndUpdate(id, updates, { new: true })
      .populate('author', 'name rollNo profilePicUrl role');

    if (!updated) {
      return reply.status(404).send({ success: false, error: 'News article not found' });
    }

    return reply.send({
      success: true,
      message: 'News article updated successfully',
      news: updated,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to update news article',
      error: error.message,
    });
  }
};

export const deleteNews = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid article ID' });
    }

    const deleted = await News.findByIdAndDelete(id);

    if (!deleted) {
      return reply.status(404).send({ success: false, error: 'News article not found' });
    }

    return reply.send({
      success: true,
      message: 'News article deleted successfully',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to delete news article',
      error: error.message,
    });
  }
};
