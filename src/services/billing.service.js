const billingRepository = require('../repositories/billing.repository');
const eventRepository = require('../repositories/event.repository');
const activityRepository = require('../repositories/activity.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const toMysqlTime = (value) => {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hour, minute] = trimmed.split(':');
    return `${hour.padStart(2, '0')}:${minute}:00`;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hour = Number(match[1]);
    const minute = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}:00`;
  }

  return trimmed;
};

async function normalizeBillingPayload(data) {
  const functions = await Promise.all((data.functions || []).map(async (fn) => {
    let eventFunctionId = fn.eventFunctionId;
    if (eventFunctionId && typeof eventFunctionId === 'string' && eventFunctionId.includes('-')) {
      eventFunctionId = await resolveId('event_functions', eventFunctionId);
    }

    return {
      ...fn,
      eventFunctionId: eventFunctionId || null,
      startTime: toMysqlTime(fn.startTime),
    };
  }));

  return {
    ...data,
    functions,
  };
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

    const billingId = await billingRepository.save(eventId, await normalizeBillingPayload(data));
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
