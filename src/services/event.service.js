const eventRepository = require('../repositories/event.repository');
const inquiryRepository = require('../repositories/inquiry.repository');
const activityRepository = require('../repositories/activity.repository');
const clientRepository = require('../repositories/client.repository');
const { resolveId, resolveIds } = require('../helpers/idResolver');
const { sendExport } = require('../helpers/exportImport');
const { eventStatuses, eventMetaStatuses } = require('../validations/event.validation');
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

const normalizeFunctionInput = (fn) => {
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
  return fn;
};

async function resolveAssignedManagers(data) {
  const managerIds = data.justTapInformation?.assignedManagerIds ?? data.assignedManagerIds;
  const managerId = data.justTapInformation?.assignedManagerId ?? data.assignedManagerId;

  if (managerIds !== undefined) {
    const staffIds = managerIds.length
      ? await resolveIds('staff', managerIds)
      : [];
    return { staffIds, assignedManagerId: staffIds[0] || null };
  }

  if (managerId !== undefined) {
    let assignedManagerId = managerId;
    if (assignedManagerId && typeof assignedManagerId === 'string' && assignedManagerId.includes('-')) {
      assignedManagerId = await resolveId('staff', assignedManagerId);
    }
    const staffIds = assignedManagerId ? [assignedManagerId] : [];
    return { staffIds, assignedManagerId: assignedManagerId || null };
  }

  return null;
}

async function resolveAssignedCaptains(data) {
  const captainIds = data.justTapInformation?.assignedCaptainIds;
  if (captainIds === undefined) return null;
  const staffIds = captainIds.length
    ? await resolveIds('staff', captainIds)
    : [];
  return staffIds;
}

function enrichTabFourResponse(event, {
  managerAllocations,
  captainAllocations,
  brideGroomImageUrls,
}) {
  const managerNames = managerAllocations.map((m) => m.name).filter(Boolean);
  const captainNames = captainAllocations.map((c) => c.name).filter(Boolean);

  return {
    ...event,
    assignedManagerIds: managerAllocations.map((m) => m.id),
    managerNames,
    managerName: managerNames.join(', ') || event.managerName || null,
    justTapInformation: {
      ...event.justTapInformation,
      assignedCaptainIds: captainAllocations.map((c) => c.id),
      captainNames,
      assignedManagerIds: managerAllocations.map((m) => m.id),
      managerNames,
    },
    brideGroomInformation: {
      ...event.brideGroomInformation,
      imageUrls: brideGroomImageUrls,
    },
  };
}

