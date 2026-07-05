const taskRepository = require('../../repositories/task.repository');
const taskService = require('../task.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');
const AppError = require('../../utils/AppError');

const formatEventTask = (row) => ({
  id: row.id,
  uuid: row.uuid,
  eventId: row.event_id,
  taskTemplateId: row.task_template_id,
  title: row.title,
  description: row.description,
  status: row.status,
  assignedTo: row.assigned_to,
  assigneeName: row.assignee_name || null,
  dueDate: row.due_date,
  eventClientName: row.event_client_name || null,
  eventVenue: row.event_venue || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const managerTaskService = {
  getSummary: () => taskRepository.getSummary(),
  listTemplates: (query) => taskService.list(query),
  getTemplateById: (id) => taskService.getById(id),

  list: (staffId, query) => taskRepository.findAllForManager(staffId, query),

  async listByEvent(staffId, eventIdOrUuid, query) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return taskService.listByEvent(eventId, query);
  },

  async getById(staffId, idOrUuid) {
    const id = await resolveId('event_tasks', idOrUuid);
    const row = await taskRepository.findEventTaskById(id);
    if (!row) throw new AppError('Task not found', 404);
    await assertManagerOwnsEvent(staffId, row.event_id);
    return formatEventTask(row);
  },

  async create(staffId, eventIdOrUuid, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    const tasks = data.tasks || [{
      title: data.title,
      description: data.description,
      task_template_id: data.taskTemplateId || data.task_template_id,
      due_date: data.dueDate || data.due_date,
    }];
    const created = await taskRepository.assignToEvent(eventId, tasks, data.assignedTo);
    return { assigned: created.length, taskIds: created };
  },

  async assign(staffId, eventIdOrUuid, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return taskService.assignToEvent(eventId, data);
  },

  async update(staffId, idOrUuid, data) {
    const id = await resolveId('event_tasks', idOrUuid);
    const row = await taskRepository.findEventTaskById(id);
    if (!row) throw new AppError('Task not found', 404);
    await assertManagerOwnsEvent(staffId, row.event_id);
    await taskRepository.updateEventTask(id, data);
    const updated = await taskRepository.findEventTaskById(id);
    return formatEventTask(updated);
  },

  async complete(staffId, idOrUuid) {
    const id = await resolveId('event_tasks', idOrUuid);
    const row = await taskRepository.findEventTaskById(id);
    if (!row) throw new AppError('Task not found', 404);
    await assertManagerOwnsEvent(staffId, row.event_id);
    await taskRepository.completeEventTask(id);
    return { completed: true };
  },

  async remove(staffId, idOrUuid) {
    const id = await resolveId('event_tasks', idOrUuid);
    const row = await taskRepository.findEventTaskById(id);
    if (!row) throw new AppError('Task not found', 404);
    await assertManagerOwnsEvent(staffId, row.event_id);
    await taskRepository.softDeleteEventTask(id);
    return { deleted: true };
  },
};

module.exports = managerTaskService;
