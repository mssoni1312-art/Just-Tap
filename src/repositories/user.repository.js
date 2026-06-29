const pool = require('../config/database');

const userRepository = {
  async findByEmailOrPhone(identifier) {
    const [rows] = await pool.execute(
      `SELECT * FROM users
       WHERE deleted_at IS NULL AND status = 'active'
       AND (email = ? OR phone = ?)
       LIMIT 1`,
      [identifier, identifier]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, email, phone, first_name, last_name, handle, avatar_url, role, status,
              last_login_at, created_at, updated_at
       FROM users WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  async updateLastLogin(id) {
    await pool.execute('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
  },

  async updatePassword(id, passwordHash) {
    await pool.execute('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [
      passwordHash,
      id,
    ]);
  },

  async updateProfile(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['first_name', 'last_name', 'handle', 'email', 'phone', 'avatar_url'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return this.findById(id);
    values.push(id);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    return this.findById(id);
  },

  formatUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      handle: user.handle,
      avatarUrl: user.avatar_url,
      role: user.role,
      status: user.status,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  },
};

module.exports = userRepository;
