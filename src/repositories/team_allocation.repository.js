const pool = require('../config/database');
const tableRepository = require('./table.repository');

const TEAM_TYPES = {
  justTap: {
    categories: ['service'],
    keywords: ['just tap', 'tap'],
  },
  justSocial: {
    categories: ['service', 'marketing'],
    keywords: ['social', 'follower'],
  },
  photoVideo: {
    categories: ['media', 'service'],
    keywords: ['photo', 'video', 'videography', 'photography'],
  },
};

const formatRole = (role) =>
  String(role || 'event_manager')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const matchesTeam = (teamType, task) => {
  const config = TEAM_TYPES[teamType];
  if (!config || !task) return false;

  const category = (task.templateCategory || '').toLowerCase();
  const haystack = `${task.title || ''} ${task.templateName || ''}`.toLowerCase();
  const categoryMatch = config.categories.includes(category);
  const keywordMatch = config.keywords.some((keyword) => haystack.includes(keyword));

  if (teamType === 'justTap') {
    return categoryMatch && keywordMatch;
  }

  return categoryMatch && keywordMatch;
};

const resolveBadge = (taskCount, maxTaskCount, index) => {
  if (taskCount > 0 && taskCount === maxTaskCount && maxTaskCount > 0) {
    return 'LEAD';
  }
  return ['ON-SITE', 'REMOTE', 'SUPPORT'][index % 3];
};

const resolveStatus = (isActive, tasks) => {
  if (!isActive) {
    return { statusLabel: 'OFFLINE', statusKey: 'offline' };
  }

  const statuses = tasks.map((task) => task.status);
  if (statuses.includes('in_progress')) {
    return { statusLabel: 'IN MEETING', statusKey: 'in_meeting' };
  }
  if (statuses.some((status) => ['assigned', 'pending', 'overdue'].includes(status))) {
    return { statusLabel: 'CURRENTLY ACTIVE', statusKey: 'active' };
  }

  return { statusLabel: 'CURRENTLY ACTIVE', statusKey: 'active' };
};

const fetchStaffTasks = async () => {
  const [rows] = await pool.execute(
    `SELECT
       s.id,
       s.name,
       s.role,
       s.designation,
       s.is_active AS isActive,
       et.id AS taskId,
       et.title,
       et.status,
       et.due_date AS dueDate,
       et.updated_at AS updatedAt,
       tt.name AS templateName,
       tt.category AS templateCategory
     FROM staff s
     LEFT JOIN event_tasks et
       ON et.assigned_to = s.id
       AND et.deleted_at IS NULL
       AND et.status <> 'completed'
     LEFT JOIN task_templates tt
       ON tt.id = et.task_template_id
       AND tt.deleted_at IS NULL
     WHERE s.deleted_at IS NULL
       AND s.is_active = 1
       AND s.role = 'event_manager'
     ORDER BY s.name ASC, et.updated_at DESC`
  );

  const grouped = new Map();

  for (const row of rows) {
    const staffId = String(row.id);
    if (!grouped.has(staffId)) {
      grouped.set(staffId, {
        id: staffId,
        name: row.name,
        role: row.designation?.trim() || formatRole(row.role),
        isActive: Boolean(row.isActive),
        tasks: [],
      });
    }

    if (row.taskId) {
      grouped.get(staffId).tasks.push({
        id: row.taskId,
        title: row.title,
        status: row.status,
        dueDate: row.dueDate,
        updatedAt: row.updatedAt,
        templateName: row.templateName,
        templateCategory: row.templateCategory,
      });
    }
  }

  return [...grouped.values()];
};

