import { supabase } from '../../lib/supabase';

// Get user's groups
export const getUserGroups = async (userId: string) => {
  try {
    // First get user's group memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('group_members')
      .select('group_id, role, joined_at')
      .eq('user_id', userId);

    if (membershipsError) throw membershipsError;

    if (!memberships || memberships.length === 0) {
      return [];
    }

    // Get unique group IDs
    const groupIds = [...new Set(memberships.map(membership => membership.group_id))];

    // Get group information
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description, group_image, created_by, created_at')
      .in('id', groupIds);

    if (groupsError) throw groupsError;

    // Transform data and get member counts
    const groupsWithCounts = await Promise.all(
      memberships.map(async (membership) => {
        const group = groups?.find(g => g.id === membership.group_id);

        if (!group) return null;

        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', membership.group_id);

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          group_image: group.group_image,
          created_by: group.created_by,
          created_at: group.created_at,
          user_role: membership.role,
          member_count: count || 0
        };
      })
    );

    // Filter out null values
    return groupsWithCounts.filter(group => group !== null);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
};

// Create a new group
export const createGroup = async (
  name: string,
  description: string,
  createdBy: string,
  memberIds: string[]
) => {
  try {
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: createdBy
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as admin
    const { error: creatorError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupData.id,
        user_id: createdBy,
        role: 'admin'
      });

    if (creatorError) throw creatorError;

    // Add other members
    if (memberIds.length > 0) {
      const { error: membersError } = await supabase
        .from('group_members')
        .insert(
          memberIds.map(userId => ({
            group_id: groupData.id,
            user_id: userId,
            role: 'member'
          }))
        );

      if (membersError) throw membersError;
    }

    return groupData;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

// Get group details
export const getGroupDetails = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching group details:', error);
    throw error;
  }
};

// Get group members
export const getGroupMembers = async (groupId: string) => {
  try {
    // First get group members
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('id, user_id, role, joined_at')
      .eq('group_id', groupId);

    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(members.map(member => member.user_id))];

    // Get user information
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, profile_image, role')
      .in('id', userIds);

    if (usersError) throw usersError;

    // Combine members with user info
    const membersWithUsers = members.map(member => ({
      ...member,
      users: users?.find(user => user.id === member.user_id) || null
    }));

    return membersWithUsers;
  } catch (error) {
    console.error('Error fetching group members:', error);
    return [];
  }
};

// Get group messages
export const getGroupMessages = async (groupId: string) => {
  try {
    // First get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .eq('message_type', 'group')
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    if (!messages || messages.length === 0) {
      return [];
    }

    // Get unique sender IDs
    const senderIds = [...new Set(messages.map(msg => msg.sender_id))];

    // Get sender information
    const { data: senders, error: sendersError } = await supabase
      .from('users')
      .select('id, full_name, profile_image, role')
      .in('id', senderIds);

    if (sendersError) throw sendersError;

    // Combine messages with sender info
    const messagesWithSenders = messages.map(message => ({
      ...message,
      sender: senders?.find(sender => sender.id === message.sender_id) || null
    }));

    return messagesWithSenders;
  } catch (error) {
    console.error('Error fetching group messages:', error);
    return [];
  }
};

// Send group message
export const sendGroupMessage = async (
  senderId: string,
  groupId: string,
  content: string
) => {
  try {
    console.log('Attempting to send message with senderId:', senderId);

    // First verify the sender exists
    const { data: senderCheck, error: senderCheckError } = await supabase
      .from('users')
      .select('id, full_name, profile_image, role')
      .eq('id', senderId)
      .single();

    if (senderCheckError) {
      console.error('Sender verification failed:', senderCheckError);
      throw new Error(`Sender with ID ${senderId} not found in users table`);
    }

    if (!senderCheck) {
      throw new Error(`No user found with ID ${senderId}`);
    }

    console.log('Sender verified:', senderCheck);

    // Verify the group exists and user is a member
    const { data: memberCheck, error: memberCheckError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', senderId)
      .single();

    if (memberCheckError || !memberCheck) {
      console.error('Member verification failed:', memberCheckError);
      throw new Error(`User ${senderId} is not a member of group ${groupId}`);
    }

    console.log('Member verification passed');

    // Now insert the message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        content,
        sender_id: senderId,
        group_id: groupId,
        message_type: 'group',
        seen: true,
      })
      .select('*')
      .single();

    if (messageError) {
      console.error('Message insert failed:', messageError);
      throw messageError;
    }

    console.log('Message inserted successfully:', messageData);

    // Combine message with sender info
    const messageWithSender = {
      ...messageData,
      sender: senderCheck
    };

    // Get all group members except sender
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', senderId);

    // Create message status for all members
    if (members && members.length > 0) {
      await supabase
        .from('group_message_status')
        .insert(
          members.map(member => ({
            message_id: messageData.id,
            user_id: member.user_id,
            seen: false
          }))
        );
    }

    return messageWithSender;
  } catch (error) {
    console.error('Error sending group message:', error);
    throw error;
  }
};

