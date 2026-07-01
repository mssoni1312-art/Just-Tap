const AppError = require('../utils/AppError');
const teamAllocationRepository = require('../repositories/team_allocation.repository');

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
};

module.exports = teamAllocationService;
