const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const REPORT_ROOT = path.join(process.cwd(), 'report');
const TEMPLATE_CACHE = new Map();
const PARTIAL_CACHE = new Map();

const CATEGORY_TO_FOLDER = {
  luxury: 'premium',
  classic: 'classic',
  minimal: 'minimal',
  custom: 'modern',
};

const SLUG_TO_FOLDER = {
  'royal-noir': 'premium',
  'modern-gold': 'modern',
  'classic-gold': 'classic',
  'heritage-classic': 'classic',
  'elegant-white': 'minimal',
};

const FONT_PAIRINGS = {
  playfair_inter: {
    heading: "'Playfair Display', Georgia, 'Times New Roman', serif",
    body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    script: "'Great Vibes', 'Brush Script MT', cursive",
    googleFonts:
      'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@300;400;500&family=Playfair+Display:wght@400;500&display=swap',
  },
  space_grotesk_mono: {
    heading: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif",
    body: "'IBM Plex Mono', 'Courier New', monospace",
    script: "'Great Vibes', cursive",
    googleFonts:
      'https://fonts.googleapis.com/css2?family=Great+Vibes&family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;600;700&display=swap',
  },
  fraunces_inter: {
    heading: "'Fraunces', Georgia, 'Times New Roman', serif",
    body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    script: "'Great Vibes', cursive",
    googleFonts:
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Great+Vibes&family=Inter:wght@400;500;600&display=swap',
  },
};

const PHOTO_FILTER_CSS = {
  none: 'none',
  vintage_gold: 'sepia(0.35) saturate(1.25) brightness(1.05) contrast(1.05)',
  high_contrast: 'contrast(1.35) saturate(1.15) brightness(0.95)',
  warm: 'sepia(0.2) saturate(1.3) hue-rotate(-10deg)',
  cool: 'saturate(0.9) hue-rotate(15deg) brightness(1.05)',
  sepia: 'sepia(0.65) contrast(1.05)',
};

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('gt', (a, b) => a > b);
Handlebars.registerHelper('mod', (a, b) => a % b);
Handlebars.registerHelper('or', (...args) => {
  args.pop();
  return args.some(Boolean);
});

function resolveTemplateFolder(template) {
  if (!template) return 'premium';
  return SLUG_TO_FOLDER[template.slug] || CATEGORY_TO_FOLDER[template.category] || 'premium';
}

function readFileSafe(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function loadPartial(folder, name) {
  const partialKey = `${folder}-${name}`;
  const cacheKey = partialKey;

  if (PARTIAL_CACHE.has(cacheKey)) return partialKey;

  let partialPath = path.join(REPORT_ROOT, 'templates', folder, `${name}.hbs`);
  if (!fs.existsSync(partialPath) && name === 'body') {
    partialPath = path.join(REPORT_ROOT, 'templates', '_shared', `${name}.hbs`);
  }
  const source = readFileSafe(partialPath);
  if (!source) {
    throw new Error(`Template partial not found: report/templates/${folder}/${name}.hbs`);
  }

  Handlebars.registerPartial(partialKey, source);
  PARTIAL_CACHE.set(cacheKey, source);
  return partialKey;
}

function loadStyles(folder) {
  const templateCss = readFileSafe(path.join(REPORT_ROOT, 'templates', folder, 'styles.css'));
  const baseCss = readFileSafe(path.join(REPORT_ROOT, 'css', 'base.css'));
  return `${baseCss}\n${templateCss}`;
}

function buildDynamicCss(report) {
  const { theme, typography, grid, photoFilter } = report;
  const fonts = FONT_PAIRINGS[typography?.fontPairing] || FONT_PAIRINGS.playfair_inter;
  const scale = (typography?.sizeScaling || 100) / 100;
  const intensity = photoFilter?.intensity ?? 80;
  const filterPreset = photoFilter?.preset || 'none';
  const filterValue = PHOTO_FILTER_CSS[filterPreset] || 'none';

  const gridGap = {
    compact: 8,
    default: 16,
    spacious: 24,
  }[grid?.preset] || 16;

  const customIntensity = grid?.customIntensity ?? 70;
  const gapPx = Math.round(gridGap + ((customIntensity - 50) / 50) * 8);

  const color = (key, fallback) => {
    const c = theme?.[key];
    if (!c?.hex) return fallback;
    const opacity = (c.opacity ?? 100) / 100;
    const hex = c.hex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return `
    :root {
      --color-primary: ${color('primary', '#A9A9A9')};
      --color-secondary: ${color('secondary', '#D4AF37')};
      --color-accent: ${color('accent', '#FFFFFF')};
      --color-background: ${color('background', '#1A1A1A')};
      --font-heading: ${fonts.heading};
      --font-body: ${fonts.body};
      --font-script: ${fonts.script || "'Great Vibes', cursive"};
      --font-scale: ${scale};
      --grid-gap: ${gapPx}px;
      --photo-filter: ${filterValue};
      --photo-filter-intensity: ${intensity / 100};
    }
  `;
}

function formatEventDate(dateStr, { uppercase = false } = {}) {
  if (!dateStr) return '';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return String(dateStr);
  const formatted = parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return uppercase ? formatted.toUpperCase() : formatted;
}

function groupMenuSections(items) {
  const map = new Map();
  for (const item of items) {
    const category = item.category || 'Menu';
    if (!map.has(category)) map.set(category, []);
    map.get(category).push({
      name: item.name,
      description: item.description || item.slogan || '',
      isVeg: Boolean(item.is_veg),
      imageUrl: item.image_url || null,
    });
  }
  return Array.from(map.entries()).map(([title, menuItems]) => ({ title, items: menuItems }));
}

function resolveAssetUrl(url, baseUrl) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('file://')) return url;
  if (url.startsWith('/uploads/')) {
    const localPath = path.join(process.cwd(), url);
    if (fs.existsSync(localPath)) {
      return `file://${localPath.replace(/\\/g, '/')}`;
    }
    const host = baseUrl || 'http://127.0.0.1:3000';
    return `${host}${url}`;
  }
  return url;
}

