import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Team, { TeamStatus } from '../models/teamModel';
import User from '../models/userModel';
import Event from '../models/eventModel';

export interface CreateTeamBody {
  name: string;
  description?: string;
  leader?: string;
  members?: string[]; // user IDs or roll numbers
  event?: string;
  status?: TeamStatus;
}

export interface GetTeamsQuery {
  status?: string;
  eventId?: string;
  search?: string;
  studentId?: string;
}

export interface AssignMembersBody {
  members: string[]; // user IDs or roll numbers
}

export interface UpdateStatusBody {
  status: TeamStatus;
}

export const createTeam = async (
  request: FastifyRequest<{ Body: CreateTeamBody }>,
  reply: FastifyReply
) => {
  try {
    const currentUser = request.user;
    if (!currentUser) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { name, description = '', leader, members = [], event, status = 'Active' } =
      request.body;

    if (!name || !name.trim()) {
      return reply.status(400).send({ success: false, error: 'Team name is required' });
    }

    // Check duplicate team name
    const existing = await Team.findOne({ name: name.trim() });
    if (existing) {
      return reply.status(400).send({ success: false, error: 'A team with this name already exists' });
    }

    // Resolve member ObjectIds (support both user IDs and roll numbers)
    const resolvedMemberIds = new Set<string>();
    for (const memberIdentifier of members) {
      if (!memberIdentifier) continue;
      if (mongoose.Types.ObjectId.isValid(memberIdentifier)) {
        resolvedMemberIds.add(memberIdentifier);
      } else {
        const found = await User.findOne({ rollNo: memberIdentifier.trim().toUpperCase() });
        if (found) resolvedMemberIds.add(found._id.toString());
      }
    }

    // Include leader in members if provided
    let leaderId: mongoose.Types.ObjectId | undefined = undefined;
    if (leader) {
      if (mongoose.Types.ObjectId.isValid(leader)) {
        leaderId = new mongoose.Types.ObjectId(leader);
        resolvedMemberIds.add(leader);
      } else {
        const foundLeader = await User.findOne({ rollNo: leader.trim().toUpperCase() });
        if (foundLeader) {
          leaderId = foundLeader._id as mongoose.Types.ObjectId;
          resolvedMemberIds.add(foundLeader._id.toString());
        }
      }
    }

    // Validate event if passed
    let eventId: mongoose.Types.ObjectId | undefined = undefined;
    if (event && mongoose.Types.ObjectId.isValid(event)) {
      const eventExists = await Event.findById(event);
      if (eventExists) eventId = new mongoose.Types.ObjectId(event);
    }

    const team = await Team.create({
      name: name.trim(),
      description: description.trim(),
      leader: leaderId || undefined,
      members: Array.from(resolvedMemberIds).map((id) => new mongoose.Types.ObjectId(id)),
      event: eventId,
      status,
      isActive: status === 'Active',
      createdBy: new mongoose.Types.ObjectId(currentUser.id || currentUser._id),
    });

    const populatedTeam = await Team.findById((team as any)._id)
      .populate('leader', 'name rollNo email department profilePicUrl')
      .populate('members', 'name rollNo email department profilePicUrl')
      .populate('event', 'title date type format status')
      .populate('createdBy', 'name email role');

    return reply.status(201).send({
      success: true,
      message: 'Team created successfully',
      team: populatedTeam,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to create team',
    });
  }
};

export const getTeams = async (
  request: FastifyRequest<{ Querystring: GetTeamsQuery }>,
  reply: FastifyReply
) => {
  try {
    const { status, eventId, search, studentId } = request.query;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      query.event = eventId;
    }

    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      query.members = studentId;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { description: regex }];
    }

    const teams = await Team.find(query)
      .sort({ createdAt: -1 })
      .populate('leader', 'name rollNo email department profilePicUrl')
      .populate('members', 'name rollNo email department profilePicUrl')
      .populate('event', 'title date type format status')
      .populate('createdBy', 'name email role');

    return reply.send({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch teams',
    });
  }
};

export const getTeamById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid team ID' });
    }

    const team = await Team.findById(id)
      .populate('leader', 'name rollNo email department profilePicUrl')
      .populate('members', 'name rollNo email department profilePicUrl')
      .populate('event', 'title date type format status venueOrLink')
      .populate('createdBy', 'name email role');

    if (!team) {
      return reply.status(404).send({ success: false, error: 'Team not found' });
    }

    return reply.send({ success: true, team });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch team details',
    });
  }
};

