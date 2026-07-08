const reelRepository = require('../repositories/reel.repository');
const clientEventTitleRepository = require('../repositories/clientEventTitle.repository');
const { uploadService } = require('./profile.service');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const reelService = {
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
};

module.exports = reelService;
