const pool = require('../config/database');

const DEFAULT_TYPOGRAPHY = { fontPairing: 'playfair_inter', sizeScaling: 100 };
const DEFAULT_GRID = { preset: 'default', customIntensity: 70 };
const DEFAULT_PHOTO_FILTER = { preset: 'none', intensity: 80 };
const DEFAULT_COLORS = {
  primary: { hex: '#A9A9A9', opacity: 100 },
  secondary: { hex: '#D4AF37', opacity: 100 },
  accent: { hex: '#FFFFFF', opacity: 100 },
  background: { hex: '#1A1A1A', opacity: 100 },
};

const parseJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const formatTemplate = (row) => ({
  id: String(row.id),
  uuid: row.uuid,
  name: row.name,
  slug: row.slug,
  category: row.category,
  description: row.description || null,
  previewUrl: row.preview_url || null,
  thumbnailUrl: row.thumbnail_url || null,
  isActive: Boolean(row.is_active),
  sortOrder: row.sort_order,
});

const formatPhoto = (row) => ({
  id: String(row.id),
  imageUrl: row.image_url,
  sortOrder: row.sort_order,
});

const formatShare = (row) => ({
  id: String(row.id),
  uuid: row.uuid,
  shareToken: row.share_token,
  sharedAt: row.shared_at,
  expiresAt: row.expires_at || null,
  notes: row.notes || null,
});