export const updateTeam = async (
  request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateTeamBody> }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid team ID' });
    }

    const { name, description, leader, event, status } = request.body;
    const team = await Team.findById(id);
    if (!team) {
      return reply.status(404).send({ success: false, error: 'Team not found' });
    }

    if (name && name.trim() !== team.name) {
      const duplicate = await Team.findOne({ name: name.trim(), _id: { $ne: id } });
      if (duplicate) {
        return reply.status(400).send({ success: false, error: 'A team with this name already exists' });
      }
      team.name = name.trim();
    }

    if (description !== undefined) team.description = description.trim();
    if (leader !== undefined) {
      team.leader = leader && mongoose.Types.ObjectId.isValid(leader) ? new mongoose.Types.ObjectId(leader) : undefined;
    }
    if (event !== undefined) {
      team.event = event && mongoose.Types.ObjectId.isValid(event) ? new mongoose.Types.ObjectId(event) : undefined;
    }
    if (status) {
      team.status = status;
      team.isActive = status === 'Active';
    }

    await team.save();

    const updated = await Team.findById(id)
      .populate('leader', 'name rollNo email department profilePicUrl')
      .populate('members', 'name rollNo email department profilePicUrl')
      .populate('event', 'title date type format status');

    return reply.send({
      success: true,
      message: 'Team updated successfully',
      team: updated,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to update team',
    });
  }
};

export const deleteTeam = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid team ID' });
    }

    const team = await Team.findByIdAndDelete(id);
    if (!team) {
      return reply.status(404).send({ success: false, error: 'Team not found' });
    }

    return reply.send({ success: true, message: 'Team deleted successfully' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to delete team',
    });
  }
};

/**
 * Admin action: block or deactivate teams
 */
export const setTeamStatus = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateStatusBody }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const { status } = request.body;

    if (!['Active', 'Inactive', 'Blocked'].includes(status)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid status. Must be "Active", "Inactive", or "Blocked"',
      });
    }

    const team = await Team.findByIdAndUpdate(
      id,
      { $set: { status, isActive: status === 'Active' } },
      { new: true }
    )
      .populate('leader', 'name rollNo email department profilePicUrl')
      .populate('members', 'name rollNo email department profilePicUrl');

    if (!team) {
      return reply.status(404).send({ success: false, error: 'Team not found' });
    }

    return reply.send({
      success: true,
      message: `Team status updated to ${status}`,
      team,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to update team status',
    });
  }
};

/**
 * Admin action: Map/assign students to a specific team
 */
export const assignMembers = async (
  request: FastifyRequest<{ Params: { id: string }; Body: AssignMembersBody }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const { members } = request.body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'Please provide at least one student user ID or roll number',
      });
    }

    const team = await Team.findById(id);
    if (!team) {
      return reply.status(404).send({ success: false, error: 'Team not found' });
    }

    const currentMemberIds = new Set(team.members.map((m) => m.toString()));
    const addedStudents: string[] = [];

    for (const identifier of members) {
      let studentId: string | null = null;
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        studentId = identifier;
      } else {
        const student = await User.findOne({ rollNo: identifier.trim().toUpperCase() });
        if (student) studentId = student._id.toString();
      }

      if (studentId && !currentMemberIds.has(studentId)) {
        currentMemberIds.add(studentId);
        addedStudents.push(studentId);
      }
    }

    team.members = Array.from(currentMemberIds).map((mid) => new mongoose.Types.ObjectId(mid));
    await team.save();

    const updated = await Team.findById(id)
      .populate('leader', 'name rollNo email department profilePicUrl')
      .populate('members', 'name rollNo email department profilePicUrl');

    return reply.send({
      success: true,
      message: `${addedStudents.length} student(s) mapped to team "${team.name}"`,
      team: updated,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to assign team members',
    });
  }
};

/**
 * Admin action: Remove a student from a team
 */
export const removeMember = async (
  request: FastifyRequest<{ Params: { id: string; userId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id, userId } = request.params;

    const team = await Team.findById(id);
    if (!team) {
      return reply.status(404).send({ success: false, error: 'Team not found' });
    }

    team.members = team.members.filter((m) => m.toString() !== userId);

    // If leader was removed, clear leader
    if (team.leader && team.leader.toString() === userId) {
      team.leader = undefined;
    }

    await team.save();

    const updated = await Team.findById(id)
      .populate('leader', 'name rollNo email department profilePicUrl')
      .populate('members', 'name rollNo email department profilePicUrl');

    return reply.send({
      success: true,
      message: 'Student removed from team successfully',
      team: updated,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to remove member from team',
    });
  }
};

export default {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  setTeamStatus,
  assignMembers,
  removeMember,
};
