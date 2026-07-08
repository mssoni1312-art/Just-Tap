const inquiryRepository = require('../repositories/inquiry.repository');
const activityRepository = require('../repositories/activity.repository');
const { resolveId, resolveIds } = require('../helpers/idResolver');
const { sendExport } = require('../helpers/exportImport');
const AppError = require('../utils/AppError');

const INQUIRY_EXPORT_COLUMNS = [
  { label: 'ID', key: 'id' },
  { label: 'UUID', key: 'uuid' },
  { label: 'Ref Number', key: 'refNumber' },
  { label: 'Client Name', key: 'clientName' },
  { label: 'Phone', key: 'clientPhone' },
  { label: 'Date Type', key: 'dateType' },
  { label: 'Event Date', key: 'date' },
  { label: 'Time Slot', key: 'timeSlot' },
  { label: 'Venue', key: 'venue' },
  { label: 'Function', key: 'functionName' },
  { label: 'Package', key: 'packageName' },
  { label: 'Capacity', key: 'capacity' },
  { label: 'Total Estimate', key: 'totalEstimate' },
  { label: 'Source', key: 'source' },
  { label: 'Selected Days', key: 'selectedDaysCount' },
  { label: 'Status', key: 'status' },
];

const inquiryService = {
  async getStats() {
    return inquiryRepository.getStats();
  },

  async list(query) {
    return inquiryRepository.findAll(query);
  },

  async getById(idOrUuid) {
    const id = await resolveId('inquiries', idOrUuid);
    const inquiry = await inquiryRepository.findById(id);
    if (!inquiry) throw new AppError('Inquiry not found', 404);
    return inquiryRepository.formatInquiryWithDays(inquiry);
  },

  async createClientInquiry(data) {
    const eventDay = data.eventDay;
    const refNumber = await inquiryRepository.generateRefNumber();
    const id = await inquiryRepository.createWithDays(
      {
        ref_number: refNumber,
        client_name: data.companyName,
        client_phone: data.contactNumber,
        date_type: data.dateType,
        event_date: eventDay.date,
        time_slot: eventDay.timeSlot,
        venue: eventDay.venueName,
        function_name: eventDay.functionName,
        capacity: String(eventDay.tabletsCount),
        total_estimate: data.totalEstimate ?? null,
        source: 'client',
      },
      [{
        day_number: 1,
        event_date: eventDay.date,
        venue_name: eventDay.venueName,
        function_name: eventDay.functionName,
        city: eventDay.city,
        tablets_count: eventDay.tabletsCount,
        time_slot: eventDay.timeSlot,
      }]
    );

    await activityRepository.log({
      action: 'client_inquiry_created',
      description: `Client inquiry ${refNumber} submitted`,
      metadata: { inquiryId: id, source: 'client' },
    });

    const inquiry = await this.getById(id);
    return {
      id: inquiry.id,
      uuid: inquiry.uuid,
      refNumber: inquiry.refNumber,
      status: inquiry.status,
      dateType: inquiry.dateType,
      selectedDaysCount: inquiry.selectedDaysCount,
      totalEstimate: inquiry.totalEstimate,
      message: 'Your inquiry has been submitted. Our team will contact you shortly.',
    };
  },

  async create(data, userId) {
    const refNumber = data.refNumber || await inquiryRepository.generateRefNumber();
    const id = await inquiryRepository.create({
      ref_number: refNumber,
      client_name: data.clientName,
      client_phone: data.clientPhone,
      date_type: 'single',
      event_date: data.eventDate,
      time_slot: data.timeSlot,
      venue: data.venue,
      function_name: data.functionName,
      package_name: data.packageName,
      package_id: data.packageId,
      capacity: data.capacity,
      source: 'admin',
    });
    await activityRepository.log({
      userId,
      action: 'inquiry_created',
      description: `Inquiry ${refNumber} created`,
      metadata: { inquiryId: id },
    });
    return this.getById(id);
  },

  async update(idOrUuid, data, userId) {
    const id = await resolveId('inquiries', idOrUuid);
    const inquiry = await inquiryRepository.findById(id);
    if (!inquiry) throw new AppError('Inquiry not found', 404);
    await inquiryRepository.update(id, {
      client_name: data.clientName,
      client_phone: data.clientPhone,
      event_date: data.eventDate,
      time_slot: data.timeSlot,
      venue: data.venue,
      function_name: data.functionName,
      package_name: data.packageName,
      package_id: data.packageId,
      capacity: data.capacity,
      status: data.status,
    });
    await activityRepository.log({ userId, action: 'inquiry_updated', description: `Inquiry ${id} updated` });
    return this.getById(id);
  },

  async remove(idOrUuid, userId) {
    const id = await resolveId('inquiries', idOrUuid);
    const inquiry = await inquiryRepository.findById(id);
    if (!inquiry) throw new AppError('Inquiry not found', 404);
    await inquiryRepository.softDelete(id);
    await activityRepository.log({ userId, action: 'inquiry_deleted', description: `Inquiry ${id} deleted` });
    return { deleted: true };
  },

  async bulkDelete(idsOrUuids, userId) {
    const ids = await resolveIds('inquiries', idsOrUuids);
    const affected = await inquiryRepository.bulkDelete(ids);
    await activityRepository.log({ userId, action: 'inquiry_bulk_deleted', metadata: { ids, affected } });
    return { affected };
  },

  async bulkUpdate(idsOrUuids, data, userId) {
    const ids = await resolveIds('inquiries', idsOrUuids);
    const affected = await inquiryRepository.bulkUpdate(ids, { status: data.status });
    await activityRepository.log({ userId, action: 'inquiry_bulk_updated', metadata: { ids, status: data.status } });
    return { affected };
  },

  async convert(idOrUuid) {
    const id = await resolveId('inquiries', idOrUuid);
    const inquiry = await inquiryRepository.findById(id);
    if (!inquiry) throw new AppError('Inquiry not found', 404);
    if (inquiry.status === 'converted') throw new AppError('Inquiry already converted', 400);

    const formatted = await inquiryRepository.formatInquiryWithDays(inquiry);
    const firstDay = formatted.eventDays[0];

    return {
      prefill: {
        inquiryId: inquiry.id,
        clientName: inquiry.client_name,
        venueName: inquiry.venue || firstDay?.venueName,
        eventFunctionName: inquiry.function_name || firstDay?.functionName,
        cityName: firstDay?.city,
        inquiryDate: inquiry.event_date || firstDay?.date,
        startDate: inquiry.event_date || firstDay?.date,
        endDate: formatted.eventDays.length
          ? formatted.eventDays[formatted.eventDays.length - 1].date
          : inquiry.event_date,
        packageName: inquiry.package_name,
        packageId: inquiry.package_id,
        capacity: inquiry.capacity,
      },
      inquiry: formatted,
    };
  },

  async exportData(query) {
    return inquiryRepository.findAllForExport(query);
  },

  export(res, query) {
    return inquiryService.exportData(query).then((rows) =>
      sendExport(res, {
        format: query.format,
        filename: 'inquiries',
        rows,
        columns: INQUIRY_EXPORT_COLUMNS,
        jsonData: { items: rows },
      })
    );
  },

  async importRecords(records, userId) {
    const created = [];
    for (const record of records) {
      const id = await inquiryRepository.create({
        ref_number: record.refNumber || record.ref_number || await inquiryRepository.generateRefNumber(),
        client_name: record.clientName || record.client_name,
        client_phone: record.clientPhone || record.client_phone,
        date_type: 'single',
        event_date: record.eventDate || record.event_date,
        time_slot: record.timeSlot || record.time_slot,
        venue: record.venue,
        function_name: record.functionName || record.function_name,
        package_name: record.packageName || record.package_name,
        package_id: record.packageId || record.package_id,
        capacity: record.capacity,
        source: 'admin',
      });
      created.push(id);
    }
    await activityRepository.log({ userId, action: 'inquiry_import', metadata: { count: created.length } });
    return { imported: created.length, ids: created };
  },
};

module.exports = inquiryService;
