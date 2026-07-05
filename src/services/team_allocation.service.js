const AppError = require('../utils/AppError');
const teamAllocationRepository = require('../repositories/team_allocation.repository');
const taskRepository = require('../repositories/task.repository');

const VALID_TEAM_TYPES = new Set(['justTap', 'justSocial', 'photoVideo']);

const assertTeamType = (teamType) => {
  if (!VALID_TEAM_TYPES.has(teamType)) {
    throw new AppError('Invalid team type', 422);
  }
};

const teamAllocationService = {
  async getAllocation(teamType) {
    assertTeamType(teamType);
    return teamAllocationRepository.getAllocation(teamType);
  },

  async getStaffReport(teamType, staffId) {
    assertTeamType(teamType);
    const report = await teamAllocationRepository.getStaffReport(teamType, staffId);
    if (!report) {
      throw new AppError('Staff member not found', 404);
    }
    return report;
  },

  async assignTasksToStaff(teamType, staffId, data) {
    assertTeamType(teamType);

    const staff = await teamAllocationRepository.findStaffById(staffId);
    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    const tasks = data.tasks || [];
    if (!tasks.length) {
      throw new AppError('No tasks selected', 400);
    }

    const eventId = await teamAllocationRepository.resolveEventForStaff(staffId);
    if (!eventId) {
      throw new AppError('No active event found for assignment', 422);
    }

    const assignedTo = Number(staffId);
    const created = await taskRepository.assignToEvent(eventId, tasks, assignedTo);
    return { assigned: created.length, taskIds: created };
  },
};

module.exports = teamAllocationService;
