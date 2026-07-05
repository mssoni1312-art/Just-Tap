const eventRepository = require('../../repositories/event.repository');
const eventService = require('../event.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');
const { eventStatuses } = require('../../validations/event.validation');
const AppError = require('../../utils/AppError');

const toDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const splitDateTime = (value) => {
  if (!value) return { date: null, time: null };
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return { date: null, time: null };
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
      time: `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`,
    };
  }
  const str = String(value);
  if (str.includes('T')) {
    const [date, timePart] = str.split('T');
    const time = timePart ? timePart.replace(/Z$/, '').slice(0, 8) : null;
    return { date, time };
  }
  return { date: str.slice(0, 10), time: null };
};

const normalizeManagerFunction = (fn) => {
  if (fn.startDateTime || fn.endDateTime) {
    const start = splitDateTime(fn.startDateTime);
    const end = splitDateTime(fn.endDateTime);
    return {
      name: fn.name,
      venue: fn.venue,
      date: start.date || fn.date,
      startTime: start.time || fn.startTime,
      endTime: end.time || fn.endTime,
      pax: fn.pax,
      subVenueRemarks: fn.subVenueRemarks,
      rate: fn.rate,
    };
  }
  return {
    name: fn.name,
    venue: fn.venue,
    date: fn.date,
    startTime: fn.startTime,
    endTime: fn.endTime,
    pax: fn.pax,
    subVenueRemarks: fn.subVenueRemarks,
    rate: fn.rate,
  };
};

const normalizeManagerCreatePayload = (data) => {
  const tablet = data.tabletMedia || {};
  const brideGroom = data.brideGroomInformation || {};

  return {
    inquiryId: data.inquiryId,
    clientId: data.clientId,
    clientName: data.clientName,
    clientAddress: data.clientAddress,
    clientMobile: data.clientMobile,
    reference: data.reference,
    isHighPriority: data.isHighPriority,
    venueName: brideGroom.venueName || data.venueName,
    cityName: data.cityName,
    inquiryDate: data.inquiryDate,
    startDate: data.startDate,
    endDate: data.endDate,
    eventFunctionName: data.eventFunctionName,
    status: data.status,
    justTapInformation: {
      noOfTablets: tablet.number ?? null,
    },
    tabletService: tablet.service || null,
    mediaClientAddress: tablet.clientAddress || null,
    photographyVideography: {
      enabled: Boolean(tablet.hasPhotographyVideography),
    },
    brideGroomInformation: {
      brideName: brideGroom.brideName,
      brideInstagramId: brideGroom.brideInstagramId,
      groomName: brideGroom.groomName,
      groomInstagramId: brideGroom.groomInstagramId,
      foodNotes: brideGroom.foodNotes,
      eventRemarks: brideGroom.eventRemarks,
    },
    functions: (data.functions || []).map(normalizeManagerFunction),
  };
};

const getWeekRange = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    startDate: monday.toISOString().slice(0, 10),
    endDate: sunday.toISOString().slice(0, 10),
  };
};

const buildCalendarResponse = (rows) => {
  const calendar = {};
  for (const row of rows) {
    const dateKey = toDateOnly(row.date);
    if (!calendar[dateKey]) calendar[dateKey] = [];
    const marker = { status: row.status, id: String(row.id), clientName: row.client_name, venue: row.venue_name };
    if (!calendar[dateKey].some((m) => m.id === marker.id)) {
      calendar[dateKey].push(marker);
    }
  }
  return { calendar, legend: eventStatuses };
};

const managerEventService = {
  list: (staffId, query) => eventRepository.findAll(query, staffId),

  async calendar(staffId, query) {
    if (query.date) {
      const date = toDateOnly(query.date);
      const rows = await eventRepository.findByDateRange(date, date, staffId);
      return buildCalendarResponse(rows);
    }

    if (query.weekStart) {
      const { startDate, endDate } = getWeekRange(query.weekStart);
      const rows = await eventRepository.findByDateRange(startDate, endDate, staffId);
      return { ...buildCalendarResponse(rows), startDate, endDate, view: 'week' };
    }

    const year = query.year || new Date().getFullYear();
    const month = query.month || new Date().getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
    const rows = await eventRepository.findByDateRange(startDate, endDate, staffId);
    return { ...buildCalendarResponse(rows), year, month, view: 'month' };
  },

  today: (staffId) => eventRepository.findToday(staffId),
  upcoming: (staffId) => eventRepository.findUpcoming(staffId),

  listCompleted: (staffId, query) =>
    eventRepository.findAll({ ...query, completed: 'true' }, staffId),

  listCancelled: (staffId, query) =>
    eventRepository.findAll({ ...query, status: 'cancelled' }, staffId),

  async getById(staffId, idOrUuid) {
    const id = await resolveId('events', idOrUuid);
    await assertManagerOwnsEvent(staffId, id);
    return eventService.getById(id);
  },

  async create(staffId, data, userId) {
    const normalized = normalizeManagerCreatePayload(data);
    const payload = {
      ...normalized,
      assignedManagerIds: [staffId],
      assignedManagerId: staffId,
      justTapInformation: {
        ...(normalized.justTapInformation || {}),
        assignedManagerIds: [staffId],
      },
    };
    return eventService.create(payload, userId);
  },

  async update(staffId, idOrUuid, data, userId) {
    const id = await resolveId('events', idOrUuid);
    await assertManagerOwnsEvent(staffId, id);
    const normalized = data.tabletMedia || data.brideGroomInformation || data.functions
      ? normalizeManagerCreatePayload(data)
      : data;
    return eventService.update(id, normalized, userId);
  },

  async delete(staffId, idOrUuid, userId) {
    const id = await resolveId('events', idOrUuid);
    await assertManagerOwnsEvent(staffId, id);
    return eventService.delete(id, userId);
  },

  async addFunction(staffId, eventIdOrUuid, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return eventService.addFunction(eventId, data);
  },

  async updateFunction(staffId, eventIdOrUuid, functionId, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return eventService.updateFunction(eventId, functionId, data);
  },

  async deleteFunction(staffId, eventIdOrUuid, functionId) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return eventService.deleteFunction(eventId, functionId);
  },

  getMeta: () => eventService.getMeta(),
};

module.exports = managerEventService;
