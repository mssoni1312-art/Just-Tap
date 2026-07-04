const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const formatPdf = (row) => ({
  id: String(row.id),
  uuid: row.uuid,
  reportId: String(row.report_id),
  pdfUrl: row.pdf_url,
  storedName: row.stored_name,
  fileSizeBytes: row.file_size_bytes || null,
  pageCount: row.page_count || null,
  templateSlug: row.template_slug || null,
  generatedBy: row.generated_by ? String(row.generated_by) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const reportPdfRepository = {
  async findActiveByReportId(reportId) {
    const [rows] = await pool.execute(
      `SELECT * FROM report_pdf
       WHERE report_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [reportId]
    );
    return rows[0] ? formatPdf(rows[0]) : null;
  },

  async findById(pdfId) {
    const [rows] = await pool.execute(
      `SELECT * FROM report_pdf WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [pdfId]
    );
    return rows[0] ? formatPdf(rows[0]) : null;
  },

  async softDeleteByReportId(reportId) {
    await pool.execute(
      `UPDATE report_pdf SET deleted_at = NOW() WHERE report_id = ? AND deleted_at IS NULL`,
      [reportId]
    );
  },

  async create({ reportId, pdfUrl, storedName, fileSizeBytes, pageCount, templateSlug, generatedBy }) {
    await this.softDeleteByReportId(reportId);

    const [result] = await pool.execute(
      `INSERT INTO report_pdf
       (report_id, pdf_url, stored_name, file_size_bytes, page_count, template_slug, generated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reportId, pdfUrl, storedName, fileSizeBytes || null, pageCount || null, templateSlug || null, generatedBy || null]
    );

    return this.findById(result.insertId);
  },

  async softDelete(pdfId) {
    const [result] = await pool.execute(
      `UPDATE report_pdf SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [pdfId]
    );
    return result.affectedRows > 0;
  },

  async getMenuForReport(eventId, packageId, includeMenu) {
    if (!includeMenu) return [];

    const [selections] = await pool.execute(
      `SELECT mi.name, mi.description, mi.slogan, mc.name AS category, mi.is_veg, mi.image_url
       FROM event_menu_selections ems
       JOIN menu_items mi ON mi.id = ems.menu_item_id AND mi.deleted_at IS NULL
       JOIN menu_categories mc ON mc.id = mi.category_id AND mc.deleted_at IS NULL
       WHERE ems.event_id = ? AND ems.deleted_at IS NULL
       ORDER BY mc.sort_order, mi.name`,
      [eventId]
    );

    if (selections.length) return selections;

    if (!packageId) return [];

    const [packageItems] = await pool.execute(
      `SELECT mi.name, mi.description, mi.slogan, mc.name AS category, mi.is_veg, mi.image_url
       FROM menu_package_items mpi
       JOIN menu_items mi ON mi.id = mpi.menu_item_id AND mi.deleted_at IS NULL
       JOIN menu_categories mc ON mc.id = mi.category_id AND mc.deleted_at IS NULL
       WHERE mpi.package_id = ?
       ORDER BY mc.sort_order, mi.name`,
      [packageId]
    );

    return packageItems;
  },
};

module.exports = reportPdfRepository;
