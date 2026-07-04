const {
  op, jsonBody, idParam, paginationParams,
} = require('../helpers');

const reportPaths = {
  '/report/meta': {
    get: op('get', ['Report Builder'], 'Report builder metadata', {
      operationId: 'reportMeta',
      responseSchema: 'ReportMeta',
    }),
  },
  '/report/templates': {
    get: op('get', ['Report Builder'], 'List report templates', {
      operationId: 'reportTemplatesList',
      description: 'Fetch design templates from the database. Filter by category: all, luxury, minimal, classic, custom.',
      parameters: paginationParams([
        {
          name: 'category',
          in: 'query',
          schema: { type: 'string', enum: ['all', 'luxury', 'minimal', 'classic', 'custom'], default: 'all' },
        },
      ]),
      responseSchema: 'PaginatedList',
    }),
  },
  '/report/create': {
    post: op('post', ['Report Builder'], 'Create report', {
      operationId: 'reportCreate',
      description: 'Create a new menu report for an event. One report per event is allowed.',
      requestBody: jsonBody('CreateReportRequest'),
      created: true,
      responseSchema: 'ReportDetail',
    }),
  },
  '/report/upload-photo': {
    post: op('post', ['Report Builder'], 'Upload report photo', {
      operationId: 'reportUploadPhoto',
      description: 'Upload bride/groom or decorative photo. Stores URL via existing upload service (no Base64).',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file', 'reportId'],
              properties: {
                file: { type: 'string', format: 'binary' },
                reportId: { $ref: '#/components/schemas/IdParam' },
                sortOrder: { type: 'integer', minimum: 0, default: 0 },
                setAsBrideGroomPhoto: { type: 'boolean', default: false },
              },
            },
          },
        },
      },
      created: true,
      responseSchema: 'ReportPhotoUploadResponse',
    }),
  },
  '/report/template/select': {
    post: op('post', ['Report Builder'], 'Select template', {
      operationId: 'reportSelectTemplate',
      requestBody: jsonBody('SelectReportTemplateRequest'),
      responseSchema: 'ReportDetail',
    }),
  },
  '/report/theme': {
    patch: op('patch', ['Report Builder'], 'Update color theme', {
      operationId: 'reportUpdateTheme',
      requestBody: jsonBody('UpdateReportThemeRequest'),
      responseSchema: 'ReportDetail',
    }),
  },
  '/report/typography': {
    patch: op('patch', ['Report Builder'], 'Update typography', {
      operationId: 'reportUpdateTypography',
      requestBody: jsonBody('UpdateReportTypographyRequest'),
      responseSchema: 'ReportDetail',
    }),
  },
  '/report/grid': {
    patch: op('patch', ['Report Builder'], 'Update grid spacing', {
      operationId: 'reportUpdateGrid',
      requestBody: jsonBody('UpdateReportGridRequest'),
      responseSchema: 'ReportDetail',
    }),
  },
  '/report/photo-filter': {
    patch: op('patch', ['Report Builder'], 'Update photo filter', {
      operationId: 'reportUpdatePhotoFilter',
      requestBody: jsonBody('UpdateReportPhotoFilterRequest'),
      responseSchema: 'ReportDetail',
    }),
  },
  '/report/save-draft': {
    post: op('post', ['Report Builder'], 'Save draft', {
      operationId: 'reportSaveDraft',
      requestBody: jsonBody('SaveReportDraftRequest'),
      responseSchema: 'ReportDetail',
    }),
  },
  '/report/publish': {
    post: op('post', ['Report Builder'], 'Publish report', {
      operationId: 'reportPublish',
      requestBody: jsonBody('ReportIdRequest'),
      responseSchema: 'ReportDetail',
    }),
  },
  '/report/share': {
    post: op('post', ['Report Builder'], 'Share report with client', {
      operationId: 'reportShare',
      requestBody: jsonBody('ShareReportRequest'),
      responseSchema: 'ReportShareResponse',
    }),
  },
  '/report/generate-pdf': {
    post: op('post', ['Report Builder'], 'Generate premium PDF', {
      operationId: 'reportGeneratePdf',
      description: [
        'Generates a print-ready A4 PDF from the report using HTML + CSS + Puppeteer.',
        'Loads report data, images, theme, typography, grid, menu sections, and Handlebars template, then stores the PDF URL.',
      ].join(' '),
      requestBody: jsonBody('ReportIdRequest'),
      created: true,
      responseSchema: 'ReportPdfGenerateResponse',
    }),
  },
  '/report/pdf/{reportId}/download': {
    get: op('get', ['Report Builder'], 'Download report PDF', {
      operationId: 'reportDownloadPdf',
      description: 'Download the generated PDF file. Pass `urlOnly=true` to receive JSON with `pdfUrl` instead.',
      parameters: [
        idParam('reportId', 'Report ID (numeric or UUID)'),
        {
          name: 'urlOnly',
          in: 'query',
          schema: { type: 'boolean', default: false },
          description: 'Return JSON `{ pdfUrl }` instead of file download',
        },
      ],
      responseSchema: 'ReportPdfDownloadResponse',
      extraResponses: {
        200: {
          description: 'PDF file stream (when urlOnly is false)',
          content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
        },
      },
    }),
  },
  '/report/pdf/{reportId}': {
    delete: op('delete', ['Report Builder'], 'Delete report PDF', {
      operationId: 'reportDeletePdf',
      parameters: [idParam('reportId', 'Report ID (numeric or UUID)')],
      responseSchema: 'ReportPdfDeleteResponse',
    }),
  },
  '/report/{id}': {
    get: op('get', ['Report Builder'], 'Get report by ID', {
      operationId: 'reportGetById',
      parameters: [idParam('id', 'Report ID (numeric or UUID)')],
      responseSchema: 'ReportDetail',
    }),
  },
};

module.exports = reportPaths;
