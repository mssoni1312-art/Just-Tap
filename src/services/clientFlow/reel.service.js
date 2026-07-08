const reelRepository = require('../../repositories/reel.repository');
const clientEventTitleRepository = require('../../repositories/clientEventTitle.repository');
const { resolveId } = require('../../helpers/idResolver');

const formatGuestCountLabel = (count) => {
  const value = Number(count) || 0;
  if (value <= 0) return null;
  return `${value}+ Guests`;
};

const toClientReelCard = (row) => ({
  id: row.id,
  uuid: row.uuid,
  title: row.name,
  name: row.name,
  videoUrl: row.videoUrl,
  venueName: row.venueName,
  guestCount: row.guestCount,
  guestCountLabel: formatGuestCountLabel(row.guestCount),
  ourEventId: row.ourEventId,
  ourEventUuid: row.ourEventUuid,
  ourEventName: row.ourEventName,
  providerName: row.providerName || row.catererName || row.clientName || 'Just Tap',
  catererName: row.catererName || null,
  cityName: row.cityName || row.venueName || null,
  createdAt: row.createdAt,
});

const withAllSetupsCategory = (categories) => [
  { id: null, uuid: null, name: 'All Setups', sortOrder: -1 },
  ...categories,
];

const clientFlowReelService = {
  async list(query = {}) {
    const resolvedQuery = { ...query };
    if (query.ourEventId) {
      resolvedQuery.ourEventId = await resolveId('client_event_titles', query.ourEventId);
    }

    const feed = await reelRepository.listForClientFeed(resolvedQuery);
    const categories = await clientEventTitleRepository.listCategoriesForClientFeed();

    return {
      categories: withAllSetupsCategory(categories),
      items: feed.items.map(toClientReelCard),
      pagination: feed.pagination,
    };
  },
};

module.exports = clientFlowReelService;
