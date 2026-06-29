const menuRepository = require('../repositories/menu.repository');
const eventRepository = require('../repositories/event.repository');
const { resolveId, resolveIds } = require('../helpers/idResolver');
const { sendExport } = require('../helpers/exportImport');
const AppError = require('../utils/AppError');

const CATEGORY_EXPORT_COLUMNS = [
  { label: 'ID', key: 'id' },
  { label: 'UUID', key: 'uuid' },
  { label: 'Name', key: 'name' },
  { label: 'Description', key: 'description' },
  { label: 'Sort Order', key: 'sort_order' },
  { label: 'Item Count', key: 'item_count' },
];

const ITEM_EXPORT_COLUMNS = [
  { label: 'ID', key: 'id' },
  { label: 'UUID', key: 'uuid' },
  { label: 'Name', key: 'name' },
  { label: 'Category', key: 'category_name' },
  { label: 'Price', key: 'price' },
  { label: 'Veg', accessor: (r) => (r.is_veg ? 'yes' : 'no') },
  { label: 'Active', accessor: (r) => (r.is_active ? 'yes' : 'no') },
];

const formatCategory = (row) => ({
  id: String(row.id),
  uuid: row.uuid,
  name: row.name,
  description: row.description,
  sortOrder: row.sort_order,
  itemCount: row.item_count,
});

const formatItem = (row) => ({
  id: String(row.id),
  uuid: row.uuid,
  name: row.name,
  category: row.category_name,
  categoryId: row.category_id,
  price: String(row.price),
  isVeg: Boolean(row.is_veg),
  imageUrl: row.image_url,
  isBestSeller: Boolean(row.is_best_seller),
  isActive: Boolean(row.is_active),
  description: row.description,
});

const menuService = {
  listCategories: (q) => menuRepository.findCategories(q),

  async getCategory(idOrUuid) {
    const id = await resolveId('menu_categories', idOrUuid);
    const row = await menuRepository.findCategoryById(id);
    if (!row) throw new AppError('Category not found', 404);
    return formatCategory({ ...row, item_count: 0 });
  },

  async createCategory(data) {
    const id = await menuRepository.createCategory(data);
    return this.getCategory(id);
  },

  async updateCategory(idOrUuid, data) {
    const id = await resolveId('menu_categories', idOrUuid);
    const row = await menuRepository.findCategoryById(id);
    if (!row) throw new AppError('Category not found', 404);
    await menuRepository.updateCategory(id, data);
    return this.getCategory(id);
  },

  async deleteCategory(idOrUuid) {
    const id = await resolveId('menu_categories', idOrUuid);
    await menuRepository.deleteCategory(id);
    return { deleted: true };
  },

  async bulkDeleteCategories(idsOrUuids) {
    const ids = await resolveIds('menu_categories', idsOrUuids);
    return { affected: await menuRepository.bulkDeleteCategories(ids) };
  },

  async bulkUpdateCategories(idsOrUuids, data) {
    const ids = await resolveIds('menu_categories', idsOrUuids);
    return { affected: await menuRepository.bulkUpdateCategories(ids, data) };
  },

  exportCategories(res, query) {
    return menuRepository.findCategoriesForExport(query).then((rows) =>
      sendExport(res, {
        format: query.format,
        filename: 'menu-categories',
        rows,
        columns: CATEGORY_EXPORT_COLUMNS,
        jsonData: { items: rows.map(formatCategory) },
      })
    );
  },

  async importCategories(records) {
    const created = [];
    for (const record of records) {
      const id = await menuRepository.createCategory({
        name: record.name,
        description: record.description,
        sort_order: record.sortOrder || record.sort_order || 0,
      });
      created.push(id);
    }
    return { imported: created.length, ids: created };
  },

  listItems: (q) => menuRepository.findItems(q),

  async getItem(idOrUuid) {
    const id = await resolveId('menu_items', idOrUuid);
    const row = await menuRepository.findItemById(id);
    if (!row) throw new AppError('Menu item not found', 404);
    return formatItem(row);
  },

  async createItem(data) {
    const id = await menuRepository.createItem(data);
    return this.getItem(id);
  },

  async updateItem(idOrUuid, data) {
    const id = await resolveId('menu_items', idOrUuid);
    const row = await menuRepository.findItemById(id);
    if (!row) throw new AppError('Menu item not found', 404);
    await menuRepository.updateItem(id, data);
    return this.getItem(id);
  },

  async deleteItem(idOrUuid) {
    const id = await resolveId('menu_items', idOrUuid);
    await menuRepository.deleteItem(id);
    return { deleted: true };
  },

  async bulkDeleteItems(idsOrUuids) {
    const ids = await resolveIds('menu_items', idsOrUuids);
    return { affected: await menuRepository.bulkDeleteItems(ids) };
  },

  async bulkUpdateItems(idsOrUuids, data) {
    const ids = await resolveIds('menu_items', idsOrUuids);
    return {
      affected: await menuRepository.bulkUpdateItems(ids, {
        is_active: data.isActive,
        category_id: data.categoryId,
      }),
    };
  },

  exportItems(res, query) {
    return menuRepository.findItemsForExport(query).then((rows) =>
      sendExport(res, {
        format: query.format,
        filename: 'menu-items',
        rows,
        columns: ITEM_EXPORT_COLUMNS,
        jsonData: { items: rows.map(formatItem) },
      })
    );
  },

  async importItems(records) {
    const created = [];
    for (const record of records) {
      const id = await menuRepository.createItem({
        category_id: record.categoryId || record.category_id,
        name: record.name,
        description: record.description,
        price: record.price,
        is_veg: record.isVeg ?? record.is_veg ?? true,
        image_url: record.imageUrl || record.image_url,
        is_best_seller: record.isBestSeller ?? record.is_best_seller ?? false,
        is_active: record.isActive ?? record.is_active ?? true,
      });
      created.push(id);
    }
    return { imported: created.length, ids: created };
  },

  listPackages: () => menuRepository.findPackages(),
  listCourses: () => menuRepository.findCourses(),

  async getPlanning(eventIdOrUuid, category) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    return menuRepository.getPlanningItems(eventId, category);
  },

  async updatePlanning(eventIdOrUuid, menuItemIds) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    const resolvedIds = await resolveIds('menu_items', menuItemIds);
    await eventRepository.setMenuSelections(eventId, resolvedIds);
    return eventRepository.getMenuSelections(eventId);
  },
};

module.exports = menuService;
