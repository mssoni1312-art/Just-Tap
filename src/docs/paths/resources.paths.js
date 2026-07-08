const {
  op, jsonBody, idParam, paginationParams, exportParams, importBody, bulkIdsBody,
} = require('../helpers');

const inquiriesPaths = {
  '/inquiries/stats': {
    get: op('get', ['Inquiries'], 'Inquiry statistics', { operationId: 'inquiriesStats' }),
  },
  '/inquiries/export': {
    get: op('get', ['Inquiries'], 'Export inquiries', {
      operationId: 'inquiriesExport',
      parameters: exportParams(),
    }),
  },
  '/inquiries/import': {
    post: op('post', ['Inquiries'], 'Import inquiries from CSV or JSON', {
      operationId: 'inquiriesImport',
      requestBody: importBody(),
      successDescription: 'Inquiries imported',
    }),
  },
  '/inquiries': {
    get: op('get', ['Inquiries'], 'List inquiries', {
      operationId: 'inquiriesList',
      parameters: paginationParams([
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'converted'] } },
        { name: 'source', in: 'query', schema: { type: 'string', enum: ['admin', 'client'] } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
      ]),
      responseSchema: 'PaginatedList',
    }),
    post: op('post', ['Inquiries'], 'Create inquiry', {
      operationId: 'inquiriesCreate',
      requestBody: jsonBody('CreateInquiryRequest'),
      successDescription: 'Inquiry created',
    }),
  },
  '/inquiries/bulk-delete': {
    post: op('post', ['Inquiries'], 'Bulk delete inquiries', {
      operationId: 'inquiriesBulkDelete',
      requestBody: bulkIdsBody(),
    }),
  },
  '/inquiries/bulk-update': {
    patch: op('patch', ['Inquiries'], 'Bulk update inquiry status', {
      operationId: 'inquiriesBulkUpdate',
      requestBody: jsonBody('BulkUpdateInquiriesRequest', true, { ids: [1], status: 'converted' }),
    }),
  },
  '/inquiries/{id}': {
    get: op('get', ['Inquiries'], 'Get inquiry by ID', {
      operationId: 'inquiriesGetById',
      parameters: [idParam()],
      responseSchema: 'Inquiry',
    }),
    patch: op('patch', ['Inquiries'], 'Update inquiry', {
      operationId: 'inquiriesUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateInquiryRequest'),
    }),
    delete: op('delete', ['Inquiries'], 'Delete inquiry', {
      operationId: 'inquiriesDelete',
      parameters: [idParam()],
    }),
  },
  '/inquiries/{id}/convert': {
    post: op('post', ['Inquiries'], 'Convert inquiry to event', {
      operationId: 'inquiriesConvert',
      parameters: [idParam()],
      successDescription: 'Inquiry converted to event',
    }),
  },
};

