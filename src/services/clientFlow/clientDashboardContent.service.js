const clientDashboardContentRepository = require('../../repositories/clientDashboardContent.repository');

const toPublicDiscoverExperience = (row) => ({
  id: row.id,
  uuid: row.uuid,
  videoUrl: row.videoUrl,
  description: row.description,
  sortOrder: row.sortOrder,
});

const toPublicTestimonial = (row) => ({
  id: row.id,
  uuid: row.uuid,
  rating: row.rating,
  name: row.name,
  description: row.description,
  videoUrl: row.videoUrl,
  sortOrder: row.sortOrder,
});

const clientFlowClientDashboardContentService = {
  async listDiscoverExperiences() {
    const items = await clientDashboardContentRepository.listByType('discover_experience');
    return items.map(toPublicDiscoverExperience);
  },

  async listTestimonials() {
    const items = await clientDashboardContentRepository.listByType('testimonial');
    return items.map(toPublicTestimonial);
  },

  async getDashboard() {
    const [discoverExperiences, testimonials] = await Promise.all([
      clientDashboardContentRepository.listByType('discover_experience'),
      clientDashboardContentRepository.listByType('testimonial'),
    ]);

    return {
      discoverExperiences: discoverExperiences.map(toPublicDiscoverExperience),
      testimonials: testimonials.map(toPublicTestimonial),
    };
  },
};

module.exports = clientFlowClientDashboardContentService;
