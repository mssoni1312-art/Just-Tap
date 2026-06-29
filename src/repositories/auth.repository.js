const pool = require('../config/database');
const { hashToken } = require('../helpers/token');

const authRepository = {
  async createRefreshToken(userId, token, expiresAt) {
    await pool.execute(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, hashToken(token), expiresAt]
    );
  },

  async findRefreshToken(token) {
    const [rows] = await pool.execute(
      `SELECT rt.*, u.id AS user_id, u.email, u.role, u.status
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? AND rt.revoked_at IS NULL AND rt.expires_at > NOW()
         AND u.deleted_at IS NULL`,
      [hashToken(token)]
    );
    return rows[0] || null;
  },

  async revokeRefreshToken(token) {
    await pool.execute(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?',
      [hashToken(token)]
    );
  },

  async revokeAllUserTokens(userId) {
    await pool.execute(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );
  },

  async createOtp(identifier, codeHash, expiresAt) {
    await pool.execute(
      'INSERT INTO otp_verifications (identifier, code_hash, expires_at) VALUES (?, ?, ?)',
      [identifier, codeHash, expiresAt]
    );
  },

  async findValidOtp(identifier, codeHash) {
    const [rows] = await pool.execute(
      `SELECT * FROM otp_verifications
       WHERE identifier = ? AND code_hash = ? AND verified_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [identifier, codeHash]
    );
    return rows[0] || null;
  },

  async markOtpVerified(id) {
    await pool.execute('UPDATE otp_verifications SET verified_at = NOW() WHERE id = ?', [id]);
  },

  async createPasswordResetToken(userId, tokenHash, expiresAt) {
    await pool.execute(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );
  },

  async findPasswordResetToken(tokenHash) {
    const [rows] = await pool.execute(
      `SELECT prt.*, u.id AS user_id, u.email
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = ? AND prt.used_at IS NULL AND prt.expires_at > NOW()
         AND u.deleted_at IS NULL`,
      [tokenHash]
    );
    return rows[0] || null;
  },

  async markPasswordResetUsed(id) {
    await pool.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [id]);
  },

  async getPreferences(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  async upsertPreferences(userId, data) {
    const existing = await this.getPreferences(userId);
    if (!existing) {
      await pool.execute(
        `INSERT INTO user_preferences (user_id, push_enabled, email_alerts_enabled, dark_mode_enabled, onboarding_completed)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          data.push_enabled ?? 1,
          data.email_alerts_enabled ?? 1,
          data.dark_mode_enabled ?? 1,
          data.onboarding_completed ?? 0,
        ]
      );
    } else {
      const fields = [];
      const values = [];
      const allowed = ['push_enabled', 'email_alerts_enabled', 'dark_mode_enabled', 'onboarding_completed'];
      for (const key of allowed) {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      }
      if (fields.length) {
        values.push(userId);
        await pool.execute(
          `UPDATE user_preferences SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
          values
        );
      }
    }
    return this.getPreferences(userId);
  },

  formatPreferences(prefs) {
    if (!prefs) return null;
    return {
      pushEnabled: Boolean(prefs.push_enabled),
      emailAlertsEnabled: Boolean(prefs.email_alerts_enabled),
      darkModeEnabled: Boolean(prefs.dark_mode_enabled),
      onboardingCompleted: Boolean(prefs.onboarding_completed),
    };
  },
};

module.exports = authRepository;
