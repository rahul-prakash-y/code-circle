const User = require('../models/userModel');
const Event = require('../models/eventModel');
const Enrollment = require('../models/enrollmentModel');
const Submission = require('../models/submissionModel');

exports.getDashboardStats = async (req, reply) => {
  try {
    const now = new Date();

    // 1. Total Students
    const totalStudents = await User.countDocuments({ role: 'Student' });

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

    const attendancePercentage = attendanceStats.length > 0 
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
            $arrayAt: [
              ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
              "$_id.month"
            ]
          }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    return {
      stats: {
        totalStudents,
        totalEvents: upcomingEvents + pastEvents,
        upcomingEvents,
        pastEvents,
        attendancePercentage
      },
      growthData
    };
  } catch (error) {
    req.log.error(error);
    reply.status(500).send({ message: 'Error fetching dashboard stats' });
  }
};

exports.getLeaderboard = async (req, reply) => {
  try {
    const leaderboard = await User.aggregate([
      { $match: { role: 'Student' } },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'enrolledBy',
          as: 'enrollments'
        }
      },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'user',
          as: 'submissions'
        }
      },
      {
        $addFields: {
          eventsAttended: {
            $size: {
              $filter: {
                input: "$enrollments",
                as: "e",
                cond: { $eq: ["$$e.attendanceStatus", true] }
              }
            }
          },
          problemsSolved: {
            $size: {
              $filter: {
                input: "$submissions",
                as: "s",
                cond: { $eq: ["$$s.status", "Accepted"] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          totalPoints: {
            $add: [
              { $multiply: ["$eventsAttended", 10] },
              { $multiply: ["$problemsSolved", 5] }
            ]
          }
        }
      },
      {
        $project: {
          name: 1,
          rollNo: 1,
          profilePicUrl: 1,
          totalPoints: 1,
          eventsAttended: 1,
          problemsSolved: 1
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 50 }
    ]);

    return leaderboard;
  } catch (error) {
    req.log.error(error);
    reply.status(500).send({ message: 'Error fetching leaderboard' });
  }
};