const teamAllocationRepository = {
  async findStaffById(staffId) {
    const [rows] = await pool.execute(
      `SELECT id, name, role, is_active AS isActive
       FROM staff
       WHERE id = ?
         AND deleted_at IS NULL
         AND role = 'event_manager'
       LIMIT 1`,
      [staffId]
    );
    return rows[0] || null;
  },

  async resolveEventForStaff(staffId) {
    const [rows] = await pool.execute(
      `SELECT e.id
       FROM events e
       LEFT JOIN event_manager_allocations ema
         ON ema.event_id = e.id
         AND ema.staff_id = ?
         AND ema.deleted_at IS NULL
       WHERE e.deleted_at IS NULL
         AND (e.assigned_manager_id = ? OR ema.id IS NOT NULL)
       ORDER BY
         CASE
           WHEN e.status = 'live' THEN 0
           WHEN e.status = 'confirmed' THEN 1
           ELSE 2
         END,
         e.start_date DESC,
         e.id DESC
       LIMIT 1`,
      [staffId, staffId]
    );

    if (rows[0]?.id) {
      return rows[0].id;
    }

    const [fallbackRows] = await pool.execute(
      `SELECT id
       FROM events
       WHERE deleted_at IS NULL
       ORDER BY
         CASE
           WHEN status = 'live' THEN 0
           WHEN status = 'confirmed' THEN 1
           ELSE 2
         END,
         start_date DESC,
         id DESC
       LIMIT 1`
    );

    return fallbackRows[0]?.id || null;
  },

  async getAllocation(teamType) {
    const staffMembers = await fetchStaffTasks();
    const members = staffMembers
      .map((member) => {
        const teamTasks = member.tasks.filter((task) => matchesTeam(teamType, task));
        return { ...member, teamTasks };
      })
      .filter((member) => member.teamTasks.length > 0 || staffMembers.length <= 12);

    const taskCounts = members.map((member) => member.teamTasks.length);
    const maxTaskCount = taskCounts.length ? Math.max(...taskCounts) : 0;

    const formattedMembers = members.map((member, index) => {
      const status = resolveStatus(member.isActive, member.teamTasks);
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        badge: resolveBadge(member.teamTasks.length, maxTaskCount, index),
        assignments: member.teamTasks.map((task) => task.title).slice(0, 4),
        statusLabel: status.statusLabel,
        statusKey: status.statusKey,
      };
    });

    const activeTasks = formattedMembers.reduce(
      (sum, member) => sum + member.assignments.length,
      0
    );

    const [todayRows] = await pool.execute(
      `SELECT COUNT(*) AS todayAdded
       FROM staff
       WHERE deleted_at IS NULL
         AND role = 'event_manager'
         AND DATE(created_at) = CURDATE()`
    );

    return {
      totalStaff: formattedMembers.length,
      activeTasks,
      todayAdded: Number(todayRows[0]?.todayAdded) || 0,
      members: formattedMembers,
    };
  },

  async getStaffReport(teamType, staffId) {
    const [staffRows] = await pool.execute(
      `SELECT id, name, role, is_active AS isActive
       FROM staff
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [staffId]
    );
    const staff = staffRows[0];
    if (!staff) return null;

    const [taskRows] = await pool.execute(
      `SELECT
         et.id,
         et.title,
         et.status,
         et.due_date AS dueDate,
         et.updated_at AS updatedAt,
         tt.name AS templateName,
         tt.category AS templateCategory
       FROM event_tasks et
       LEFT JOIN task_templates tt
         ON tt.id = et.task_template_id
         AND tt.deleted_at IS NULL
       WHERE et.deleted_at IS NULL
         AND et.assigned_to = ?
       ORDER BY et.updated_at DESC`,
      [staffId]
    );

    const teamTasks = taskRows.filter((task) =>
      matchesTeam(teamType, {
        title: task.title,
        templateName: task.templateName,
        templateCategory: task.templateCategory,
      })
    );

    const completed = teamTasks.filter((task) => task.status === 'completed');
    const pending = teamTasks.filter((task) => task.status !== 'completed');
    const totalCount = teamTasks.length;
    const completedCount = completed.length;
    const efficiencyScore =
      totalCount > 0 ? Number(((completedCount / totalCount) * 100).toFixed(1)) : 0;

    const formatTime = (value) => {
      if (!value) return '--:--';
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '--:--';
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    };

    const doneTasks = completed.slice(0, 6).map((task) => ({
      title: task.title,
      time: formatTime(task.updatedAt),
      isLocked: false,
    }));

    const pendingTasks = pending.slice(0, 6).map((task, index) => ({
      title: task.title,
      time: formatTime(task.dueDate || task.updatedAt),
      isLocked: task.status === 'overdue' || index === pending.length - 1,
    }));

    const timelineMap = new Map();
    for (const task of teamTasks) {
      const date = task.updatedAt ? new Date(task.updatedAt) : null;
      if (!date || Number.isNaN(date.getTime())) continue;
      if (date.toDateString() !== new Date().toDateString()) continue;
      const hour = date.getHours();
      timelineMap.set(hour, (timelineMap.get(hour) || 0) + 1);
    }

    const activityTimeline = [...timelineMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(-7)
      .map(([hour, value]) => ({
        label: String(hour).padStart(2, '0'),
        value,
      }));

    const eventId = await this.resolveEventForStaff(staffId);
    const managerTables = await tableRepository.findForManagerReport(
      staffId,
      staff.name,
      eventId
    );
    const assignedTables = managerTables.map((table) => {
      if (table.allocationType === 'captain') {
        return `Captain ${table.tableNumber}`;
      }
      return `Table ${table.tableNumber}`;
    });

    return {
      manager: {
        id: String(staff.id),
        name: staff.name,
        role: formatRole(staff.role),
        isActive: Boolean(staff.isActive),
      },
      efficiencyScore,
      assignedTables,
      stats: {
        interactions: completedCount,
        filesCaptured: pending.filter((task) =>
          /photo|video|capture|media/i.test(task.title)
        ).length,
        activeTimeLabel: `${Math.max(completedCount * 35, pending.length * 20)}m`,
        tasksCompletedLabel:
          totalCount > 0 ? `${completedCount}/${totalCount}` : '0/0',
      },
      doneTasks,
      pendingTasks,
      activityTimeline,
    };
  },
};

module.exports = teamAllocationRepository;
