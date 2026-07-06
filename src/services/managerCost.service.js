const managerCostRepository = require('../repositories/managerCost.repository');
const eventRepository = require('../repositories/event.repository');
const activityRepository = require('../repositories/activity.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const costFields = [
  'clientCost',
  'tabletCost',
  'transportationCost',
  'assignManagerCost',
  'photographyVideographyCost',
  'otherCharges',
];

const calculateTotalCost = (data) =>
  costFields.reduce((sum, field) => sum + (Number(data[field]) || 0), 0);

const emptyManagerCost = (eventId, event) => ({
  eventId: String(eventId),
  eventDetails: event.client_name || '',
  clientCost: null,
  tabletCost: null,
  transportationCost: null,
  assignManagerCost: null,
  photographyVideographyCost: null,
  otherCharges: null,
  totalCost: 0,
  filled: false,
  updatedAt: null,
});

const managerCostService = {
  async get(eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    const costs = await managerCostRepository.findByEventId(eventId);
    if (!costs) return emptyManagerCost(eventId, event);

    return {
      ...costs,
      eventDetails: event.client_name || '',
    };
  },

  async save(eventIdOrUuid, data, userId) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);

    const totalCost = calculateTotalCost(data);
    const payload = {
      clientCost: data.clientCost ?? null,
      tabletCost: data.tabletCost ?? null,
      transportationCost: data.transportationCost ?? null,
      assignManagerCost: data.assignManagerCost ?? null,
      photographyVideographyCost: data.photographyVideographyCost ?? null,
      otherCharges: data.otherCharges ?? null,
      totalCost,
    };

    const costId = await managerCostRepository.save(eventId, payload);
    const saved = await managerCostRepository.findByEventId(eventId);

    await activityRepository.log({
      eventId,
      userId,
      action: 'manager_cost_saved',
      description: 'Manager cost breakdown saved',
      metadata: { costId, totalCost },
    });

    return {
      ...saved,
      eventDetails: event.client_name || '',
    };
  },
};

module.exports = managerCostService;
