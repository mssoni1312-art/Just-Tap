const functionNameRepository = require('../repositories/functionName.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const functionNameService = {
  async list(query) {
    if (query.forSelect === 'true') {
      const items = await functionNameRepository.findAllForSelect(query);
      return { items };
    }
    return functionNameRepository.findAll(query);
  },

  async getById(idOrUuid) {
    const id = await resolveId('function_names', idOrUuid);
    const row = await functionNameRepository.findById(id);
    if (!row) throw new AppError('Function name not found', 404);
    return functionNameRepository.formatFunctionName(row);
  },

  async create(data) {
    const name = data.name?.trim();
    if (!name) throw new AppError('Name is required', 400);

    const existing = await functionNameRepository.findByName(name);
    if (existing) throw new AppError('Function name already exists', 409);

    const id = await functionNameRepository.create({
      name,
      sort_order: data.sortOrder ?? 0,
      is_active: data.isActive !== false,
    });
    return this.getById(id);
  },

  async update(idOrUuid, data) {
    const id = await resolveId('function_names', idOrUuid);

    if (data.name !== undefined) {
      const name = data.name?.trim();
      if (!name) throw new AppError('Name is required', 400);
      const existing = await functionNameRepository.findByName(name, id);
      if (existing) throw new AppError('Function name already exists', 409);
    }

    const updated = await functionNameRepository.update(id, {
      name: data.name?.trim(),
      sort_order: data.sortOrder,
      is_active: data.isActive,
    });
    if (!updated) throw new AppError('Function name not found', 404);
    return this.getById(id);
  },

  async remove(idOrUuid) {
    const id = await resolveId('function_names', idOrUuid);
    const deleted = await functionNameRepository.softDelete(id);
    if (!deleted) throw new AppError('Function name not found', 404);
    return { id };
  },
};

module.exports = functionNameService;