// Add member to group
export const addGroupMember = async (groupId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding group member:', error);
    throw error;
  }
};

// Remove member from group
export const removeGroupMember = async (groupId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
};

// Delete group message
export const deleteGroupMessage = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting group message:', error);
    throw error;
  }
};

// Edit group message
export const editGroupMessage = async (messageId: string, content: string) => {
  try {
    // First update the message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .update({ content })
      .eq('id', messageId)
      .select('*')
      .single();

    if (messageError) throw messageError;

    // Get sender information
    const { data: senderData, error: senderError } = await supabase
      .from('users')
      .select('id, full_name, profile_image, role')
      .eq('id', messageData.sender_id)
      .single();

    if (senderError) throw senderError;

    // Combine message with sender info
    const messageWithSender = {
      ...messageData,
      sender: senderData
    };

    return messageWithSender;
  } catch (error) {
    console.error('Error editing group message:', error);
    throw error;
  }
};

// Get unseen group message count
export const getGroupUnseenMessageCount = async (userId: string, groupId: string) => {
  try {
    // Get unseen message statuses for the user
    const { data: unseenStatuses, error: statusError } = await supabase
      .from('group_message_status')
      .select('message_id')
      .eq('user_id', userId)
      .eq('seen', false);

    if (statusError) throw statusError;

    if (!unseenStatuses || unseenStatuses.length === 0) {
      return 0;
    }

    // Get message IDs
    const messageIds = unseenStatuses.map(status => status.message_id);

    // Count messages that belong to the specific group
    const { data: groupMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .eq('group_id', groupId)
      .in('id', messageIds);

    if (messagesError) throw messagesError;

    return groupMessages?.length || 0;
  } catch (error) {
    console.error('Error getting unseen group message count:', error);
    return 0;
  }
};

// Get message seen status for a specific message
export const getMessageSeenStatus = async (messageId: string, groupId: string) => {
  try {
    // First get the message to find the sender
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (messageError) throw messageError;

    // Get all group members except the sender
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', message.sender_id);

    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return { seenCount: 0, totalMembers: 0, seenBy: [] };
    }

    // Get all message statuses for this message (both seen and unseen)
    const { data: messageStatuses, error: statusError } = await supabase
      .from('group_message_status')
      .select('user_id, seen, seen_at')
      .eq('message_id', messageId);

    if (statusError) throw statusError;

    // Get user information for the seen statuses
    const seenStatuses = messageStatuses?.filter(status => status.seen === true) || [];

    let seenBy = [];
    if (seenStatuses.length > 0) {
      const userIds = seenStatuses.map(status => status.user_id);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      seenBy = seenStatuses.map(status => ({
        userId: status.user_id,
        seenAt: status.seen_at,
        userName: users?.find(user => user.id === status.user_id)?.full_name || 'Unknown'
      }));
    }

    return {
      seenCount: seenBy.length,
      totalMembers: members.length, // This now excludes the sender
      seenBy
    };
  } catch (error) {
    console.error('Error getting message seen status:', error);
    return { seenCount: 0, totalMembers: 0, seenBy: [] };
  }
};

// Mark group messages as seen
export const markGroupMessagesAsSeen = async (userId: string, groupId: string) => {
  try {
    // Get all messages in the group that are not sent by the current user
    const { data: groupMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .eq('group_id', groupId)
      .neq('sender_id', userId);

    if (messagesError) throw messagesError;
    if (!groupMessages || groupMessages.length === 0) return true;

    // Update or insert message status for all messages
    const statusUpdates = groupMessages.map(msg => ({
      message_id: msg.id,
      user_id: userId,
      seen: true,
      seen_at: new Date().toISOString()
    }));

    const { error: upsertError } = await supabase
      .from('group_message_status')
      .upsert(statusUpdates, {
        onConflict: 'message_id,user_id',
        ignoreDuplicates: false
      });

    if (upsertError) throw upsertError;
    return true;
  } catch (error) {
    console.error('Error marking group messages as seen:', error);
    throw error;
  }
};