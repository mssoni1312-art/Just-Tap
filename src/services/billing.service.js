const billingRepository = require('../repositories/billing.repository');
const eventRepository = require('../repositories/event.repository');
const activityRepository = require('../repositories/activity.repository');
const { resolveId } = require('../helpers/idResolver');
const { toMysqlDate, toMysqlTime, toMysqlDateTime } = require('../helpers/mysqlFormat');
const AppError = require('../utils/AppError');

async function resolveEventFunctionId(eventFunctionId) {
  if (eventFunctionId === undefined || eventFunctionId === null || eventFunctionId === '') {
    return null;
  }

  if (typeof eventFunctionId === 'string') {
    if (eventFunctionId.includes('-')) {
      return resolveId('event_functions', eventFunctionId);
    }
    if (/^\d+$/.test(eventFunctionId)) {
      return Number(eventFunctionId);
    }
  }

  return eventFunctionId;
}

async function normalizeBillingPayload(data) {
  const functions = await Promise.all((data.functions || []).map(async (fn) => ({
    ...fn,
    eventFunctionId: await resolveEventFunctionId(fn.eventFunctionId),
    date: toMysqlDate(fn.date),
    startTime: toMysqlTime(fn.startTime),
  })));

  const payments = (data.payments || []).map((payment) => ({
    ...payment,
    paidAt: toMysqlDateTime(payment.paidAt),
  }));

  return {
    ...data,
    functions,
    payments,
  };
}

async function validateEventFunctionIds(eventId, functions) {
  const functionIds = [...new Set(
    functions
      .map((fn) => fn.eventFunctionId)
      .filter((id) => id != null)
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0),
  )];

  if (!functionIds.length) return;

  const eventFunctions = await eventRepository.getFunctions(eventId);
  const validIds = new Set(eventFunctions.map((fn) => Number(fn.id)));

  for (const functionId of functionIds) {
    if (!validIds.has(functionId)) {
      throw new AppError(`Invalid eventFunctionId: ${functionId}`, 400);
    }
  }
}

const emptyBilling = (eventId) => ({
  eventId: String(eventId),
  showToClient: false,
  functions: [],
  estimate: {
    cgstPercent: null,
    cgstAmount: null,
    sgstPercent: null,
    sgstAmount: null,
    discount: 0,
    roundOff: 0,
    grandTotal: 0,
  },
  payments: [],
  totalPaid: 0,
  remainingPayment: 0,
  notes: '',
  previewedAt: null,
  updatedAt: null,
});

const billingService = {
  async get(eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    const billing = await billingRepository.findByEventId(eventId);
    if (!billing) return emptyBilling(eventId);

    return {
      ...billing,
      clientId: event.client_id ? String(event.client_id) : null,
      clientName: event.client_name,
    };
  },

  async getClientPreview(eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    const billing = await billingRepository.findByEventId(eventId);
    if (!billing || !billing.showToClient) {
      throw new AppError('Billing is not available for client preview', 404);
    }

    return {
      eventId: String(eventId),
      clientName: event.client_name,
      startDate: event.start_date,
      endDate: event.end_date,
      functions: billing.functions,
      estimate: billing.estimate,
      payments: billing.payments,
      totalPaid: billing.totalPaid,
      remainingPayment: billing.remainingPayment,
      notes: billing.notes,
      previewedAt: billing.previewedAt,
    };
  },

  async savePreview(eventIdOrUuid, data, userId) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    const payload = await normalizeBillingPayload(data);
    await validateEventFunctionIds(eventId, payload.functions);
    const billingId = await billingRepository.save(eventId, payload);
    const billing = await billingRepository.findByEventId(eventId);

    await activityRepository.log({
      eventId,
      userId,
      action: 'billing_saved_preview',
      description: `Billing saved${data.showToClient ? ' and published to client app' : ''}`,
      metadata: { billingId, showToClient: Boolean(data.showToClient) },
    });

    return {
      ...billing,
      clientId: event.client_id ? String(event.client_id) : null,
      clientName: event.client_name,
    };
  },
};

module.exports = billingService;
