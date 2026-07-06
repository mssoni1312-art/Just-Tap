const managerEventRepository = require('../../repositories/manager/event.repository');
const eventService = require('../event.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');
const { eventStatuses } = require('../../validations/event.validation');
const AppError = require('../../utils/AppError');

const pad2 = (n) => String(n).padStart(2, '0');

const toDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }
  return String(value).slice(0, 10);
};

const addDays = (dateStr, days) => {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
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
  const date = new Date(`${toDateOnly(dateStr)}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    startDate: toDateOnly(monday),
    endDate: toDateOnly(sunday),
  };
};

const buildCalendarResponse = (rows, rangeStart = null, rangeEnd = null) => {
  const calendar = {};
  for (const row of rows) {
    let startDate = toDateOnly(row.start_date || row.date);
    let endDate = toDateOnly(row.end_date || row.start_date || row.date);
    if (rangeStart && startDate < rangeStart) startDate = rangeStart;
    if (rangeEnd && endDate > rangeEnd) endDate = rangeEnd;

    const marker = {
      status: row.status,
      id: String(row.id),
      clientName: row.client_name,
      venue: row.venue_name,
    };

    for (let day = startDate; day <= endDate; day = addDays(day, 1)) {
      if (!calendar[day]) calendar[day] = [];
      if (!calendar[day].some((m) => m.id === marker.id)) {
        calendar[day].push(marker);
      }
    }
  }
  return { calendar, legend: eventStatuses };
};

const managerEventService = {
  list: (staffId, query) => managerEventRepository.findAll(staffId, query),

  async calendar(staffId, query) {
    if (query.date) {
      const date = toDateOnly(query.date);
      const rows = await managerEventRepository.findByDateRange(staffId, date, date);
      return buildCalendarResponse(rows, date, date);
    }

    if (query.weekStart) {
      const { startDate, endDate } = getWeekRange(query.weekStart);
      const rows = await managerEventRepository.findByDateRange(staffId, startDate, endDate);
      return {
        ...buildCalendarResponse(rows, startDate, endDate),
        startDate,
        endDate,
        view: 'week',
      };
    }

    const year = query.year || new Date().getFullYear();
    const month = query.month || new Date().getMonth() + 1;
    const startDate = `${year}-${pad2(month)}-01`;
    const endDate = `${year}-${pad2(month)}-${pad2(new Date(year, month, 0).getDate())}`;
    const rows = await managerEventRepository.findByDateRange(staffId, startDate, endDate);
    return {
      ...buildCalendarResponse(rows, startDate, endDate),
      year,
      month,
      view: 'month',
    };
  },

  today: (staffId) => managerEventRepository.findToday(staffId),
  upcoming: (staffId) => managerEventRepository.findUpcoming(staffId),

  listCompleted: (staffId, query) =>
    managerEventRepository.findAll(staffId, { ...query, completed: 'true' }),

  listCancelled: (staffId, query) =>
    managerEventRepository.findAll(staffId, { ...query, status: 'cancelled' }),

  async getById(staffId, idOrUuid) {
    const id = await resolveId('events', idOrUuid);
    await assertManagerOwnsEvent(staffId, id);
    return eventService.getById(id);
  },

  async create(_staffId, data, userId) {
    const normalized = normalizeManagerCreatePayload(data);
    return eventService.create(normalized, userId);
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
