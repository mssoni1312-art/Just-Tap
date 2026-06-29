const taskRepository = require('../repositories/task.repository');
const eventRepository = require('../repositories/event.repository');
const { resolveId, resolveIds } = require('../helpers/idResolver');
const { sendExport } = require('../helpers/exportImport');
const AppError = require('../utils/AppError');

const TASK_EXPORT_COLUMNS = [
  { label: 'ID', key: 'id' },
  { label: 'UUID', key: 'uuid' },
  { label: 'Name', key: 'name' },
  { label: 'Category', key: 'category' },
  { label: 'Description', key: 'description' },
];

const taskService = {
  getSummary: () => taskRepository.getSummary(),

  list: (query) => taskRepository.findTemplates(query),

  async getById(idOrUuid) {
    const id = await resolveId('task_templates', idOrUuid);
    const row = await taskRepository.findTemplateById(id);
    if (!row) throw new AppError('Task template not found', 404);
    return {
      id: row.id,
      uuid: row.uuid,
      name: row.name,
      description: row.description,
      category: row.category,
      isActive: Boolean(row.is_active),
    };
  },

  async createTemplate(data) {
    const id = await taskRepository.createTemplate(data);
    return this.getById(id);
  },

  async updateTemplate(idOrUuid, data) {
    const id = await resolveId('task_templates', idOrUuid);
    const row = await taskRepository.findTemplateById(id);
    if (!row) throw new AppError('Task template not found', 404);
    await taskRepository.updateTemplate(id, data);
    return this.getById(id);
  },

  async removeTemplate(idOrUuid) {
    const id = await resolveId('task_templates', idOrUuid);
    const row = await taskRepository.findTemplateById(id);
    if (!row) throw new AppError('Task template not found', 404);
    await taskRepository.softDeleteTemplate(id);
    return { deleted: true };
  },

  async bulkDelete(idsOrUuids) {
    const ids = await resolveIds('task_templates', idsOrUuids);
    return { affected: await taskRepository.bulkDeleteTemplates(ids) };
  },

  async listByEvent(eventIdOrUuid, query) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    return taskRepository.findByEvent(eventId, query);
  },

  async assignToEvent(eventIdOrUuid, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    const tasks = data.tasks || [];
    if (!tasks.length) throw new AppError('No tasks selected', 400);
    const created = await taskRepository.assignToEvent(eventId, tasks, data.assignedTo);
    return { assigned: created.length, taskIds: created };
  },

  async exportData(query) {
    return taskRepository.findTemplatesForExport(query);
  },

  export(res, query) {
    return taskService.exportData(query).then((rows) =>
      sendExport(res, {
        format: query.format,
        filename: 'task-templates',
        rows,
        columns: TASK_EXPORT_COLUMNS,
        jsonData: { items: rows },
      })
    );
  },
};

module.exports = taskService;
