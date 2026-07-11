const bcrypt = require('bcrypt');
const pool = require('../../config/database');
const jwtConfig = require('../../config/jwt');
const userRepository = require('../../repositories/user.repository');
const authRepository = require('../../repositories/auth.repository');
const clientRepository = require('../../repositories/client.repository');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateOtp,
} = require('../../helpers/token');
const notificationService = require('../notification.service');
const AppError = require('../../utils/AppError');

const getRefreshExpiry = () => {
  const days = parseInt(jwtConfig.refreshExpiresIn, 10) || 7;
  const d = new Date();
  d.setDate(d.getDate() + (String(jwtConfig.refreshExpiresIn).includes('d') ? days : 7));
  return d;
};

const issueClientTokens = async (user, client) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const token = generateAccessToken(payload);
  let refreshToken = generateRefreshToken(payload);
  const expiresAt = getRefreshExpiry();

  try {
    await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') throw err;
    refreshToken = generateRefreshToken(payload);
    await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);
  }

  return {
    token,
    refreshToken,
    user: {
      ...userRepository.formatUser(user),
      clientId: client.id,
      clientName: client.name,
      cityName: client.city_name || '',
    },
  };
};

const assertClientUser = async (identifier) => {
  const user = await userRepository.findAuthByEmailOrPhone(identifier);
  if (!user || user.role !== 'client') {
    throw new AppError('Invalid credentials', 401);
  }
  const client = await clientRepository.findByUserId(user.id);
  if (!client) {
    throw new AppError('Client profile not found', 403);
  }
  return { user, client };
};

const verifyPassword = async (password, passwordHash) => {
  if (!passwordHash) return false;
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch {
    return false;
  }
};

const clientAuthService = {
  async register({ email, password, name, phone, cityName }) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone?.trim() || null;

    const existingUser = await userRepository.findByEmailOrPhone(normalizedEmail);
    if (existingUser) {
      throw new AppError('Email is already in use', 409);
    }

    if (normalizedPhone) {
      const existingPhone = await userRepository.findByEmailOrPhone(normalizedPhone);
      if (existingPhone) {
        throw new AppError('Phone number is already in use', 409);
      }
    }

    const passwordHash = await bcrypt.hash(password, jwtConfig.bcryptRounds);
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    const handle = `@${normalizedEmail.split('@')[0]}`;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        `INSERT INTO users (email, phone, password_hash, first_name, last_name, handle, role, status)
         VALUES (?, ?, ?, ?, ?, ?, 'client', 'active')`,
        [normalizedEmail, normalizedPhone, passwordHash, firstName, lastName, handle]
      );
      const userId = userResult.insertId;

      await connection.execute(
        `INSERT INTO user_preferences (user_id, push_enabled, email_alerts_enabled, dark_mode_enabled, onboarding_completed)
         VALUES (?, 1, 1, 0, 0)
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [userId]
      );

      const [clientResult] = await connection.execute(
        `INSERT INTO clients (name, caterer_name, city_name, contact_no, reference, is_high_priority)
         VALUES (?, ?, ?, ?, '', 0)`,
        [name.trim(), name.trim(), cityName?.trim() || '', normalizedPhone]
      );
      const clientId = clientResult.insertId;

      await connection.execute(
        'UPDATE clients SET user_id = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [userId, clientId]
      );

      await connection.commit();

      const user = await userRepository.findAuthByEmailOrPhone(normalizedEmail);
      const client = await clientRepository.findById(clientId);
      const tokens = await issueClientTokens(user, client);
      return tokens;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async login(identifier, password) {
    const { user, client } = await assertClientUser(identifier);
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    await userRepository.updateLastLogin(user.id);
    return issueClientTokens(user, client);
  },

  async sendOtp(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const otp = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + jwtConfig.otpExpiresMinutes);

    await authRepository.createOtp(normalizedEmail, hashToken(otp), expiresAt);
    await notificationService.sendOtp(normalizedEmail, otp);

    return {
      message: 'OTP sent to email successfully',
      email: normalizedEmail,
      expiresInMinutes: jwtConfig.otpExpiresMinutes,
    };
  },

  async verifyOtp(email, code) {
    const normalizedEmail = email.trim().toLowerCase();
    const otpRecord = await authRepository.findValidOtp(normalizedEmail, hashToken(code));
    if (!otpRecord) throw new AppError('Invalid or expired OTP', 401);

    await authRepository.markOtpVerified(otpRecord.id);

    const user = await userRepository.findAuthByEmailOrPhone(normalizedEmail);
    if (user?.role === 'client') {
      const client = await clientRepository.findByUserId(user.id);
      if (!client) throw new AppError('Client profile not found', 403);

      await userRepository.updateLastLogin(user.id);
      const tokens = await issueClientTokens(user, client);
      return {
        ...tokens,
        emailVerified: true,
        message: 'Email verified and login successful',
      };
    }

    return {
      emailVerified: true,
      email: normalizedEmail,
      message: 'Email verified successfully',
    };
  },
};

module.exports = clientAuthService;
