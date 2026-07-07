const Joi = require('joi');
const { eventStatuses } = require('./event.validation');

const managerCalendarSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100),
  month: Joi.number().integer().min(1).max(12),
  weekStart: Joi.date().iso(),
  date: Joi.date().iso(),
});

const managerTabletMediaSchema = Joi.object({
  service: Joi.string().allow(null, ''),
  number: Joi.number().integer().min(0).allow(null),
  clientAddress: Joi.string().allow(null, ''),
  hasPhotographyVideography: Joi.boolean().default(false),
});

const managerBrideGroomSchema = Joi.object({
  brideName: Joi.string().allow(null, ''),
  brideInstagramId: Joi.string().allow(null, ''),
  groomName: Joi.string().allow(null, ''),
  groomInstagramId: Joi.string().allow(null, ''),
  foodNotes: Joi.string().allow(null, ''),
  eventRemarks: Joi.string().allow(null, ''),
  venueName: Joi.string().allow(null, ''),
});

const managerFunctionSchema = Joi.object({
  name: Joi.string().required(),
  startDateTime: Joi.date().iso(),
  endDateTime: Joi.date().iso(),
  date: Joi.date().iso().allow(null),
  startTime: Joi.string().allow(null, ''),
  endTime: Joi.string().allow(null, ''),
  venue: Joi.string().allow(null, ''),
  subVenueRemarks: Joi.string().allow(null, ''),
  rate: Joi.number().min(0).allow(null),
}).or('startDateTime', 'date');

const createManagerEventSchema = Joi.object({
  inquiryId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  clientId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  inquiryDate: Joi.date().iso().allow(null),
  status: Joi.string().valid(...eventStatuses),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  eventFunctionName: Joi.string().allow(null, ''),
  venueName: Joi.string().required(),
  cityName: Joi.string().required(),
  clientName: Joi.string().allow(null, ''),
  clientAddress: Joi.string().allow(null, ''),
  clientMobile: Joi.string().allow(null, ''),
  reference: Joi.string().allow(null, ''),
  isHighPriority: Joi.boolean().default(false),
  tabletMedia: managerTabletMediaSchema,
  brideGroomInformation: managerBrideGroomSchema,
  functions: Joi.array().items(managerFunctionSchema),
}).custom((value, helpers) => {
  const hasClientId = value.clientId !== undefined && value.clientId !== null && value.clientId !== '';
  if (!hasClientId) {
    const missing = [];
    if (!value.clientName) missing.push('clientName');
    if (!value.clientAddress) missing.push('clientAddress');
    if (!value.clientMobile) missing.push('clientMobile');
    if (!value.reference) missing.push('reference');
    if (missing.length) {
      return helpers.message(`When clientId is omitted, required: ${missing.join(', ')}`);
    }
  }

  if (value.startDate && value.endDate) {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    if (end < start) {
      return helpers.message('endDate must be on or after startDate');
    }
  }

  for (const [index, fn] of (value.functions || []).entries()) {
    if (fn.startDateTime && fn.endDateTime) {
      const start = new Date(fn.startDateTime);
      const end = new Date(fn.endDateTime);
      if (end < start) {
        return helpers.message(`functions[${index}].endDateTime must be on or after startDateTime`);
      }
    }
  }

  return value;
});

const updateManagerEventSchema = createManagerEventSchema.fork(
  ['venueName', 'cityName', 'startDate', 'endDate'],
  (s) => s.optional()
);

const createManagerTaskSchema = Joi.object({
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).required(),
  title: Joi.string().required(),
  description: Joi.string().allow(null, ''),
  taskTemplateId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()),
  dueDate: Joi.date().iso().allow(null),
  assignedTo: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  tasks: Joi.array().items(Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    task_template_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()),
    due_date: Joi.date().iso().allow(null),
  })),
});

const updateManagerEventTaskSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow(null, ''),
  status: Joi.string().valid('assigned', 'in_progress', 'completed', 'overdue'),
  assignedTo: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).allow(null),
  dueDate: Joi.date().iso().allow(null),
});

const timeStringSchema = Joi.string().pattern(/^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);

const updateManagerAllTasksSchema = Joi.object({
  actualArrivalTime: timeStringSchema.allow(null, ''),
  followersAchievedCount: Joi.number().integer().min(0),
  testimonialReelsAchievedCount: Joi.number().integer().min(0),
  activeSessionRecording: Joi.boolean(),
  numberOfVideoShoots: Joi.number().integer().min(0),
  mainEventHighlights: Joi.boolean(),
  photosCaptured: Joi.number().integer().min(0),
  amountCollected: Joi.number().min(0),
}).min(1);

const completeManagerAllTasksSchema = Joi.object({
  amountCollected: Joi.number().min(0).description(
    'Optional on submit — saves the collected amount before completing. Required overall (saved or in body).'
  ),
});

const attachmentIdParamSchema = Joi.object({
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).required(),
  attachmentId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).required(),
});

const managerEventFeedbackQuestionSchema = Joi.object({
  question: Joi.string().trim().required(),
  audience: Joi.string().valid('guest_catering', 'client_service').default('guest_catering'),
});

const managerEventFeedbackQuestionIdParamSchema = Joi.object({
  eventId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).required(),
  questionId: Joi.alternatives().try(Joi.number().integer(), Joi.string().uuid()).required(),
});

module.exports = {
  managerCalendarSchema,
  createManagerEventSchema,
  updateManagerEventSchema,
  createManagerTaskSchema,
  updateManagerEventTaskSchema,
  updateManagerAllTasksSchema,
  completeManagerAllTasksSchema,
  attachmentIdParamSchema,
  managerEventFeedbackQuestionSchema,
  managerEventFeedbackQuestionIdParamSchema,
};
