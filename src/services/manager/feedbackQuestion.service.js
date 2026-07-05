const feedbackQuestionRepository = require('../../repositories/feedbackQuestion.repository');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');
const AppError = require('../../utils/AppError');

const parseJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parseAudience = (options) => {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    return 'guest_catering';
  }
  return options.audience === 'client_service' ? 'client_service' : 'guest_catering';
};

const formatClientQuestion = (row) => ({
  id: String(row.id),
  uuid: row.uuid,
  question: row.question_text,
  audience: parseAudience(parseJson(row.options)),
  sortOrder: Number(row.sort_order),
  isActive: Boolean(row.is_active),
});

const managerFeedbackQuestionService = {
  async list(staffId, eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);

    const result = await feedbackQuestionRepository.findAll({
      eventId,
      limit: 200,
      page: 1,
      sortBy: 'sort_order',
      sortOrder: 'asc',
    });

    return {
      items: result.items.map(formatClientQuestion),
    };
  },

  async create(staffId, eventIdOrUuid, { question, audience = 'guest_catering' }) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);

    const existing = await feedbackQuestionRepository.findAll({
      eventId,
      limit: 200,
      page: 1,
    });
    const nextSortOrder = existing.items.length;

    const id = await feedbackQuestionRepository.create({
      question_text: question,
      question_type: 'text',
      options: JSON.stringify({
        audience: audience === 'client_service' ? 'client_service' : 'guest_catering',
      }),
      is_required: true,
      sort_order: nextSortOrder,
      is_active: true,
      event_id: eventId,
    });

    const row = await feedbackQuestionRepository.findById(id);
    return formatClientQuestion(row);
  },

  async remove(staffId, eventIdOrUuid, questionIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);

    const questionId = await resolveId('feedback_questions', questionIdOrUuid);
    const row = await feedbackQuestionRepository.findById(questionId);
    if (!row || Number(row.event_id) !== Number(eventId)) {
      throw new AppError('Feedback question not found', 404);
    }

    await feedbackQuestionRepository.softDelete(questionId);
    return { deleted: true };
  },
};

module.exports = managerFeedbackQuestionService;
