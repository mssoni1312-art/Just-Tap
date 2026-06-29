const eventRepository = require('../repositories/event.repository');
const inquiryRepository = require('../repositories/inquiry.repository');
const activityRepository = require('../repositories/activity.repository');
const { resolveId, resolveIds } = require('../helpers/idResolver');
const { sendExport } = require('../helpers/exportImport');
const AppError = require('../utils/AppError');

const EVENT_EXPORT_COLUMNS = [
  { label: 'ID', key: 'id' },
  { label: 'UUID', key: 'uuid' },
  { label: 'Client', key: 'clientName' },
  { label: 'Mobile', key: 'clientMobile' },
  { label: 'Venue', key: 'venueName' },
  { label: 'City', key: 'cityName' },
  { label: 'Start', key: 'startDate' },
  { label: 'End', key: 'endDate' },
  { label: 'Status', key: 'status' },
  { label: 'Package', key: 'packageName' },
  { label: 'Manager', key: 'managerName' },
];

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

const eventService = {
  async list(query) {
    return eventRepository.findAll(query);
  },

  async calendar(query) {
    const year = query.year || new Date().getFullYear();
    const month = query.month || new Date().getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
    const rows = await eventRepository.findByDateRange(startDate, endDate);
    const calendar = {};
    for (const row of rows) {
      const dateKey = row.date;
      if (!calendar[dateKey]) calendar[dateKey] = [];
      if (!calendar[dateKey].includes(row.status)) {
        calendar[dateKey].push(row.status);
      }
    }
    return { calendar, legend: ['inquiry', 'confirmed', 'cancelled', 'r_menu', 'live'] };
  },

  async today() {
    return eventRepository.findToday();
  },

  async upcoming() {
    return eventRepository.findUpcoming();
  },

  async getById(idOrUuid) {
    const id = await resolveId('events', idOrUuid);
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);
    const functions = await eventRepository.getFunctions(id);
    const menuItems = await eventRepository.getMenuSelections(id);
    return {
      ...eventRepository.formatEvent(event),
      functions,
      menuItems: menuItems.map((m) => ({
        id: String(m.id),
        name: m.name,
        category: m.category,
        price: String(m.price),
        isVeg: Boolean(m.is_veg),
      })),
    };
  },

  async create(data, userId) {
    let inquiryId = null;
    if (data.inquiryId) {
      inquiryId = await resolveId('inquiries', data.inquiryId);
    }

    let menuItemIds = [];
    if (data.menuItemIds?.length) {
      menuItemIds = await resolveIds('menu_items', data.menuItemIds);
    }

    let packageId = data.packageId;
    if (packageId && typeof packageId === 'string' && packageId.includes('-')) {
      packageId = await resolveId('menu_packages', packageId);
    }

    let assignedManagerId = data.assignedManagerId;
    if (assignedManagerId && typeof assignedManagerId === 'string' && assignedManagerId.includes('-')) {
      assignedManagerId = await resolveId('users', assignedManagerId);
    }

    const eventId = await eventRepository.create({
      inquiry_id: inquiryId,
      client_name: data.clientName,
      client_mobile: data.clientMobile,
      venue_name: data.venueName,
      city_name: data.cityName,
      inquiry_date: data.inquiryDate,
      start_date: data.startDate,
      end_date: data.endDate,
      event_function_name: data.eventFunctionName,
      status: data.status || 'inquiry',
      package_id: packageId,
      assigned_manager_id: assignedManagerId,
      is_live: data.status === 'live',
    }, userId);

    if (data.functions?.length) {
      for (const [i, fn] of data.functions.entries()) {
        await eventRepository.addFunction(eventId, {
          name: fn.name,
          venue: fn.venue,
          function_date: fn.date,
          start_time: toMysqlTime(fn.startTime),
          end_time: toMysqlTime(fn.endTime),
          pax: fn.pax,
          rate: fn.rate,
          sort_order: i,
        });
      }
    }

    if (menuItemIds.length) {
      await eventRepository.setMenuSelections(eventId, menuItemIds);
    }

    if (inquiryId) {
      await inquiryRepository.markConverted(inquiryId, eventId);
    }

    await activityRepository.log({
      eventId,
      userId,
      action: 'event_created',
      description: `Event created for ${data.clientName}`,
    });

    return this.getById(eventId);
  },

  async update(idOrUuid, data, userId) {
    const id = await resolveId('events', idOrUuid);
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);

    await eventRepository.update(id, {
      client_name: data.clientName,
      client_mobile: data.clientMobile,
      venue_name: data.venueName,
      city_name: data.cityName,
      inquiry_date: data.inquiryDate,
      start_date: data.startDate,
      end_date: data.endDate,
      event_function_name: data.eventFunctionName,
      status: data.status,
      package_id: data.packageId,
      assigned_manager_id: data.assignedManagerId,
      is_live: data.status === 'live',
    });

    if (data.menuItemIds) {
      await eventRepository.setMenuSelections(id, data.menuItemIds);
    }

    await activityRepository.log({
      eventId: id,
      userId,
      action: 'event_updated',
      description: `Event ${id} updated`,
      metadata: { status: data.status },
    });

    return this.getById(id);
  },

  async delete(idOrUuid, userId) {
    const id = await resolveId('events', idOrUuid);
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);
    await eventRepository.softDelete(id);
    await activityRepository.log({ eventId: id, userId, action: 'event_deleted', description: `Event ${id} deleted` });
    return { deleted: true };
  },

  async bulkDelete(idsOrUuids, userId) {
    const ids = await resolveIds('events', idsOrUuids);
    const affected = await eventRepository.bulkDelete(ids);
    for (const id of ids) {
      await activityRepository.log({ eventId: id, userId, action: 'event_bulk_deleted' });
    }
    return { affected };
  },

  async bulkUpdate(idsOrUuids, status, userId) {
    const ids = await resolveIds('events', idsOrUuids);
    const affected = await eventRepository.bulkUpdateStatus(ids, status);
    for (const id of ids) {
      await activityRepository.log({ eventId: id, userId, action: 'event_bulk_updated', metadata: { status } });
    }
    return { affected };
  },

  async addFunction(eventIdOrUuid, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    const functionId = await eventRepository.addFunction(eventId, {
      name: data.name,
      venue: data.venue,
      function_date: data.date,
      start_time: toMysqlTime(data.startTime),
      end_time: toMysqlTime(data.endTime),
      pax: data.pax,
      rate: data.rate,
    });
    const functions = await eventRepository.getFunctions(eventId);
    return functions.find((f) => f.id === functionId) || { id: functionId };
  },

  async updateFunction(eventIdOrUuid, functionId, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await eventRepository.updateFunction(eventId, functionId, {
      name: data.name,
      venue: data.venue,
      function_date: data.date,
      start_time: toMysqlTime(data.startTime),
      end_time: toMysqlTime(data.endTime),
      pax: data.pax,
      rate: data.rate,
    });
    const functions = await eventRepository.getFunctions(eventId);
    return functions.find((f) => f.id === Number(functionId));
  },

  async deleteFunction(eventIdOrUuid, functionId) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await eventRepository.deleteFunction(eventId, functionId);
    return { deleted: true };
  },

  export(res, query) {
    return eventRepository.findAllForExport(query).then((rows) =>
      sendExport(res, {
        format: query.format,
        filename: 'events',
        rows,
        columns: EVENT_EXPORT_COLUMNS,
        jsonData: { items: rows },
      })
    );
  },

  getMeta() {
    return {
      statuses: ['inquiry', 'confirmed', 'cancelled', 'r_menu', 'live'],
    };
  },
};

module.exports = eventService;
