const User = require('../models/userModel');
const Event = require('../models/eventModel');
const Enrollment = require('../models/enrollmentModel');
const { getDashboardMetrics } = require('../services/metricsService');
const { generateCsvReport, generatePdfReport } = require('../services/reportExportService');

exports.getDashboardStats = async (req, reply) => {
  try {
    const now = new Date();

    // 1. Total Members / Students (non-blocked)
    const totalStudents = await User.countDocuments({ 
      role: { $in: ['Student', 'Member', 'Committee'] },
      isBlocked: { $ne: true }
    });

    // 2. Events Stats (Upcoming vs Past)
    const upcomingEvents = await Event.countDocuments({ date: { $gt: now } });
    const pastEvents = await Event.countDocuments({ date: { $lte: now } });

    // 3. Attendance Rate
    const attendanceStats = await Enrollment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          attended: { $sum: { $cond: ["$attendanceStatus", 1, 0] } }
        }
      }
    ]);

    const attendancePercentage = attendanceStats.length > 0 && attendanceStats[0].total > 0
      ? Math.round((attendanceStats[0].attended / attendanceStats[0].total) * 100) 
      : 0;

    // 4. Monthly Participation Growth (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const growthData = await Enrollment.aggregate([
      {
        $match: {
          attendanceStatus: true,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          monthName: {
            $arrayElemAt: [
              ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
              "$_id.month"
            ]
          }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    const { metrics } = await getDashboardMetrics();

    return {
      stats: {
        totalStudents,
        totalUsers: metrics.totalUsers,
        totalEvents: upcomingEvents + pastEvents,
        activeEvents: metrics.activeEvents,
        upcomingEvents,
        pastEvents,
        attendancePercentage,
        totalAssessmentLevels: metrics.totalAssessmentLevels,
      },
      growthData
    };
  } catch (error) {
    req.log.error(error);
    reply.status(500).send({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

exports.getLeaderboard = async (req, reply) => {
  try {
    // Optimized pipeline using index-backed sub-lookups
    const leaderboard = await User.aggregate([
      { 
        $match: { 
          role: { $in: ['Student', 'Member', 'Committee'] },
          isBlocked: { $ne: true } 
        } 
      },
      {
        $lookup: {
          from: 'enrollments',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $or: [{ $eq: ['$enrolledBy', '$$userId'] }, { $in: ['$$userId', '$members'] }] },
                    { $eq: ['$attendanceStatus', true] }
                  ]
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: 'attendedEnrollments'
        }
      },
      {
        $lookup: {
          from: 'submissions',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$status', 'Accepted'] }
                  ]
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: 'acceptedSubmissions'
        }
      },
      {
        $addFields: {
          eventsAttended: { $size: '$attendedEnrollments' },
          problemsSolved: { $size: '$acceptedSubmissions' }
        }
      },
      {
        $addFields: {
          totalPoints: {
            $add: [
              { $multiply: ['$eventsAttended', 10] },
              { $multiply: ['$problemsSolved', 5] }
            ]
          }
        }
      },
      {
        $project: {
          name: 1,
          rollNo: 1,
          department: 1,
          profilePicUrl: 1,
          totalPoints: 1,
          eventsAttended: 1,
          problemsSolved: 1
        }
      },
      { $sort: { totalPoints: -1, eventsAttended: -1 } },
      { $limit: 50 }
    ]);

    return leaderboard;
  } catch (error) {
    req.log.error(error);
    reply.status(500).send({ message: 'Error fetching leaderboard' });
  }
};

exports.getMetrics = async (req, reply) => {
  try {
    const refresh = req.query?.refresh === 'true';
    const result = await getDashboardMetrics({ refresh });
    return reply.send({
      success: true,
      ...result,
    });
  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to aggregate dashboard metrics',
      error: error.message,
    });
  }
};

exports.exportReport = async (req, reply) => {
  try {
    const type = req.query?.type || 'summary';
    const format = req.query?.format || 'csv';

    if (format === 'csv') {
      const { data, filename } = await generateCsvReport(type);
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(data);
    } else if (format === 'pdf') {
      const { buffer, filename } = await generatePdfReport(type);
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(buffer);
    } else {
      return reply.status(400).send({ success: false, error: 'Unsupported format. Choose "csv" or "pdf".' });
    }
  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to export report',
      error: error.message,
    });
  }
};