const reportRepository = {
  async listTemplates({ category, search, page = 1, limit = 50 } = {}) {
    const conditions = ['deleted_at IS NULL', 'is_active = 1'];
    const params = [];

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }

    const where = conditions.join(' AND ');
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const offset = (safePage - 1) * safeLimit;

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM report_templates WHERE ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT * FROM report_templates
       WHERE ${where}
       ORDER BY sort_order, name
       LIMIT ${safeLimit} OFFSET ${offset}`,
      params
    );

    return {
      items: rows.map(formatTemplate),
      total: countRows[0].total,
    };
  },

  async findTemplateById(templateId) {
    const [rows] = await pool.execute(
      `SELECT * FROM report_templates WHERE id = ? AND deleted_at IS NULL AND is_active = 1 LIMIT 1`,
      [templateId]
    );
    return rows[0] ? formatTemplate(rows[0]) : null;
  },

  async findByEventId(eventId) {
    const [rows] = await pool.execute(
      `SELECT id FROM report_master WHERE event_id = ? AND deleted_at IS NULL LIMIT 1`,
      [eventId]
    );
    return rows[0]?.id || null;
  },

  async findById(reportId) {
    const [rows] = await pool.execute(
      `SELECT rm.*,
              rt.name AS template_name, rt.uuid AS template_uuid, rt.slug AS template_slug,
              rt.category AS template_category, rt.preview_url AS template_preview_url,
              rt.thumbnail_url AS template_thumbnail_url,
              mp.name AS package_name, mp.uuid AS package_uuid, mp.type AS package_type,
              e.uuid AS event_uuid, e.client_name, e.bride_name, e.groom_name,
              e.start_date AS event_start_date, e.venue_name, e.city_name
       FROM report_master rm
       LEFT JOIN report_templates rt ON rt.id = rm.template_id AND rt.deleted_at IS NULL
       LEFT JOIN menu_packages mp ON mp.id = rm.package_id AND mp.deleted_at IS NULL
       JOIN events e ON e.id = rm.event_id AND e.deleted_at IS NULL
       WHERE rm.id = ? AND rm.deleted_at IS NULL
       LIMIT 1`,
      [reportId]
    );
    if (!rows[0]) return null;

    const row = rows[0];
    const [settingsRows] = await pool.execute(
      `SELECT typography, grid, photo_filter FROM report_settings WHERE report_id = ?`,
      [reportId]
    );
    const [themeRows] = await pool.execute(
      `SELECT colors FROM report_theme WHERE report_id = ?`,
      [reportId]
    );
    const photos = await this.getPhotos(reportId);
    const [shareRows] = await pool.execute(
      `SELECT * FROM report_shares WHERE report_id = ? ORDER BY shared_at DESC LIMIT 1`,
      [reportId]
    );

    const settings = settingsRows[0] || {};
    const theme = themeRows[0] || {};

    return {
      id: String(row.id),
      uuid: row.uuid,
      eventId: String(row.event_id),
      eventUuid: row.event_uuid,
      clientName: row.client_name,
      brideName: row.bride_name || null,
      groomName: row.groom_name || null,
      eventStartDate: row.event_start_date,
      venueName: row.venue_name,
      cityName: row.city_name,
      template: row.template_id
        ? {
            id: String(row.template_id),
            uuid: row.template_uuid,
            name: row.template_name,
            slug: row.template_slug,
            category: row.template_category,
            previewUrl: row.template_preview_url || null,
            thumbnailUrl: row.template_thumbnail_url || null,
          }
        : null,
      package: row.package_id
        ? {
            id: String(row.package_id),
            uuid: row.package_uuid,
            name: row.package_name,
            type: row.package_type,
          }
        : null,
      status: row.status,
      includeMenuInTemplate: Boolean(row.include_menu_in_template),
      layoutPosition: row.layout_position || null,
      brideGroomPhotoUrl: row.bride_groom_photo_url || null,
      typography: parseJson(settings.typography, DEFAULT_TYPOGRAPHY),
      grid: parseJson(settings.grid, DEFAULT_GRID),
      photoFilter: parseJson(settings.photo_filter, DEFAULT_PHOTO_FILTER),
      theme: parseJson(theme.colors, DEFAULT_COLORS),
      photos,
      latestShare: shareRows[0] ? formatShare(shareRows[0]) : null,
      publishedAt: row.published_at || null,
      createdBy: row.created_by ? String(row.created_by) : null,
      updatedBy: row.updated_by ? String(row.updated_by) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async getPhotos(reportId) {
    const [rows] = await pool.execute(
      `SELECT * FROM report_photos
       WHERE report_id = ? AND deleted_at IS NULL
       ORDER BY sort_order, id`,
      [reportId]
    );
    return rows.map(formatPhoto);
  },

  async create({ eventId, packageId, templateId, includeMenuInTemplate, layoutPosition, userId }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO report_master
         (event_id, template_id, package_id, include_menu_in_template, layout_position, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId,
          templateId || null,
          packageId || null,
          includeMenuInTemplate !== false ? 1 : 0,
          layoutPosition || null,
          userId,
          userId,
        ]
      );

      const reportId = result.insertId;

      await conn.execute(
        `INSERT INTO report_settings (report_id, typography, grid, photo_filter)
         VALUES (?, ?, ?, ?)`,
        [
          reportId,
          JSON.stringify(DEFAULT_TYPOGRAPHY),
          JSON.stringify(DEFAULT_GRID),
          JSON.stringify(DEFAULT_PHOTO_FILTER),
        ]
      );

      await conn.execute(
        `INSERT INTO report_theme (report_id, colors) VALUES (?, ?)`,
        [reportId, JSON.stringify(DEFAULT_COLORS)]
      );

      await conn.commit();
      return reportId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async updateMaster(reportId, fields, userId) {
    const sets = [];
    const params = [];

    if (fields.templateId !== undefined) {
      sets.push('template_id = ?');
      params.push(fields.templateId);
    }
    if (fields.packageId !== undefined) {
      sets.push('package_id = ?');
      params.push(fields.packageId);
    }
    if (fields.includeMenuInTemplate !== undefined) {
      sets.push('include_menu_in_template = ?');
      params.push(fields.includeMenuInTemplate ? 1 : 0);
    }
    if (fields.layoutPosition !== undefined) {
      sets.push('layout_position = ?');
      params.push(fields.layoutPosition);
    }
    if (fields.brideGroomPhotoUrl !== undefined) {
      sets.push('bride_groom_photo_url = ?');
      params.push(fields.brideGroomPhotoUrl);
    }
    if (fields.status !== undefined) {
      sets.push('status = ?');
      params.push(fields.status);
    }
    if (fields.publishedAt !== undefined) {
      sets.push('published_at = ?');
      params.push(fields.publishedAt);
    }

    if (!sets.length) return;

    sets.push('updated_by = ?');
    params.push(userId);
    params.push(reportId);

    await pool.execute(
      `UPDATE report_master SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      params
    );
  },

  async upsertSettings(reportId, { typography, grid, photoFilter }) {
    const [existing] = await pool.execute(
      `SELECT report_id FROM report_settings WHERE report_id = ?`,
      [reportId]
    );

    if (!existing.length) {
      await pool.execute(
        `INSERT INTO report_settings (report_id, typography, grid, photo_filter) VALUES (?, ?, ?, ?)`,
        [
          reportId,
          typography ? JSON.stringify(typography) : null,
          grid ? JSON.stringify(grid) : null,
          photoFilter ? JSON.stringify(photoFilter) : null,
        ]
      );
      return;
    }

    const sets = [];
    const params = [];

    if (typography !== undefined) {
      sets.push('typography = ?');
      params.push(JSON.stringify(typography));
    }
    if (grid !== undefined) {
      sets.push('grid = ?');
      params.push(JSON.stringify(grid));
    }
    if (photoFilter !== undefined) {
      sets.push('photo_filter = ?');
      params.push(JSON.stringify(photoFilter));
    }

    if (!sets.length) return;

    params.push(reportId);
    await pool.execute(
      `UPDATE report_settings SET ${sets.join(', ')} WHERE report_id = ?`,
      params
    );
  },

  async upsertTheme(reportId, colors) {
    const [existing] = await pool.execute(
      `SELECT report_id FROM report_theme WHERE report_id = ?`,
      [reportId]
    );

    if (!existing.length) {
      await pool.execute(
        `INSERT INTO report_theme (report_id, colors) VALUES (?, ?)`,
        [reportId, JSON.stringify(colors)]
      );
      return;
    }

    await pool.execute(
      `UPDATE report_theme SET colors = ? WHERE report_id = ?`,
      [JSON.stringify(colors), reportId]
    );
  },

  async addPhoto(reportId, { imageUrl, uploadId, sortOrder = 0 }) {
    const [result] = await pool.execute(
      `INSERT INTO report_photos (report_id, image_url, upload_id, sort_order) VALUES (?, ?, ?, ?)`,
      [reportId, imageUrl, uploadId || null, sortOrder]
    );
    return result.insertId;
  },

  async findPhotoById(photoId) {
    const [rows] = await pool.execute(
      `SELECT id, report_id, image_url, upload_id, sort_order
       FROM report_photos
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [photoId]
    );
    if (!rows[0]) return null;
    return {
      id: rows[0].id,
      reportId: rows[0].report_id,
      imageUrl: rows[0].image_url,
      uploadId: rows[0].upload_id,
      sortOrder: rows[0].sort_order,
    };
  },

  async softDeletePhoto(photoId) {
    const [result] = await pool.execute(
      `UPDATE report_photos SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [photoId]
    );
    return result.affectedRows > 0;
  },

  async createShare(reportId, { shareToken, sharedBy, expiresAt, notes }) {
    const [result] = await pool.execute(
      `INSERT INTO report_shares (report_id, share_token, shared_by, expires_at, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [reportId, shareToken, sharedBy, expiresAt || null, notes || null]
    );
    return result.insertId;
  },

  async getOwnerId(reportId) {
    const [rows] = await pool.execute(
      `SELECT created_by FROM report_master WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [reportId]
    );
    return rows[0]?.created_by || null;
  },

  async getEventId(reportId) {
    const [rows] = await pool.execute(
      `SELECT event_id FROM report_master WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [reportId]
    );
    return rows[0]?.event_id || null;
  },
};

module.exports = reportRepository;
