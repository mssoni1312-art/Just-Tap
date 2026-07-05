const feedbackRepository = require('../../repositories/feedback.repository');
const feedbackService = require('../feedback.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');
const AppError = require('../../utils/AppError');

const managerFeedbackService = {
  list: (staffId, query) => feedbackRepository.findAllForManager(staffId, query),

  async listByEvent(staffId, eventIdOrUuid, query) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return feedbackService.list(eventId, query);
  },

  async getSummary(staffId, eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return feedbackService.getSummary(eventId);
  },

  async getById(staffId, idOrUuid) {
    const id = await resolveId('feedback_reviews', idOrUuid);
    const row = await feedbackRepository.findById(id);
    if (!row) throw new AppError('Feedback not found', 404);
    await assertManagerOwnsEvent(staffId, row.event_id);
    return {
      id: String(row.id),
      uuid: row.uuid,
      eventId: row.event_id,
      clientName: row.client_name,
      rating: Number(row.rating),
      comment: row.comment,
      tableNo: row.table_no,
      sentiment: row.sentiment,
      replyText: row.reply_text,
      isFlagged: Boolean(row.is_flagged),
      createdAt: row.created_at,
    };
  },

  async reply(staffId, idOrUuid, replyText) {
    const id = await resolveId('feedback_reviews', idOrUuid);
    const row = await feedbackRepository.findById(id);
    if (!row) throw new AppError('Feedback not found', 404);
    await assertManagerOwnsEvent(staffId, row.event_id);
    return feedbackService.reply(id, replyText);
  },

  async flag(staffId, idOrUuid) {
    const id = await resolveId('feedback_reviews', idOrUuid);
    const row = await feedbackRepository.findById(id);
    if (!row) throw new AppError('Feedback not found', 404);
    await assertManagerOwnsEvent(staffId, row.event_id);
    return feedbackService.flag(id);
  },

  async remove(staffId, idOrUuid) {
    const id = await resolveId('feedback_reviews', idOrUuid);
    const row = await feedbackRepository.findById(id);
    if (!row) throw new AppError('Feedback not found', 404);
    await assertManagerOwnsEvent(staffId, row.event_id);
    await feedbackRepository.bulkDelete([id]);
    return { deleted: true };
  },
};

module.exports = managerFeedbackService;
