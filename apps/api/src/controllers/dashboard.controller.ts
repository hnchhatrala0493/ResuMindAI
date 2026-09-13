import type { RequestHandler } from 'express';
import { ResumeModel } from '../models/resume.model.js';
import { ATSAnalysis } from '../models/ats-analysis.model.js';
import { JobDescriptionAnalysis } from '../models/job-description-analysis.model.js';
import { remaining } from '../services/ai-usage.service.js';
import { ResumeExport } from '../models/resume-export.model.js';
export const summary: RequestHandler = async (req, res) => {
  const filter = { userId: req.auth!.userId, deletedAt: null };
  const [
    totalResumes,
    recentResumes,
    recentAnalyses,
    average,
    latestJob,
    aiCreditsRemaining,
    totalDownloads,
  ] = await Promise.all([
    ResumeModel.countDocuments(filter),
    ResumeModel.find(filter)
      .select('title targetRole templateId completionPercentage status updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
    ATSAnalysis.find({ userId: req.auth!.userId })
      .select('resumeId overallScore createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    ATSAnalysis.aggregate([
      { $match: { userId: new (await import('mongoose')).Types.ObjectId(req.auth!.userId) } },
      { $group: { _id: null, value: { $avg: '$overallScore' } } },
    ]),
    JobDescriptionAnalysis.findOne({ userId: req.auth!.userId })
      .select('resumeId matchPercentage')
      .sort({ createdAt: -1 })
      .lean(),
    remaining(req.auth!.userId),
    ResumeExport.countDocuments({ userId: req.auth!.userId, status: 'ready' }),
  ]);
  res.json({
    success: true,
    data: {
      totalResumes,
      averageAtsScore: average[0] ? Math.round(average[0].value) : null,
      latestAtsScore: recentAnalyses[0]?.overallScore ?? null,
      latestJobMatchScore: latestJob?.matchPercentage ?? null,
      totalDownloads,
      aiCreditsRemaining,
      plan: 'Free',
      recentResumes,
      recentAnalyses,
      recommendedActions: totalResumes
        ? ['Continue improving your most recent resume']
        : ['Create your first resume'],
    },
  });
};
