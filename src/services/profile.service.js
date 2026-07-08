const userRepository = require('../repositories/user.repository');
const authRepository = require('../repositories/auth.repository');
const { contentRepository, uploadRepository, analyticsRepository } = require('../repositories/content.repository');
const AppError = require('../utils/AppError');

const profileService = {
  async updateProfile(userId, data) {
    const update = {};
    if (data.firstName !== undefined) update.first_name = data.firstName;
    if (data.lastName !== undefined) update.last_name = data.lastName;
    if (data.handle !== undefined) update.handle = data.handle;
    if (data.email !== undefined) update.email = data.email;
    if (data.phone !== undefined) update.phone = data.phone;
    const user = await userRepository.updateProfile(userId, update);
    return userRepository.formatUser(user);
  },

  async updatePreferences(userId, data) {
    const prefs = await authRepository.upsertPreferences(userId, {
      push_enabled: data.pushEnabled !== undefined ? (data.pushEnabled ? 1 : 0) : undefined,
      email_alerts_enabled: data.emailAlertsEnabled !== undefined ? (data.emailAlertsEnabled ? 1 : 0) : undefined,
      dark_mode_enabled: data.darkModeEnabled !== undefined ? (data.darkModeEnabled ? 1 : 0) : undefined,
      onboarding_completed: data.onboardingCompleted !== undefined ? (data.onboardingCompleted ? 1 : 0) : undefined,
    });
    return authRepository.formatPreferences(prefs);
  },

  async saveAvatar(userId, file) {
    if (!file) throw new AppError('No file uploaded', 400);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const avatarUrl = `${baseUrl}/uploads/images/${file.filename}`;
    await uploadRepository.create({
      user_id: userId,
      original_name: file.originalname,
      stored_name: file.filename,
      mime_type: file.mimetype,
      size_bytes: file.size,
      upload_type: 'avatar',
    });
    const user = await userRepository.updateProfile(userId, { avatar_url: avatarUrl });
    return { avatarUrl, user: userRepository.formatUser(user) };
  },
};

const contentService = {
  getAbout: () => contentRepository.getPage('about'),
  getContact: () => contentRepository.getPage('contact'),
};

const uploadService = {
  async saveUpload(userId, file, type) {
    if (!file) throw new AppError('No file uploaded', 400);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const folder = type === 'document' ? 'documents' : type === 'video' ? 'videos' : 'images';
    const url = `${baseUrl}/uploads/${folder}/${file.filename}`;
    const id = await uploadRepository.create({
      user_id: userId,
      original_name: file.originalname,
      stored_name: file.filename,
      mime_type: file.mimetype,
      size_bytes: file.size,
      upload_type: type,
    });
    return { id, url, originalName: file.originalname };
  },
};

const analyticsService = {
  getSales: () => analyticsRepository.getSalesChart(),
  getMenuReport: (query) => analyticsRepository.getMenuReport(query),
  getPackageRevenue: (staffId) => analyticsRepository.getPackageRevenue(staffId),
};

module.exports = { profileService, contentService, uploadService, analyticsService };
