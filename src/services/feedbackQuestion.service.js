const feedbackQuestionRepository = require('../repositories/feedbackQuestion.repository');
const eventRepository = require('../repositories/event.repository');
const activityRepository = require('../repositories/activity.repository');
const { resolveId, resolveIds } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const CHOICE_TYPES = new Set(['single_choice', 'multiple_choice']);
const VALID_TYPES = new Set(['rating', 'text', 'single_choice', 'multiple_choice', 'yes_no']);

const validateQuestionPayload = (data, { isUpdate = false } = {}) => {
  if (!isUpdate || data.questionType !== undefined) {
    if (!VALID_TYPES.has(data.questionType)) {
      throw new AppError('Invalid question type', 400);
    }
  }

  const type = data.questionType;
  if (type && CHOICE_TYPES.has(type)) {
    if (!data.options || !Array.isArray(data.options) || data.options.length < 2) {
      throw new AppError('Choice questions require at least 2 options', 400);
    }
  }
};

const validateAnswer = (question, answer) => {
  switch (question.questionType) {
    case 'rating':
      if (answer.answerRating === undefined || answer.answerRating === null) {
        throw new AppError(`Rating required for question: ${question.questionText}`, 400);
      }
      if (answer.answerRating < 1 || answer.answerRating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }
      break;
    case 'text':
      if (!answer.answerText || !String(answer.answerText).trim()) {
        throw new AppError(`Text answer required for question: ${question.questionText}`, 400);
      }
      break;
    case 'yes_no':
      if (!answer.answerText || !['yes', 'no'].includes(String(answer.answerText).toLowerCase())) {
        throw new AppError(`Yes/No answer required for question: ${question.questionText}`, 400);
      }
      break;
    case 'single_choice':
      if (!answer.answerText) {
        throw new AppError(`Option selection required for question: ${question.questionText}`, 400);
      }
      if (question.options && !question.options.includes(answer.answerText)) {
        throw new AppError(`Invalid option for question: ${question.questionText}`, 400);
      }
      break;
    case 'multiple_choice':
      if (!answer.answerOptions || !Array.isArray(answer.answerOptions) || !answer.answerOptions.length) {
        throw new AppError(`At least one option required for question: ${question.questionText}`, 400);
      }
      if (question.options) {
        for (const opt of answer.answerOptions) {
          if (!question.options.includes(opt)) {
            throw new AppError(`Invalid option "${opt}" for question: ${question.questionText}`, 400);
          }
        }
      }
      break;
    default:
      break;
  }
};