const menuPaths = {
  '/menu/categories': {
    get: op('get', ['Menu', 'Menu Planning'], 'List menu categories (dropdown)', {
      operationId: 'menuCategoriesList',
      description: 'Returns paginated categories for the **Menu Item Category** dropdown on the Add Item screen.',
      parameters: paginationParams(),
      responseSchema: 'PaginatedMenuCategoryList',
    }),
    post: op('post', ['Menu', 'Menu Planning'], 'Add menu category', {
      operationId: 'menuCategoriesCreate',
      description: 'Creates a category from the **Menu Item Category** bottom sheet (name, slogan, photo).',
      requestBody: jsonBody('CreateMenuCategoryRequest'),
      responseSchema: 'MenuCategory',
      created: true,
      successDescription: 'Category created',
    }),
  },
  '/menu/categories/export': {
    get: op('get', ['Menu'], 'Export categories', {
      operationId: 'menuCategoriesExport',
      parameters: exportParams(),
    }),
  },
  '/menu/categories/import': {
    post: op('post', ['Menu'], 'Import categories', {
      operationId: 'menuCategoriesImport',
      requestBody: importBody(),
    }),
  },
  '/menu/categories/bulk-delete': {
    post: op('post', ['Menu'], 'Bulk delete categories', {
      operationId: 'menuCategoriesBulkDelete',
      requestBody: bulkIdsBody(),
    }),
  },
  '/menu/categories/bulk-update': {
    patch: op('patch', ['Menu'], 'Bulk update categories', {
      operationId: 'menuCategoriesBulkUpdate',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/BulkIdsRequest' },
                { type: 'object', required: ['sort_order'], properties: { sort_order: { type: 'integer', minimum: 0 } } },
              ],
            },
          },
        },
      },
    }),
  },
  '/menu/categories/{id}': {
    get: op('get', ['Menu'], 'Get category by ID', {
      operationId: 'menuCategoriesGetById',
      parameters: [idParam()],
      responseSchema: 'MenuCategory',
    }),
    patch: op('patch', ['Menu'], 'Update category', {
      operationId: 'menuCategoriesUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateMenuCategoryRequest'),
    }),
    delete: op('delete', ['Menu'], 'Delete category', {
      operationId: 'menuCategoriesDelete',
      parameters: [idParam()],
    }),
  },
  '/menu/subcategories': {
    get: op('get', ['Menu', 'Menu Planning'], 'List menu subcategories (dropdown)', {
      operationId: 'menuSubCategoriesList',
      description: 'Returns subcategories for the **Menu Item Sub Category** dropdown. Filter by `categoryId` when a category is selected.',
      parameters: [
        ...paginationParams(),
        {
          name: 'categoryId',
          in: 'query',
          description: 'Filter subcategories by parent category (numeric ID or UUID)',
          schema: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }] },
          example: 1,
        },
      ],
      responseSchema: 'PaginatedMenuSubCategoryList',
    }),
    post: op('post', ['Menu', 'Menu Planning'], 'Add menu subcategory', {
      operationId: 'menuSubCategoriesCreate',
      description: 'Creates a subcategory from the **Menu Sub Item Category** bottom sheet.',
      requestBody: jsonBody('CreateMenuSubCategoryRequest'),
      responseSchema: 'MenuSubCategory',
      created: true,
      successDescription: 'Subcategory created',
    }),
  },
  '/menu/subcategories/{id}': {
    get: op('get', ['Menu'], 'Get subcategory by ID', {
      operationId: 'menuSubCategoriesGetById',
      parameters: [idParam()],
      responseSchema: 'MenuSubCategory',
    }),
    patch: op('patch', ['Menu'], 'Update subcategory', {
      operationId: 'menuSubCategoriesUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateMenuSubCategoryRequest'),
    }),
    delete: op('delete', ['Menu'], 'Delete subcategory', {
      operationId: 'menuSubCategoriesDelete',
      parameters: [idParam()],
    }),
  },
  '/menu/items': {
    get: op('get', ['Menu', 'Menu Planning'], 'List menu items', {
      operationId: 'menuItemsList',
      description: 'List menu items. Supports `categoryId` and `subcategoryId` filters.',
      parameters: [
        ...paginationParams(),
        { name: 'categoryId', in: 'query', schema: { type: 'integer' }, description: 'Filter by category' },
        { name: 'subcategoryId', in: 'query', schema: { type: 'integer' }, description: 'Filter by subcategory' },
      ],
      responseSchema: 'PaginatedMenuItemList',
    }),
    post: op('post', ['Menu', 'Menu Planning'], 'Add menu item', {
      operationId: 'menuItemsCreate',
      description: 'Creates a menu item from the **Add new item** screen. Upload photo first via `POST /uploads/images`.',
      requestBody: jsonBody('CreateMenuItemRequest'),
      responseSchema: 'MenuItem',
      created: true,
      successDescription: 'Item created',
    }),
  },
  '/menu/items/export': {
    get: op('get', ['Menu'], 'Export menu items', {
      operationId: 'menuItemsExport',
      parameters: exportParams(),
    }),
  },
  '/menu/items/import': {
    post: op('post', ['Menu'], 'Import menu items', {
      operationId: 'menuItemsImport',
      requestBody: importBody(),
    }),
  },
  '/menu/items/bulk-delete': {
    post: op('post', ['Menu'], 'Bulk delete menu items', {
      operationId: 'menuItemsBulkDelete',
      requestBody: bulkIdsBody(),
    }),
  },
  '/menu/items/bulk-update': {
    patch: op('patch', ['Menu'], 'Bulk update menu items', {
      operationId: 'menuItemsBulkUpdate',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/BulkIdsRequest' },
                {
                  type: 'object',
                  properties: {
                    isActive: { type: 'boolean' },
                    categoryId: { type: 'integer' },
                  },
                },
              ],
            },
          },
        },
      },
    }),
  },
  '/menu/items/{id}': {
    get: op('get', ['Menu'], 'Get menu item by ID', {
      operationId: 'menuItemsGetById',
      parameters: [idParam()],
      responseSchema: 'MenuItem',
    }),
    patch: op('patch', ['Menu'], 'Update menu item', {
      operationId: 'menuItemsUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateMenuItemRequest'),
    }),
    delete: op('delete', ['Menu'], 'Delete menu item', {
      operationId: 'menuItemsDelete',
      parameters: [idParam()],
    }),
  },
  '/menu/packages': {
    get: op('get', ['Menu'], 'List menu packages', { operationId: 'menuPackagesList' }),
    post: op('post', ['Menu'], 'Create package tier', {
      operationId: 'menuPackagesCreate',
      requestBody: jsonBody('CreateManagePackageRequest'),
      successDescription: 'Package created',
    }),
  },
  '/menu/packages/{id}': {
    get: op('get', ['Menu'], 'Get package tier by ID', {
      operationId: 'menuPackagesGetById',
      parameters: [idParam()],
      responseSchema: 'ManagePackageTier',
    }),
    patch: op('patch', ['Menu'], 'Update package tier', {
      operationId: 'menuPackagesUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateManagePackageRequest'),
    }),
    delete: op('delete', ['Menu'], 'Delete package tier', {
      operationId: 'menuPackagesDelete',
      parameters: [idParam()],
    }),
  },
  '/menu/package-features': {
    get: op('get', ['Menu'], 'Manage Packages dashboard data', {
      operationId: 'menuPackageFeaturesList',
      description: 'Returns global features and package tiers with included feature IDs for the Manage Packages screen.',
      responseSchema: 'ManagePackagesResponse',
    }),
    post: op('post', ['Menu'], 'Create global package feature', {
      operationId: 'menuPackageFeaturesCreate',
      requestBody: jsonBody('CreatePackageFeatureRequest'),
      successDescription: 'Feature created',
    }),
  },
  '/menu/package-features/{id}': {
    patch: op('patch', ['Menu'], 'Update global package feature', {
      operationId: 'menuPackageFeaturesUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreatePackageFeatureRequest'),
    }),
    delete: op('delete', ['Menu'], 'Delete global package feature', {
      operationId: 'menuPackageFeaturesDelete',
      parameters: [idParam()],
    }),
  },
  '/menu/package-settings': {
    patch: op('patch', ['Menu'], 'Save Manage Packages system changes', {
      operationId: 'menuPackageSettingsSave',
      description: 'Bulk update feature toggles and package tiers (Save System Changes button).',
      requestBody: jsonBody('SavePackageSettingsRequest'),
      responseSchema: 'ManagePackagesResponse',
    }),
  },
  '/menu/courses': {
    get: op('get', ['Menu'], 'List menu courses', { operationId: 'menuCoursesList' }),
  },
};

module.exports = { inquiriesPaths, menuPaths };
