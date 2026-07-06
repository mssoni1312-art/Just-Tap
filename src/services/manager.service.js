const bcrypt = require('bcrypt');
const pool = require('../config/database');
const staffRepository = require('../repositories/staff.repository');
const userRepository = require('../repositories/user.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const resolveCanonicalStaffId = async (staff) => {
  const canonical = await staffRepository.findByNameAndRole(staff.name, staff.role);
  return canonical?.id || staff.id;
};

const managerService = {
  async list(query) {
    if (query.forSelect === 'true') {
      const items = await staffRepository.findAllForExport({
        role: 'event_manager',
        includeInactive: query.includeInactive,
        search: query.search,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      return { items };
    }

    return staffRepository.findAll({ ...query, role: 'event_manager' });
  },

  async create(data) {
    const name = (data.name || data.memberName).trim();
    const designation = data.designation?.trim() || null;
    const existing = await staffRepository.findByNameAndRole(name, 'event_manager');
    let staffRow;
    if (existing) {
      const updates = {};
      if (designation && !existing.designation) {
        updates.designation = designation;
      }
      if (!existing.is_active) {
        updates.is_active = true;
      }
      if (Object.keys(updates).length) {
        await staffRepository.update(existing.id, updates);
      }
      staffRow = await staffRepository.findById(existing.id);
    } else {
      const id = await staffRepository.create({
        name,
        role: 'event_manager',
        designation,
        is_active: data.isActive,
      });
      staffRow = await staffRepository.findById(id);
    }

    const loginEmail = data.email || data.username;
    if (loginEmail && data.password && !staffRow.user_id) {
      return this.register(staffRow.id, { email: loginEmail, password: data.password });
    }

    return staffRepository.formatStaff(staffRow);
  },

  async register(staffIdOrUuid, { email, username, password }) {
    const staffId = await resolveId('staff', staffIdOrUuid);
    const staff = await staffRepository.findById(staffId);
    if (!staff) throw new AppError('Manager not found', 404);
    if (staff.role !== 'event_manager') {
      throw new AppError('Only event managers can be registered', 422);
    }

    const canonicalStaffId = await resolveCanonicalStaffId(staff);
    const canonicalStaff = await staffRepository.findById(canonicalStaffId);
    if (canonicalStaff.user_id) {
      throw new AppError('Manager is already registered', 409);
    }

    const loginEmail = email || username;
    if (!loginEmail) {
      throw new AppError('Email is required', 422);
    }
    const normalizedEmail = loginEmail.trim().toLowerCase();
    const existingUser = await userRepository.findByEmailOrPhone(normalizedEmail);
    if (existingUser) {
      throw new AppError('Email is already in use', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const nameParts = canonicalStaff.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    const handle = `@${normalizedEmail.split('@')[0]}`;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        `INSERT INTO users (email, password_hash, first_name, last_name, handle, role, status)
         VALUES (?, ?, ?, ?, ?, 'manager', 'active')`,
        [normalizedEmail, passwordHash, firstName, lastName, handle]
      );
      const userId = userResult.insertId;

      await connection.execute(
        `INSERT INTO user_preferences (user_id, push_enabled, email_alerts_enabled, dark_mode_enabled, onboarding_completed)
         VALUES (?, 1, 1, 0, 0)
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [userId]
      );

      await connection.execute(
        'UPDATE staff SET user_id = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [userId, canonicalStaffId]
      );

      await connection.commit();

      const row = await staffRepository.findById(canonicalStaffId);
      return staffRepository.formatStaff(row);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },
};

module.exports = managerService;
