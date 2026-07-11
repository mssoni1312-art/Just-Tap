const reelRepository = require('../repositories/reel.repository');
const clientEventTitleRepository = require('../repositories/clientEventTitle.repository');
const { uploadService } = require('./profile.service');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const reelService = {
  async list(query = {}) {
    const resolvedQuery = { ...query };
    if (query.ourEventId) {
      resolvedQuery.ourEventId = await resolveId('client_event_titles', query.ourEventId);
    }
    return reelRepository.list(resolvedQuery);
  },

  async create(file, body, userId) {
    if (!file) throw new AppError('Video file is required', 400);

    const ourEventId = await resolveId('client_event_titles', body.ourEventId);
    const ourEvent = await clientEventTitleRepository.findById(ourEventId);
    if (!ourEvent) throw new AppError('Our event title not found', 404);

    const upload = await uploadService.saveUpload(userId, file, 'video');
    return reelRepository.create({
      ourEventId,
      uploadId: upload.id,
      videoUrl: upload.url,
      name: body.name,
      venueName: body.venueName,
      guestCount: body.guestCount,
      uploadedBy: userId,
    });
  },

  async remove(idOrUuid) {
    const id = await resolveId('event_reels', idOrUuid);
    const row = await reelRepository.findById(id);
    if (!row) throw new AppError('Reel not found', 404);

    await reelRepository.softDelete(id);
    return { deleted: true };
  },
};

module.exports = reelService;
