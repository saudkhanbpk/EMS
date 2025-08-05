import { useAuthStore } from "../../lib/store";
import { supabase } from "../../lib/supabase";

const fetchChatMessages = async (currentUserId: any, targetUserId: any) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${currentUserId},reciever_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},reciever_id.eq.${currentUserId})`)
    .order('created_at', { ascending: true });

  if (error) console.error(error);
  else return data;
};
const sendMessage = async (senderId: any, receiverId: any, content: any) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      { sender_id: senderId, reciever_id: receiverId, content }
    ])
    .select('*'); // This ensures the inserted data is returned

  if (error) {
    console.error('Error inserting message:', error);
  } else {
    console.log('Inserted message:', data);
  }

  return data;

};
const deleteMessage = async (messageId: any) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);
  if (error) throw error;
};
const markMessagesAsSeen = async (receiverId: unknown, senderId: unknown) => {
  // Ensure the current user is the receiver

  const { error } = await supabase
    .from('messages')
    .update({ seen: true })
    .eq('reciever_id', receiverId)
    .eq('sender_id', senderId)
    .eq('seen', false);
  // Only update unread messages

  if (error) {
    console.error("Error updating message status:", error);
  }
};

const getUnseenMessageCount = async (currentUserId: unknown) => {
  const { data, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('reciever_id', currentUserId)
    .eq('seen', false);

  if (error) {
    console.error("Error fetching unseen messages:", error);
    return 0; // Return 0 if there's an error
  }
  return data.length; // Return the count of unseen messages
};

const getonecountmsg = async (currentUserId: unknown, sender_id: unknown) => {
  const { data, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('reciever_id', currentUserId)
    .eq('sender_id', sender_id)
    .eq('seen', false);

  if (error) {
    console.error("Error fetching unseen messages:", error);
    return 0; // Return 0 if there's an error
  }
  return data.length; // Return the count of unseen messages
};

let editMessage = async (messageId: string, newContent: string) => {
  const { data, error } = await supabase
    .from('messages')
    .update({ content: newContent })
    .eq('id', messageId)
    .select();

  if (error) {
    console.error('Error updating message:', error);
    throw error;
  }

  return data;
};

// Group Chat Functions
const getUserGroups = async (userId: string) => {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      role,
      groups (
        id,
        name,
        description,
        group_image,
        created_by,
        created_at
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }

  // Transform the data and get member counts
  const groupsWithCounts = await Promise.all(
    data.map(async (item) => {
      const { data: memberCount } = await supabase
        .from('group_members')
        .select('id', { count: 'exact' })
        .eq('group_id', item.group_id);

      return {
        id: item.groups.id,
        name: item.groups.name,
        description: item.groups.description,
        group_image: item.groups.group_image,
        created_by: item.groups.created_by,
        created_at: item.groups.created_at,
        user_role: item.role,
        member_count: memberCount?.length || 0
      };
    })
  );

  return groupsWithCounts;
};

const createGroup = async (name: string, description: string, createdBy: string, memberIds: string[]) => {
  // Create the group
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .insert([
      { name, description, created_by: createdBy }
    ])
    .select()
    .single();

  if (groupError) {
    console.error('Error creating group:', groupError);
    throw groupError;
  }

  // Add creator as admin
  const { error: creatorError } = await supabase
    .from('group_members')
    .insert([
      { group_id: groupData.id, user_id: createdBy, role: 'admin' }
    ]);

  if (creatorError) {
    console.error('Error adding creator to group:', creatorError);
    throw creatorError;
  }

  // Add other members
  if (memberIds.length > 0) {
    const memberInserts = memberIds.map(userId => ({
      group_id: groupData.id,
      user_id: userId,
      role: 'member'
    }));

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(memberInserts);

    if (membersError) {
      console.error('Error adding members to group:', membersError);
      throw membersError;
    }
  }

  return groupData;
};

const sendGroupMessage = async (senderId: string, groupId: string, content: string) => {
  // Insert the group message
  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .insert([
      { 
        sender_id: senderId, 
        group_id: groupId, 
        content,
        message_type: 'group'
      }
    ])
    .select('*')
    .single();

  if (messageError) {
    console.error('Error sending group message:', messageError);
    throw messageError;
  }

  // Get all group members except the sender
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .neq('user_id', senderId);

  if (membersError) {
    console.error('Error fetching group members:', membersError);
    throw membersError;
  }

  // Create message status entries for all members
  if (members && members.length > 0) {
    const statusInserts = members.map(member => ({
      message_id: messageData.id,
      user_id: member.user_id,
      seen: false
    }));

    const { error: statusError } = await supabase
      .from('group_message_status')
      .insert(statusInserts);

    if (statusError) {
      console.error('Error creating message status:', statusError);
      throw statusError;
    }
  }

  return messageData;
};

const fetchGroupMessages = async (groupId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles:sender_id (
        id,
        full_name,
        profile_image
      )
    `)
    .eq('group_id', groupId)
    .eq('message_type', 'group')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching group messages:', error);
    return [];
  }

  return data;
};

const markGroupMessageAsSeen = async (messageId: string, userId: string) => {
  const { error } = await supabase
    .from('group_message_status')
    .update({ seen: true, seen_at: new Date().toISOString() })
    .eq('message_id', messageId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking group message as seen:', error);
    throw error;
  }
};

const getGroupUnseenMessageCount = async (userId: string, groupId: string) => {
  const { data, error } = await supabase
    .from('group_message_status')
    .select(`
      id,
      messages!inner (
        group_id
      )
    `)
    .eq('user_id', userId)
    .eq('seen', false)
    .eq('messages.group_id', groupId);

  if (error) {
    console.error('Error fetching group unseen message count:', error);
    return 0;
  }

  return data?.length || 0;
};

const addGroupMember = async (groupId: string, userId: string, role: string = 'member') => {
  const { data, error } = await supabase
    .from('group_members')
    .insert([
      { group_id: groupId, user_id: userId, role }
    ])
    .select();

  if (error) {
    console.error('Error adding group member:', error);
    throw error;
  }

  return data;
};

const removeGroupMember = async (groupId: string, userId: string) => {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
};

const getGroupMembers = async (groupId: string) => {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      role,
      joined_at,
      profiles:user_id (
        id,
        full_name,
        profile_image,
        role
      )
    `)
    .eq('group_id', groupId);

  if (error) {
    console.error('Error fetching group members:', error);
    return [];
  }

  return data;
};

export { 
  fetchChatMessages, 
  sendMessage, 
  deleteMessage, 
  markMessagesAsSeen, 
  getUnseenMessageCount, 
  getonecountmsg, 
  editMessage,
  // Group functions
  getUserGroups,
  createGroup,
  sendGroupMessage,
  fetchGroupMessages,
  markGroupMessageAsSeen,
  getGroupUnseenMessageCount,
  addGroupMember,
  removeGroupMember,
  getGroupMembers
}  