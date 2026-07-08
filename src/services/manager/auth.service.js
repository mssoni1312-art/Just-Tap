const bcrypt = require('bcrypt');
const jwtConfig = require('../../config/jwt');
const userRepository = require('../../repositories/user.repository');
const authRepository = require('../../repositories/auth.repository');
const staffRepository = require('../../repositories/staff.repository');
const notificationService = require('../notification.service');
const authService = require('../auth.service');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateOtp,
  generateResetToken,
} = require('../../helpers/token');
const AppError = require('../../utils/AppError');

const getRefreshExpiry = () => {
  const days = parseInt(jwtConfig.refreshExpiresIn, 10) || 7;
  const d = new Date();
  d.setDate(d.getDate() + (String(jwtConfig.refreshExpiresIn).includes('d') ? days : 7));
  return d;
};

const issueManagerTokens = async (user, staff) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const token = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await authRepository.createRefreshToken(user.id, refreshToken, getRefreshExpiry());
  return {
    token,
    refreshToken,
    user: {
      ...userRepository.formatUser(user),
      staffId: staff.id,
      staffName: staff.name,
    },
  };
};

const assertManagerUser = async (identifier) => {
  const user = await userRepository.findByEmailOrPhone(identifier);
  if (!user || user.role !== 'manager') {
    throw new AppError('Invalid credentials', 401);
  }
  const staff = await staffRepository.findByUserId(user.id);
  if (!staff) {
    throw new AppError('Manager staff profile not found', 403);
  }
  return { user, staff };
};

const verifyPassword = async (password, passwordHash) => {
  if (!passwordHash) return false;
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch {
    return false;
  }
};

const managerAuthService = {
  async login(identifier, password) {
    const { user, staff } = await assertManagerUser(identifier);
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    await userRepository.updateLastLogin(user.id);
    const tokens = await issueManagerTokens(user, staff);
    return tokens;
  },

  logout: (refreshToken) => authService.logout(refreshToken),

  async refresh(refreshToken) {
    if (!refreshToken) throw new AppError('Refresh token required', 400);
    const stored = await authRepository.findRefreshToken(refreshToken);
    if (!stored) throw new AppError('Invalid refresh token', 401);

    await authRepository.revokeRefreshToken(refreshToken);
    const user = await userRepository.findById(stored.user_id);
    if (!user || user.role !== 'manager') throw new AppError('Invalid refresh token', 401);

    const staff = await staffRepository.findByUserId(user.id);
    if (!staff) throw new AppError('Manager staff profile not found', 403);

    return issueManagerTokens(user, staff);
  },

  async sendOtp(identifier) {
    await assertManagerUser(identifier);
    const otp = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + jwtConfig.otpExpiresMinutes);
    await authRepository.createOtp(identifier, hashToken(otp), expiresAt);
    await notificationService.sendOtp(identifier, otp);
    return { message: 'OTP sent successfully', expiresInMinutes: jwtConfig.otpExpiresMinutes };
  },

  async verifyOtp(identifier, code) {
    const otpRecord = await authRepository.findValidOtp(identifier, hashToken(code));
    if (!otpRecord) throw new AppError('Invalid or expired OTP', 401);

    const { user, staff } = await assertManagerUser(identifier);
    await authRepository.markOtpVerified(otpRecord.id);
    await userRepository.updateLastLogin(user.id);
    return issueManagerTokens(user, staff);
  },

  forgotPassword: (identifier) => authService.forgotPassword(identifier),
  resetPassword: (token, newPassword) => authService.resetPassword(token, newPassword),
  changePassword: (userId, currentPassword, newPassword) =>
    authService.changePassword(userId, currentPassword, newPassword),

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user || user.role !== 'manager') throw new AppError('User not found', 404);
    const staff = await staffRepository.findByUserId(userId);
    const prefs = await authRepository.getPreferences(userId);
    return {
      user: {
        ...userRepository.formatUser(user),
        staffId: staff?.id || null,
        staffName: staff?.name || null,
      },
      preferences: authRepository.formatPreferences(prefs),
    };
  },
};

module.exports = managerAuthService;