const feedbackQuestionService = {
  async list(query) {
    const resolvedQuery = { ...query };
    if (query.eventId) {
      resolvedQuery.eventId = await resolveId('events', query.eventId);
    }
    return feedbackQuestionRepository.findAll(resolvedQuery);
  },

  async getById(idOrUuid) {
    const id = await resolveId('feedback_questions', idOrUuid);
    const row = await feedbackQuestionRepository.findById(id);
    if (!row) throw new AppError('Feedback question not found', 404);
    return feedbackQuestionRepository.formatQuestion(row);
  },

  async create(data, userId) {
    validateQuestionPayload(data);

    let eventId = null;
    if (data.eventId) {
      eventId = await resolveId('events', data.eventId);
      const event = await eventRepository.findById(eventId);
      if (!event) throw new AppError('Event not found', 404);
    }

    const id = await feedbackQuestionRepository.create({
      question_text: data.questionText,
      question_type: data.questionType,
      options: data.options,
      is_required: data.isRequired !== false,
      sort_order: data.sortOrder ?? 0,
      is_active: data.isActive !== false,
      event_id: eventId,
    });

    await activityRepository.log({
      userId,
      action: 'feedback_question_created',
      description: `Feedback question created`,
      metadata: { questionId: id },
    });

    return this.getById(id);
  },

  async update(idOrUuid, data, userId) {
    const id = await resolveId('feedback_questions', idOrUuid);
    const row = await feedbackQuestionRepository.findById(id);
    if (!row) throw new AppError('Feedback question not found', 404);

    validateQuestionPayload(data, { isUpdate: true });

    let eventId;
    if (data.eventId !== undefined) {
      if (data.eventId) {
        eventId = await resolveId('events', data.eventId);
        const event = await eventRepository.findById(eventId);
        if (!event) throw new AppError('Event not found', 404);
      } else {
        eventId = null;
      }
    }

    await feedbackQuestionRepository.update(id, {
      ...data,
      eventId: data.eventId !== undefined ? eventId : undefined,
    });

    await activityRepository.log({
      userId,
      action: 'feedback_question_updated',
      description: `Feedback question ${id} updated`,
    });

    return this.getById(id);
  },

  async remove(idOrUuid, userId) {
    const id = await resolveId('feedback_questions', idOrUuid);
    const row = await feedbackQuestionRepository.findById(id);
    if (!row) throw new AppError('Feedback question not found', 404);
    await feedbackQuestionRepository.softDelete(id);
    await activityRepository.log({
      userId,
      action: 'feedback_question_deleted',
      description: `Feedback question ${id} deleted`,
    });
    return { deleted: true };
  },

  async bulkDelete(idsOrUuids, userId) {
    const ids = await resolveIds('feedback_questions', idsOrUuids);
    const affected = await feedbackQuestionRepository.bulkSoftDelete(ids);
    await activityRepository.log({
      userId,
      action: 'feedback_questions_bulk_deleted',
      description: `${affected} feedback questions deleted`,
      metadata: { ids },
    });
    return { affected };
  },

  async reorder(items, userId) {
    if (!items || !items.length) throw new AppError('No items to reorder', 400);
    const resolved = [];
    for (const item of items) {
      const id = await resolveId('feedback_questions', item.id);
      resolved.push({ id, sortOrder: item.sortOrder });
    }
    await feedbackQuestionRepository.reorder(resolved);
    await activityRepository.log({
      userId,
      action: 'feedback_questions_reordered',
      description: 'Feedback questions reordered',
    });
    return { updated: resolved.length };
  },

  async getActiveForEvent(eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    return feedbackQuestionRepository.findActiveForEvent(eventId);
  },

  async submitResponses(data) {
    const eventId = await resolveId('events', data.eventId);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    const answers = data.answers || [];
    if (!answers.length) throw new AppError('At least one answer is required', 400);

    const questions = await feedbackQuestionRepository.findActiveForEvent(eventId);
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    for (const answer of answers) {
      const questionId = String(answer.questionId);
      const question = questionMap.get(questionId);
      if (!question) throw new AppError(`Question ${questionId} not found or inactive`, 400);
      if (question.isRequired) {
        validateAnswer(question, answer);
      }
    }

    for (const question of questions) {
      if (question.isRequired) {
        const answered = answers.some((a) => String(a.questionId) === question.id);
        if (!answered) {
          throw new AppError(`Required question not answered: ${question.questionText}`, 400);
        }
      }
    }

    const submissionId = await feedbackQuestionRepository.createSubmission({
      eventId,
      clientName: data.clientName,
      tableNo: data.tableNo,
    });

    await feedbackQuestionRepository.createResponses(
      submissionId,
      answers.map((a) => ({
        questionId: a.questionId,
        answerText: a.answerText,
        answerRating: a.answerRating,
        answerOptions: a.answerOptions,
      }))
    );

    const submission = await feedbackQuestionRepository.findSubmissionById(submissionId);
    const responses = await feedbackQuestionRepository.findResponsesBySubmission(submissionId);
    return {
      id: String(submission.id),
      uuid: submission.uuid,
      eventId: String(submission.event_id),
      clientName: submission.client_name,
      tableNo: submission.table_no,
      responses,
      createdAt: submission.created_at,
    };
  },

  async listSubmissions(eventIdOrUuid, query) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    return feedbackQuestionRepository.findSubmissionsByEvent(eventId, query);
  },
};

module.exports = feedbackQuestionService;
