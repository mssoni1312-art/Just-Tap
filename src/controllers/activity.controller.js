const { sendSuccess } = require('../helpers/response');
const activityRepository = require('../repositories/activity.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

module.exports = {
  recent: async (req, res) => {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const rows = await activityRepository.findRecent(limit);
    sendSuccess(res, {
      items: rows.map((r) => ({
        id: r.id,
        eventId: r.event_id,
        userId: r.user_id,
        action: r.action,
        description: r.description,
        metadata: r.metadata && typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
        userName: r.first_name ? `${r.first_name} ${r.last_name}` : null,
        createdAt: r.created_at,
      })),
    });
  },

  byEvent: async (req, res) => {
    const eventId = await resolveId('events', req.params.eventId);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const rows = await activityRepository.findByEvent(eventId, limit);
    sendSuccess(res, { items: rows });
  },
};
