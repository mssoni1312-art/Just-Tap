const feedbackRepository = require('../repositories/feedback.repository');
const eventRepository = require('../repositories/event.repository');
const { resolveId, resolveIds } = require('../helpers/idResolver');
const { sendExport } = require('../helpers/exportImport');
const AppError = require('../utils/AppError');

const FEEDBACK_EXPORT_COLUMNS = [
  { label: 'ID', key: 'id' },
  { label: 'UUID', key: 'uuid' },
  { label: 'Client', key: 'clientName' },
  { label: 'Rating', key: 'rating' },
  { label: 'Table', key: 'tableNo' },
  { label: 'Sentiment', key: 'sentiment' },
  { label: 'Comment', key: 'comment' },
];

const feedbackService = {
  async getSummary(eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    return feedbackRepository.getSummary(eventId);
  },

  async list(eventIdOrUuid, query) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    return feedbackRepository.findByEvent(eventId, query);
  },

  async reply(idOrUuid, replyText) {
    const id = await resolveId('feedback_reviews', idOrUuid);
    const row = await feedbackRepository.findById(id);
    if (!row) throw new AppError('Feedback not found', 404);
    await feedbackRepository.reply(id, replyText);
    return { replied: true };
  },

  async flag(idOrUuid) {
    const id = await resolveId('feedback_reviews', idOrUuid);
    const row = await feedbackRepository.findById(id);
    if (!row) throw new AppError('Feedback not found', 404);
    await feedbackRepository.flag(id);
    return { flagged: true };
  },

  async bulkFlag(idsOrUuids) {
    const ids = await resolveIds('feedback_reviews', idsOrUuids);
    return { affected: await feedbackRepository.bulkFlag(ids) };
  },

  async bulkDelete(idsOrUuids) {
    const ids = await resolveIds('feedback_reviews', idsOrUuids);
    return { affected: await feedbackRepository.bulkDelete(ids) };
  },

  export(res, eventIdOrUuid, query) {
    return resolveId('events', eventIdOrUuid).then((eventId) =>
      feedbackRepository.findByEventForExport(eventId, query).then((rows) =>
        sendExport(res, {
          format: query.format,
          filename: `feedback-event-${eventId}`,
          rows,
          columns: FEEDBACK_EXPORT_COLUMNS,
          jsonData: { items: rows },
        })
      )
    );
  },
};

module.exports = feedbackService;