function resolveCardBackground(report, eventImages, gallery, baseUrl) {
  // 1. Admin explicitly selected bride/groom photo on the report
  if (report.brideGroomPhotoUrl) {
    return resolveAssetUrl(report.brideGroomPhotoUrl, baseUrl);
  }
  // 2. Event bride/groom images (default from admin on event)
  if (eventImages[0]) return eventImages[0];
  // 3. Report gallery uploads
  if (gallery[0]) return gallery[0];
  // 4. Template preview only as last resort
  if (report.template?.previewUrl) {
    return resolveAssetUrl(report.template.previewUrl, baseUrl);
  }
  return null;
}

function buildViewModel(report, menuItems, brideGroomImages, baseUrl) {
  const photos = report.photos || [];
  const gallery = photos.map((p) => resolveAssetUrl(p.imageUrl, baseUrl)).filter(Boolean);
  const eventImages = (brideGroomImages || []).map((u) => resolveAssetUrl(u, baseUrl)).filter(Boolean);

  const cardBackground = resolveCardBackground(report, eventImages, gallery, baseUrl);
  const brideImage = resolveAssetUrl(
    report.brideGroomPhotoUrl || eventImages[0] || gallery[0] || null,
    baseUrl
  );
  const groomImage = resolveAssetUrl(eventImages[1] || gallery[1] || null, baseUrl);
  const heroImage = cardBackground || brideImage || gallery[0] || null;
  const coverImage = heroImage;
  const backgroundImage = resolveAssetUrl(report.template?.previewUrl, baseUrl);
  const logo = resolveAssetUrl(report.clientLogoUrl || report.package?.logoUrl, baseUrl);

  const coupleName = [report.brideName, report.groomName].filter(Boolean).join(' & ')
    || report.clientName
    || 'Our Special Day';

  return {
    report,
    coupleName,
    brideName: report.brideName || '',
    groomName: report.groomName || '',
    clientName: report.clientName,
    eventDate: formatEventDate(report.eventStartDate),
    eventDateUpper: formatEventDate(report.eventStartDate, { uppercase: true }),
    venueName: report.venueName,
    cityName: report.cityName,
    packageName: report.package?.name || '',
    templateName: report.template?.name || 'Premium',
    includeMenu: report.includeMenuInTemplate,
    layoutPosition: report.layoutPosition || 'top',
    menuSections: groupMenuSections(menuItems),
    images: {
      heroImage,
      gallery,
      logo,
      coverImage,
      backgroundImage,
      cardBackground,
      brideImage,
      groomImage,
    },
    hasGallery: gallery.length > 0,
    hasMenu: menuItems.length > 0,
    typography: report.typography,
    grid: report.grid,
    theme: report.theme,
    photoFilter: report.photoFilter,
  };
}

function compileTemplate(folder) {
  const cacheKey = `main:${folder}`;
  if (TEMPLATE_CACHE.has(cacheKey)) return TEMPLATE_CACHE.get(cacheKey);

  loadPartial(folder, 'header');
  const bodyPartial = loadPartial(folder, 'body');
  loadPartial(folder, 'footer');

  const layoutSource = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{{coupleName}} — Menu Report</title>
      {{#if googleFontsUrl}}<link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="{{googleFontsUrl}}" rel="stylesheet" />{{/if}}
      <style>{{{styles}}}</style>
    </head>
    <body class="report-body layout-{{layoutPosition}}">
      {{> ${bodyPartial}}}
    </body>
    </html>
  `;

  const compiled = Handlebars.compile(layoutSource);
  TEMPLATE_CACHE.set(cacheKey, compiled);
  return compiled;
}

function renderReportHtml(report, menuItems, brideGroomImages, baseUrl) {
  const folder = resolveTemplateFolder(report.template);
  const viewModel = buildViewModel(report, menuItems, brideGroomImages, baseUrl);
  const fonts = FONT_PAIRINGS[report.typography?.fontPairing] || FONT_PAIRINGS.playfair_inter;

  try {
    const html = compileTemplate(folder)({
      ...viewModel,
      headerPartial: `${folder}-header`,
      footerPartial: `${folder}-footer`,
      googleFontsUrl: fonts.googleFonts,
      styles: `${loadStyles(folder)}\n${buildDynamicCss(report)}`,
    });

    return { html, folder, viewModel };
  } catch (err) {
    const message = err.message?.includes('Template partial not found')
      ? `${err.message}. Ensure the report/ folder is deployed (Docker: rebuild with docker compose up --build).`
      : `Failed to render report template: ${err.message}`;
    throw new Error(message);
  }
}

module.exports = {
  renderReportHtml,
  resolveTemplateFolder,
  REPORT_ROOT,
};