async function resolveClientDetails(data) {
  const hasClientId = data.clientId !== undefined && data.clientId !== null && data.clientId !== '';
  const clientAddress = data.clientAddress || data.catererName || null;

  if (hasClientId) {
    const clientId = await resolveId('clients', data.clientId);
    const client = await clientRepository.findById(clientId);
    if (!client) throw new AppError('Client not found', 404);
    return {
      clientId,
      clientName: data.clientName || client.name,
      clientMobile: data.clientMobile ?? client.contact_no,
      cityName: data.cityName || client.city_name,
      catererName: data.catererName || client.caterer_name,
      clientAddress: clientAddress || client.client_address || client.caterer_name,
      reference: data.reference || client.reference,
      isHighPriority: data.isHighPriority ?? Boolean(client.is_high_priority),
    };
  }

  const clientId = await clientRepository.create({
    name: data.clientName,
    caterer_name: data.catererName || clientAddress || data.clientName,
    client_address: clientAddress,
    city_name: data.cityName,
    contact_no: data.clientMobile,
    reference: data.reference,
    is_high_priority: data.isHighPriority,
  });

  return {
    clientId,
    clientName: data.clientName,
    clientMobile: data.clientMobile,
    cityName: data.cityName,
    catererName: data.catererName || clientAddress || data.clientName,
    clientAddress,
    reference: data.reference,
    isHighPriority: Boolean(data.isHighPriority),
  };
}

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
    return { calendar, legend: eventStatuses };
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
    let managerAllocations = await eventRepository.getManagerAllocations(id);
    if (!managerAllocations.length && event.assigned_manager_id) {
      managerAllocations = [{
        id: event.assigned_manager_id,
        name: event.manager_name,
      }];
    }
    const captainAllocations = await eventRepository.getCaptainAllocations(id);
    const brideGroomImageUrls = await eventRepository.getBrideGroomImages(id);
    return enrichTabFourResponse(
      {
        ...eventRepository.formatEvent(event),
        functions,
        menuItems: menuItems.map((m) => ({
          id: String(m.id),
          name: m.name,
          category: m.category,
          price: String(m.price),
          isVeg: Boolean(m.is_veg),
        })),
      },
      { managerAllocations, captainAllocations, brideGroomImageUrls }
    );
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

    const managerAssignment = await resolveAssignedManagers(data);
    const captainIds = await resolveAssignedCaptains(data);
    const clientDetails = await resolveClientDetails(data);

    const eventId = await eventRepository.create({
      inquiry_id: inquiryId,
      client_id: clientDetails.clientId,
      client_name: clientDetails.clientName,
      client_mobile: clientDetails.clientMobile,
      caterer_name: clientDetails.catererName,
      client_address: clientDetails.clientAddress,
      reference: clientDetails.reference,
      is_high_priority: clientDetails.isHighPriority,
      venue_name: data.venueName,
      city_name: clientDetails.cityName,
      inquiry_date: data.inquiryDate,
      start_date: data.startDate,
      end_date: data.endDate,
      event_function_name: data.eventFunctionName,
      status: data.status || 'inquiry',
      package_id: packageId,
      assigned_manager_id: managerAssignment?.assignedManagerId ?? null,
      is_live: data.status === 'live',
      tablet_service: data.tabletService,
      media_client_address: data.mediaClientAddress,
      justTapInformation: data.justTapInformation,
      photographyVideography: data.photographyVideography,
      justSocialInformation: data.justSocialInformation,
      brideGroomInformation: data.brideGroomInformation,
      pricing: data.pricing,
    }, userId);

    if (managerAssignment) {
      await eventRepository.setManagerAllocations(eventId, managerAssignment.staffIds);
    }

    if (captainIds) {
      await eventRepository.setCaptainAllocations(eventId, captainIds);
    }

    if (data.brideGroomInformation?.imageUrls) {
      await eventRepository.setBrideGroomImages(eventId, data.brideGroomInformation.imageUrls);
    }

    if (data.functions?.length) {
      for (const [i, rawFn] of data.functions.entries()) {
        const fn = normalizeFunctionInput(rawFn);
        await eventRepository.addFunction(eventId, {
          name: fn.name,
          venue: fn.venue,
          function_date: fn.date,
          start_time: toMysqlTime(fn.startTime),
          end_time: toMysqlTime(fn.endTime),
          pax: fn.pax,
          sub_venue_remarks: fn.subVenueRemarks,
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
      description: `Event created for ${clientDetails.clientName}`,
    });

    return this.getById(eventId);
  },

  async update(idOrUuid, data, userId) {
    const id = await resolveId('events', idOrUuid);
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError('Event not found', 404);

    const managerAssignment = await resolveAssignedManagers(data);
    if (managerAssignment) {
      await eventRepository.setManagerAllocations(id, managerAssignment.staffIds);
    }

    const captainIds = await resolveAssignedCaptains(data);
    if (captainIds) {
      await eventRepository.setCaptainAllocations(id, captainIds);
    }

    await eventRepository.update(id, {
      client_id: data.clientId !== undefined ? (data.clientId ? await resolveId('clients', data.clientId) : null) : undefined,
      client_name: data.clientName,
      client_mobile: data.clientMobile,
      caterer_name: data.catererName,
      client_address: data.clientAddress,
      reference: data.reference,
      is_high_priority: data.isHighPriority,
      venue_name: data.venueName,
      city_name: data.cityName,
      inquiry_date: data.inquiryDate,
      start_date: data.startDate,
      end_date: data.endDate,
      event_function_name: data.eventFunctionName,
      status: data.status,
      package_id: data.packageId,
      assigned_manager_id: managerAssignment?.assignedManagerId,
      is_live: data.status === 'live',
      tablet_service: data.tabletService,
      media_client_address: data.mediaClientAddress,
      justTapInformation: data.justTapInformation,
      photographyVideography: data.photographyVideography,
      justSocialInformation: data.justSocialInformation,
      brideGroomInformation: data.brideGroomInformation,
      pricing: data.pricing,
    });

    if (data.brideGroomInformation?.imageUrls) {
      await eventRepository.setBrideGroomImages(id, data.brideGroomInformation.imageUrls);
    }

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
    const fn = normalizeFunctionInput(data);
    const functionId = await eventRepository.addFunction(eventId, {
      name: fn.name,
      venue: fn.venue,
      function_date: fn.date,
      start_time: toMysqlTime(fn.startTime),
      end_time: toMysqlTime(fn.endTime),
      pax: fn.pax,
      sub_venue_remarks: fn.subVenueRemarks,
      rate: fn.rate,
    });
    const functions = await eventRepository.getFunctions(eventId);
    return functions.find((f) => f.id === functionId) || { id: functionId };
  },

  async updateFunction(eventIdOrUuid, functionId, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const fn = normalizeFunctionInput(data);
    await eventRepository.updateFunction(eventId, functionId, {
      name: fn.name,
      venue: fn.venue,
      function_date: fn.date,
      start_time: toMysqlTime(fn.startTime),
      end_time: toMysqlTime(fn.endTime),
      pax: fn.pax,
      sub_venue_remarks: fn.subVenueRemarks,
      rate: fn.rate,
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
      statuses: eventMetaStatuses,
    };
  },
};

module.exports = eventService;
