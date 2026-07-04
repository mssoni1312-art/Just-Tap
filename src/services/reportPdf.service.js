const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const puppeteer = require('puppeteer');
const reportRepository = require('../repositories/report.repository');
const reportPdfRepository = require('../repositories/reportPdf.repository');
const eventRepository = require('../repositories/event.repository');
const activityRepository = require('../repositories/activity.repository');
const { renderReportHtml, REPORT_ROOT } = require('../helpers/reportTemplateEngine');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const PDF_DIR = path.join(process.cwd(), 'uploads', 'reports');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let browserPromise = null;

function resolveChromePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function getLaunchOptions() {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--font-render-hinting=none',
  ];

  const options = {
    headless: true,
    args,
  };

  const systemChrome = resolveChromePath();
  if (systemChrome) {
    options.executablePath = systemChrome;
    return options;
  }

  // Ignore invalid PUPPETEER_EXECUTABLE_PATH when system Chrome is unavailable
  const savedPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  delete process.env.PUPPETEER_EXECUTABLE_PATH;
  try {
    const bundled = puppeteer.executablePath();
    if (fs.existsSync(bundled)) {
      options.executablePath = bundled;
    }
  } finally {
    if (savedPath !== undefined) process.env.PUPPETEER_EXECUTABLE_PATH = savedPath;
  }

  return options;
}

async function getBrowser() {
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      if (browser.isConnected()) return browser;
    } catch {
      browserPromise = null;
    }
  }

  browserPromise =   puppeteer.launch(getLaunchOptions()).catch((err) => {
    browserPromise = null;
    const hint = resolveChromePath()
      ? ''
      : ' Install Chromium in Docker (docker compose up --build) or run the API locally with npm run dev.';
    throw new AppError(`PDF engine failed to start: ${err.message}.${hint}`, 500);
  });

  return browserPromise;
}

async function closeBrowser() {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    // ignore shutdown errors
  } finally {
    browserPromise = null;
  }
}

async function resolveReportId(reportIdOrUuid) {
  return resolveId('report_master', reportIdOrUuid);
}

async function assertReportAccess(reportId, userId) {
  const ownerId = await reportRepository.getOwnerId(reportId);
  if (ownerId == null) throw new AppError('Report not found', 404);
  if (String(ownerId) !== String(userId)) {
    throw new AppError('You do not have permission to access this report', 403);
  }
}

async function countPdfPages(pdfBuffer) {
  const matches = pdfBuffer.toString('binary').match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 1;
}

async function generatePdfBuffer(html) {
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      }
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return pdfBuffer;
  } catch (err) {
    if (!(err instanceof AppError)) {
      await closeBrowser();
      throw new AppError(`PDF generation failed: ${err.message}`, 500);
    }
    throw err;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

function ensurePdfDir() {
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }
}

const reportPdfService = {
  async generate(reportIdOrUuid, userId) {
    if (!fs.existsSync(REPORT_ROOT)) {
      throw new AppError('Report templates are missing on the server. Rebuild or redeploy the API.', 500);
    }

    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId);

    const report = await reportRepository.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);

    const eventId = Number(report.eventId);
    const packageId = report.package?.id ? Number(report.package.id) : null;

    const menuItems = await reportPdfRepository.getMenuForReport(
      eventId,
      packageId,
      report.includeMenuInTemplate
    );

    const brideGroomImages = await eventRepository.getBrideGroomImages(eventId);
    let html;
    let folder;
    try {
      ({ html, folder } = renderReportHtml(report, menuItems, brideGroomImages, BASE_URL));
    } catch (err) {
      throw new AppError(err.message, 500);
    }

    ensurePdfDir();
    const storedName = `report-${reportId}-${randomUUID()}.pdf`;
    const filePath = path.join(PDF_DIR, storedName);

    let pdfBuffer;
    try {
      pdfBuffer = await generatePdfBuffer(html);
    } catch (err) {
      logger.error('PDF generation failed', { reportId, template: folder, error: err.message });
      throw err instanceof AppError ? err : new AppError(`PDF generation failed: ${err.message}`, 500);
    }

    fs.writeFileSync(filePath, pdfBuffer);

    const pageCount = await countPdfPages(pdfBuffer);
    const pdfUrl = `${BASE_URL}/uploads/reports/${storedName}`;

    let record;
    try {
      record = await reportPdfRepository.create({
        reportId,
        pdfUrl,
        storedName,
        fileSizeBytes: pdfBuffer.length,
        pageCount,
        templateSlug: report.template?.slug || folder,
        generatedBy: userId,
      });
    } catch (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        throw new AppError('Database schema is out of date. Run: npm run db:migrate', 500);
      }
      throw err;
    }

    await activityRepository.log({
      eventId,
      userId,
      action: 'report_pdf_generated',
      description: 'Premium report PDF generated',
      metadata: { reportId, pdfId: record.id, pageCount },
    });

    logger.info('Report PDF generated', { reportId, pdfUrl, pageCount, template: folder });

    return {
      pdfUrl,
      pdfId: record.id,
      pageCount,
      fileSizeBytes: pdfBuffer.length,
      templateSlug: record.templateSlug,
      generatedAt: record.createdAt,
    };
  },

  async download(reportIdOrUuid, userId) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId);

    const pdf = await reportPdfRepository.findActiveByReportId(reportId);
    if (!pdf) throw new AppError('PDF not found. Generate the PDF first.', 404);

    const filePath = path.join(PDF_DIR, pdf.storedName);
    if (!fs.existsSync(filePath)) {
      throw new AppError('PDF file missing on server', 404);
    }

    return {
      filePath,
      fileName: `menu-report-${reportId}.pdf`,
      pdfUrl: pdf.pdfUrl,
      pdf,
    };
  },

  async delete(reportIdOrUuid, userId) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId);

    const pdf = await reportPdfRepository.findActiveByReportId(reportId);
    if (!pdf) throw new AppError('PDF not found', 404);

    const filePath = path.join(PDF_DIR, pdf.storedName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await reportPdfRepository.softDelete(pdf.id);

    await activityRepository.log({
      eventId: null,
      userId,
      action: 'report_pdf_deleted',
      description: 'Report PDF deleted',
      metadata: { reportId, pdfId: pdf.id },
    });

    return { reportId: String(reportId), deleted: true };
  },

  async getPdfInfo(reportIdOrUuid, userId) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId);

    const pdf = await reportPdfRepository.findActiveByReportId(reportId);
    if (!pdf) return null;
    return pdf;
  },
};

module.exports = reportPdfService;
