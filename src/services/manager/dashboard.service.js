const managerDashboardRepository = require('../../repositories/manager/dashboard.repository');
const managerEvaluateIncomeRepository = require('../../repositories/manager/evaluateIncome.repository');
const staffRepository = require('../../repositories/staff.repository');
const AppError = require('../../utils/AppError');

const managerDashboardService = {
  getHomeStats: (staffId) => managerDashboardRepository.getHomeStats(staffId),

  async getEvaluateIncome(staffId) {
    const staff = await staffRepository.findById(staffId);
    if (!staff) {
      throw new AppError('Manager not found', 404);
    }

    const [tasks, totalIncome] = await Promise.all([
      managerEvaluateIncomeRepository.getTaskBreakdown(staffId),
      managerEvaluateIncomeRepository.getTotalIncome(staffId),
    ]);

    const completedTasks = tasks.filter((task) => task.status === 'completed').length;
    const pendingTasks = tasks.length - completedTasks;

    return {
      manager: {
        id: String(staff.id),
        name: staff.name,
      },
      summary: {
        totalTasks: tasks.length,
        pendingTasks,
        completedTasks,
      },
      income: {
        tasks,
        totalIncome,
      },
    };
  },
};

module.exports = managerDashboardService;
