const bcrypt = require('bcrypt');
const jwtConfig = require('../config/jwt');
const userRepository = require('../repositories/user.repository');
const authRepository = require('../repositories/auth.repository');
const notificationService = require('../services/notification.service');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateOtp,
  generateResetToken,
} = require('../helpers/token');
const AppError = require('../utils/AppError');

const getRefreshExpiry = () => {
  const days = parseInt(jwtConfig.refreshExpiresIn, 10) || 7;
  const d = new Date();
  d.setDate(d.getDate() + (String(jwtConfig.refreshExpiresIn).includes('d') ? days : 7));
  return d;
};

const issueTokens = async (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const token = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await authRepository.createRefreshToken(user.id, refreshToken, getRefreshExpiry());
  return { token, refreshToken };
};

const authService = {
  async login(identifier, password) {
    const user = await userRepository.findByEmailOrPhone(identifier);
    if (!user) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    await userRepository.updateLastLogin(user.id);
    const tokens = await issueTokens(user);
    return {
      ...tokens,
      user: userRepository.formatUser(user),
    };
  },

  async logout(refreshToken) {
    if (refreshToken) {
      await authRepository.revokeRefreshToken(refreshToken);
    }
    return true;
  },

  async refresh(refreshToken) {
    if (!refreshToken) throw new AppError('Refresh token required', 400);
    const stored = await authRepository.findRefreshToken(refreshToken);
    if (!stored) throw new AppError('Invalid refresh token', 401);

    await authRepository.revokeRefreshToken(refreshToken);
    const user = await userRepository.findById(stored.user_id);
    if (!user) throw new AppError('User not found', 404);

    const tokens = await issueTokens(user);
    return { ...tokens, user: userRepository.formatUser(user) };
  },

  async sendOtp(identifier) {
    const user = await userRepository.findByEmailOrPhone(identifier);
    if (!user) throw new AppError('No account found for this identifier', 404);

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

    const user = await userRepository.findByEmailOrPhone(identifier);
    if (!user) throw new AppError('User not found', 404);

    await authRepository.markOtpVerified(otpRecord.id);
    await userRepository.updateLastLogin(user.id);
    const tokens = await issueTokens(user);
    return { ...tokens, user: userRepository.formatUser(user) };
  },

  async forgotPassword(identifier) {
    const user = await userRepository.findByEmailOrPhone(identifier);
    if (!user) {
      return { message: 'If the account exists, a reset link has been sent' };
    }

    const resetToken = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + jwtConfig.passwordResetExpiresMinutes);

    await authRepository.createPasswordResetToken(user.id, hashToken(resetToken), expiresAt);
    await notificationService.sendPasswordReset(user.email, resetToken);
    return { message: 'If the account exists, a reset link has been sent' };
  },

  async resetPassword(token, newPassword) {
    const record = await authRepository.findPasswordResetToken(hashToken(token));
    if (!record) throw new AppError('Invalid or expired reset token', 400);

    const passwordHash = await bcrypt.hash(newPassword, jwtConfig.bcryptRounds);
    await userRepository.updatePassword(record.user_id, passwordHash);
    await authRepository.markPasswordResetUsed(record.id);
    await authRepository.revokeAllUserTokens(record.user_id);
    return { message: 'Password reset successfully' };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const [rows] = await require('../config/database').execute(
      'SELECT password_hash FROM users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );
    const user = rows[0];
    if (!user) throw new AppError('User not found', 404);

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    const passwordHash = await bcrypt.hash(newPassword, jwtConfig.bcryptRounds);
    await userRepository.updatePassword(userId, passwordHash);
    await authRepository.revokeAllUserTokens(userId);
    return { message: 'Password changed successfully' };
  },

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const prefs = await authRepository.getPreferences(userId);
    return {
      user: userRepository.formatUser(user),
      preferences: authRepository.formatPreferences(prefs),
    };
  },
};

module.exports = authService;
