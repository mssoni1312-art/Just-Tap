const allTaskRepository = require('../../repositories/allTask.repository');
const eventRepository = require('../../repositories/event.repository');
const billingRepository = require('../../repositories/billing.repository');
const { uploadService } = require('../profile.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');
const AppError = require('../../utils/AppError');

const formatTime12h = (timeValue) => {
  if (!timeValue) return null;
  const str = String(timeValue);
  const parts = str.includes('T') ? str.split('T')[1].split(':') : str.split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);
  if (Number.isNaN(hours)) return null;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

const calcProgress = (achieved, target) => {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((achieved / target) * 100));
};

const formatCurrencyTarget = (amount) => {
  if (amount == null) return null;
  const value = Number(amount);
  if (Number.isNaN(value)) return null;
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `₹ ${k}k` : `₹ ${k.toFixed(1)}k`;
  }
  return `₹ ${value}`;
};

const buildTargets = async (eventRow) => {
  const billing = await billingRepository.findByEventId(eventRow.id);
  const billingTarget = billing?.estimate?.grandTotal ?? eventRow.final_rate ?? 50000;

  return {
    reportingTime: null,
    gainFollowers: eventRow.no_of_followers ?? 50,
    testimonialReels: eventRow.no_of_testimonial_reels ?? 5,
    videography: eventRow.no_of_food_reels ?? 10,
    photography: 100,
    billing: Number(billingTarget) || 50000,
  };
};

const buildTaskModules = (targets, progress, reportingTimeRaw) => {
  const reportingTime = formatTime12h(reportingTimeRaw);

  return [
    {
      key: 'reporting_on_ground_time',
      title: 'Reporting On-Ground Time',
      description: 'Clock-in required upon arrival at the venue gate.',
      type: 'time',
      reportingTime,
      actualArrivalTime: progress?.actualArrivalTime
        ? formatTime12h(progress.actualArrivalTime)
        : null,
    },
    {
      key: 'gain_followers',
      title: 'Gain Followers',
      description: 'Organic audience engagement during the keynote.',
      type: 'count_progress',
      target: targets.gainFollowers,
      achievedCount: progress?.followersAchievedCount ?? 0,
      progressPercentage: calcProgress(
        progress?.followersAchievedCount ?? 0,
        targets.gainFollowers
      ),
    },
    {
      key: 'testimonial_reels',
      title: 'Testimonial Reels',
      description: 'Capture short feedback clips from delegates.',
      type: 'count_progress',
      target: targets.testimonialReels,
      achievedCount: progress?.testimonialReelsAchievedCount ?? 0,
      progressPercentage: calcProgress(
        progress?.testimonialReelsAchievedCount ?? 0,
        targets.testimonialReels
      ),
    },
    {
      key: 'videography',
      title: 'Videography',
      description: null,
      type: 'media_tracking',
      target: targets.videography,
      activeSessionRecordingStatus: progress?.activeSessionRecording ?? false,
      numberOfVideoShoots: progress?.numberOfVideoShoots ?? 0,
    },
    {
      key: 'photography',
      title: 'Photography',
      description: null,
      type: 'media_tracking',
      target: targets.photography,
      mainEventHighlightsStatus: progress?.mainEventHighlights ?? false,
      photosCaptured: progress?.photosCaptured ?? 0,
    },
    {
      key: 'billing_tracking',
      title: 'Billing Tracking',
      description: null,
      type: 'billing',
      target: targets.billing,
      targetLabel: formatCurrencyTarget(targets.billing),
      amountCollected: progress?.amountCollected ?? 0,
      progressPercentage: calcProgress(progress?.amountCollected ?? 0, targets.billing),
    },
    {
      key: 'attachments_documents',
      title: 'Attachments & Documents',
      description: 'Upload bills, receipts, or any other relevant event images.',
      type: 'attachments',
      acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxFileSizeMb: 20,
    },
  ];
};

const managerAllTaskService = {
  async getAllTasks(staffId, eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);

    const eventRow = await eventRepository.findById(eventId);
    if (!eventRow) throw new AppError('Event not found', 404);

    const [progress, reportingTimeRaw, attachments, targets] = await Promise.all([
      allTaskRepository.ensureProgress(eventId),
      allTaskRepository.getReportingTime(eventId),
      allTaskRepository.listAttachments(eventId),
      buildTargets(eventRow),
    ]);

    return {
      eventId: String(eventId),
      eventUuid: eventRow.uuid,
      status: progress.status,
      tasks: buildTaskModules(targets, progress, reportingTimeRaw),
      attachments,
      completedAt: progress.completedAt,
      abandonedAt: progress.abandonedAt,
      updatedAt: progress.updatedAt,
    };
  },

  async update(staffId, eventIdOrUuid, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);

    const progress = await allTaskRepository.findProgressByEventId(eventId);
    if (progress?.status === 'completed') {
      throw new AppError('Completed all-tasks workflow cannot be edited', 400);
    }
    if (progress?.status === 'abandoned') {
      throw new AppError('Abandoned all-tasks workflow cannot be edited', 400);
    }

    await allTaskRepository.updateProgress(eventId, data);
    return this.getAllTasks(staffId, eventId);
  },

  async complete(staffId, eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);

    const progress = await allTaskRepository.findProgressByEventId(eventId);
    if (progress?.status === 'abandoned') {
      throw new AppError('Abandoned all-tasks workflow cannot be completed', 400);
    }

    await allTaskRepository.setStatus(eventId, 'completed');
    return this.getAllTasks(staffId, eventId);
  },

  async abandon(staffId, eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);

    const progress = await allTaskRepository.findProgressByEventId(eventId);
    if (progress?.status === 'completed') {
      throw new AppError('Completed all-tasks workflow cannot be abandoned', 400);
    }

    await allTaskRepository.setStatus(eventId, 'abandoned');
    return this.getAllTasks(staffId, eventId);
  },

  async addAttachment(staffId, eventIdOrUuid, file, userId) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);

    const progress = await allTaskRepository.findProgressByEventId(eventId);
    if (progress?.status === 'completed' || progress?.status === 'abandoned') {
      throw new AppError('Cannot add attachments to a closed all-tasks workflow', 400);
    }

    const upload = await uploadService.saveUpload(
      userId,
      file,
      file.mimetype === 'application/pdf' ? 'document' : 'image'
    );

    const attachment = await allTaskRepository.addAttachment(eventId, {
      uploadId: upload.id,
      fileUrl: upload.url,
      originalName: upload.originalName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: userId,
    });

    return attachment;
  },

  async removeAttachment(staffId, eventIdOrUuid, attachmentIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);

    const attachmentId = await resolveId('event_all_task_attachments', attachmentIdOrUuid);
    const attachment = await allTaskRepository.findAttachmentById(attachmentId);
    if (!attachment || attachment.eventId !== eventId) {
      throw new AppError('Attachment not found', 404);
    }

    await allTaskRepository.softDeleteAttachment(attachmentId);
    return { deleted: true };
  },
};

module.exports = managerAllTaskService;
