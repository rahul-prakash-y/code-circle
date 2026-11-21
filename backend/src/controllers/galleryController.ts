import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Event from '../models/eventModel';
import EventReport from '../models/eventReportModel';

export interface GetGalleryQuery {
  page?: string | number;
  limit?: string | number;
  category?: string;
  search?: string;
}

export interface UpdateGalleryBody {
  action?: 'add' | 'append' | 'remove' | 'set';
  url?: string;
  caption?: string;
  imageId?: string;
  images?: Array<{ url: string; caption?: string }>;
  galleryImages?: Array<{ url: string; caption?: string }>;
}

/**
 * GET /api/gallery
 * Public / All-user read-only aggregation route.
 * Returns paginated albums of past/approved events with merged photos.
 */
export const getGallery = async (
  request: FastifyRequest<{ Querystring: GetGalleryQuery }>,
  reply: FastifyReply
) => {
  try {
    const { page: rawPage, limit: rawLimit, category, search } = request.query;

    const page = Math.max(1, parseInt(String(rawPage || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(rawLimit || '12'), 10) || 12));
    const skip = (page - 1) * limit;

    const query: any = {
      status: { $ne: 'Cancelled' },
    };

    // Category filter: match type case-insensitively or match title/type
    if (category && category.trim().toLowerCase() !== 'all') {
      const catTrim = category.trim();
      query.$or = [
        { type: { $regex: new RegExp(`^${catTrim}$`, 'i') } },
        { title: { $regex: new RegExp(catTrim, 'i') } },
      ];
    }

    // Search query if provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: [{ title: searchRegex }, { venueOrLink: searchRegex }] }];
        delete query.$or;
      } else {
        query.$or = [{ title: searchRegex }, { venueOrLink: searchRegex }];
      }
    }

    // Show completed events, past events, or events with gallery images/reports
    const pastOrCompletedFilter = {
      $or: [
        { status: 'Completed' },
        { startDate: { $lte: new Date() } },
        { date: { $lte: new Date() } },
        { 'galleryImages.0': { $exists: true } },
      ],
    };

    if (query.$and) {
      query.$and.push(pastOrCompletedFilter);
    } else if (query.$or) {
      query.$and = [{ $or: query.$or }, pastOrCompletedFilter];
      delete query.$or;
    } else {
      Object.assign(query, pastOrCompletedFilter);
    }

    const [total, events] = await Promise.all([
      Event.countDocuments(query),
      Event.find(query)
        .sort({ startDate: -1, date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .select('_id title description type startDate endDate date venueOrLink status galleryImages'),
    ]);

    // Gather corresponding EventReport evidence for this page of events
    const eventIds = events.map((e) => e._id);
    const reports = await EventReport.find({ eventId: { $in: eventIds } })
      .select('eventId geoPhotoUrl brochureUrl galleryImages status')
      .lean();

    const reportMap = new Map<string, any>();
    for (const report of reports) {
      if (report.eventId) {
        reportMap.set(report.eventId.toString(), report);
      }
    }

    const albums = events.map((evt: any) => {
      const report = reportMap.get(evt._id.toString());
      const seenUrls = new Set<string>();
      const combinedImages: Array<{ _id?: string; url: string; caption?: string; source?: string }> = [];

      // 1. Direct event gallery images
      if (Array.isArray(evt.galleryImages)) {
        for (const img of evt.galleryImages) {
          if (img && typeof img.url === 'string' && img.url.trim() && !seenUrls.has(img.url.trim())) {
            seenUrls.add(img.url.trim());
            combinedImages.push({
              _id: img._id ? img._id.toString() : undefined,
              url: img.url.trim(),
              caption: img.caption || '',
              source: 'gallery',
            });
          }
        }
      }

      // 2. Report gallery images if present
      if (report && Array.isArray(report.galleryImages)) {
        for (const img of report.galleryImages) {
          if (img && typeof img.url === 'string' && img.url.trim() && !seenUrls.has(img.url.trim())) {
            seenUrls.add(img.url.trim());
            combinedImages.push({
              _id: img._id ? img._id.toString() : undefined,
              url: img.url.trim(),
              caption: img.caption || '',
              source: 'report_gallery',
            });
          }
        }
      }

      // 3. Geo photo proofs from report
      if (report && Array.isArray(report.geoPhotoUrl)) {
        for (const url of report.geoPhotoUrl) {
          if (typeof url === 'string' && url.trim() && !seenUrls.has(url.trim())) {
            seenUrls.add(url.trim());
            combinedImages.push({
              url: url.trim(),
              caption: 'Event Geo Proof',
              source: 'geo_proof',
            });
          }
        }
      }

      // 4. Brochure images from report
      if (report && Array.isArray(report.brochureUrl)) {
        for (const url of report.brochureUrl) {
          if (typeof url === 'string' && url.trim() && !seenUrls.has(url.trim())) {
            seenUrls.add(url.trim());
            combinedImages.push({
              url: url.trim(),
              caption: 'Event Brochure',
              source: 'brochure',
            });
          }
        }
      }

      const coverImage = combinedImages.length > 0 ? combinedImages[0].url : null;

      return {
        _id: evt._id,
        id: evt._id.toString(),
        title: evt.title || 'Untitled Event',
        type: evt.type || 'Technical',
        startDate: evt.startDate || evt.date || null,
        endDate: evt.endDate || null,
        venueOrLink: evt.venueOrLink || 'Campus / Online',
        status: evt.status || 'Completed',
        coverImage,
        photoCount: combinedImages.length,
        images: combinedImages,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = skip + events.length < total;

    return reply.status(200).send({
      success: true,
      data: albums,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to retrieve event gallery',
      details: error.message,
    });
  }
};

/**
 * PATCH /api/events/:id/gallery
 * Admin & Coordinator upload endpoint to append or remove gallery items.
 */
export const updateEventGallery = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateGalleryBody }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const user = request.user as any;

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized: Authentication required' });
    }

    const elevatedRoles = ['Admin', 'SuperAdmin', 'Faculty', 'Committee', 'Coordinator'];
    const isElevated = elevatedRoles.includes(user.role);

    if (!isElevated) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden: Requires Admin or Coordinator clearance to manage event gallery',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid Event ID format' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return reply.status(404).send({ success: false, error: 'Target Event not found' });
    }

    const body = request.body || {};
    const action = body.action || 'add';

    if (!Array.isArray(event.galleryImages)) {
      event.galleryImages = [];
    }

    if (action === 'remove') {
      const targetUrl = (body.url || '').trim();
      const targetId = (body.imageId || '').trim();

      if (!targetUrl && !targetId) {
        return reply.status(400).send({
          success: false,
          error: 'Either "url" or "imageId" is required to remove a gallery image.',
        });
      }

      const initialCount = event.galleryImages.length;
      event.galleryImages = event.galleryImages.filter((img: any) => {
        if (targetId && img._id && img._id.toString() === targetId) return false;
        if (targetUrl && img.url === targetUrl) return false;
        return true;
      });

      await event.save();

      return reply.status(200).send({
        success: true,
        message: 'Gallery image removed successfully',
        removedCount: initialCount - event.galleryImages.length,
        galleryImages: event.galleryImages,
      });
    }

    if (action === 'set') {
      const incomingList = Array.isArray(body.galleryImages)
        ? body.galleryImages
        : Array.isArray(body.images)
        ? body.images
        : [];

      event.galleryImages = incomingList
        .filter((item) => item && typeof item.url === 'string' && item.url.trim().length > 0)
        .map((item) => ({
          url: item.url.trim(),
          caption: typeof item.caption === 'string' ? item.caption.trim() : '',
          uploadedAt: new Date(),
        }));

      await event.save();

      return reply.status(200).send({
        success: true,
        message: 'Gallery images updated successfully',
        galleryImages: event.galleryImages,
      });
    }

    // Default: 'add' or 'append'
    const newItems: Array<{ url: string; caption?: string; uploadedAt?: Date }> = [];

    // Support array payload
    const candidates = Array.isArray(body.images)
      ? body.images
      : Array.isArray(body.galleryImages)
      ? body.galleryImages
      : body.url
      ? [{ url: body.url, caption: body.caption }]
      : [];

    for (const item of candidates) {
      if (item && typeof item.url === 'string' && item.url.trim().length > 0) {
        newItems.push({
          url: item.url.trim(),
          caption: typeof item.caption === 'string' ? item.caption.trim() : '',
          uploadedAt: new Date(),
        });
      }
    }

    if (newItems.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'No valid image URLs provided to add to event gallery.',
      });
    }

    // Avoid duplicates in event's gallery
    const existingUrls = new Set(event.galleryImages.map((img: any) => img.url));
    let addedCount = 0;

    for (const item of newItems) {
      if (!existingUrls.has(item.url)) {
        event.galleryImages.push(item as any);
        existingUrls.add(item.url);
        addedCount++;
      }
    }

    await event.save();

    return reply.status(200).send({
      success: true,
      message: `Successfully added ${addedCount} photo(s) to event gallery`,
      addedCount,
      galleryImages: event.galleryImages,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to update event gallery',
      details: error.message,
    });
  }
};

export default {
  getGallery,
  updateEventGallery,
};
