const staffRepository = require('../repositories/staff.repository');
const { resolveId, resolveIds } = require('../helpers/idResolver');
const { sendExport } = require('../helpers/exportImport');
const AppError = require('../utils/AppError');

const STAFF_EXPORT_COLUMNS = [
  { label: 'ID', key: 'id' },
  { label: 'UUID', key: 'uuid' },
  { label: 'Name', key: 'name' },
  { label: 'Role', key: 'role' },
  { label: 'Active', accessor: (r) => (r.isActive ? 'yes' : 'no') },
];

const staffService = {
  async list(query) {
    return staffRepository.findAll(query);
  },

  async getById(idOrUuid) {
    const id = await resolveId('staff', idOrUuid);
    const row = await staffRepository.findById(id);
    if (!row) throw new AppError('Staff not found', 404);
    return staffRepository.formatStaff(row);
  },

  async create(data) {
    const name = data.name?.trim();
    const role = data.role || 'event_manager';
    const existing = await staffRepository.findByNameAndRole(name, role);
    if (existing) {
      return staffRepository.formatStaff(existing);
    }

    const id = await staffRepository.create({
      name,
      role,
      is_active: data.isActive,
    });
    return this.getById(id);
  },

  async update(idOrUuid, data) {
    const id = await resolveId('staff', idOrUuid);
    const row = await staffRepository.findById(id);
    if (!row) throw new AppError('Staff not found', 404);
    await staffRepository.update(id, {
      name: data.name,
      role: data.role,
      is_active: data.isActive,
    });
    return this.getById(id);
  },

  async remove(idOrUuid) {
    const id = await resolveId('staff', idOrUuid);
    const row = await staffRepository.findById(id);
    if (!row) throw new AppError('Staff not found', 404);
    await staffRepository.softDelete(id);
    return { deleted: true };
  },

  async bulkDelete(idsOrUuids) {
    const ids = await resolveIds('staff', idsOrUuids);
    return { affected: await staffRepository.bulkDelete(ids) };
  },

  async bulkUpdate(idsOrUuids, data) {
    const ids = await resolveIds('staff', idsOrUuids);
    return {
      affected: await staffRepository.bulkUpdate(ids, {
        is_active: data.isActive,
        role: data.role,
      }),
    };
  },

  async exportData(query) {
    return staffRepository.findAllForExport(query);
  },

  export(res, query) {
    return staffService.exportData(query).then((rows) =>
      sendExport(res, {
        format: query.format,
        filename: 'staff',
        rows,
        columns: STAFF_EXPORT_COLUMNS,
        jsonData: { items: rows },
      })
    );
  },

  async importRecords(records) {
    const created = [];
    for (const record of records) {
      const name = record.name?.trim();
      const role = record.role || 'event_manager';
      const existing = await staffRepository.findByNameAndRole(name, role);
      if (existing) {
        created.push(existing.id);
        continue;
      }
      const id = await staffRepository.create({
        name,
        role,
        is_active: record.isActive !== false,
      });
      created.push(id);
    }
    return { imported: created.length, ids: created };
  },
};

module.exports = staffService;
