import { supabase } from '../../lib/supabase';

// Get user's groups
export const getUserGroups = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        role,
        joined_at,
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

    if (error) throw error;
    return data?.map(item => ({ ...item.groups, member_role: item.role })) || [];
  } catch (error) {
    console.error('Error fetching user groups:', error);
    throw error;
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
    // Create the group
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

// Send group message
export const sendGroupMessage = async (
  senderId: string,
  groupId: string,
  content: string
) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content,
        sender_id: senderId,
        group_id: groupId,
        message_type: 'group'
      })
      .select(`
        *,
        sender:users(id, full_name, profile_image, role)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending group message:', error);
    throw error;
  }
};

// Mark group messages as seen
export const markGroupMessagesAsSeen = async (
  userId: string,
  groupId: string
) => {
  try {
    const { data: unseenMessages, error: fetchError } = await supabase
      .from('messages')
      .select('id')
      .eq('group_id', groupId)
      .neq('sender_id', userId);

    if (fetchError) throw fetchError;

    if (unseenMessages && unseenMessages.length > 0) {
      const { error: updateError } = await supabase
        .from('group_message_status')
        .upsert(
          unseenMessages.map(msg => ({
            message_id: msg.id,
            user_id: userId,
            seen: true,
            seen_at: new Date().toISOString()
          })),
          { onConflict: 'message_id,user_id' }
        );

      if (updateError) throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Error marking group messages as seen:', error);
    throw error;
  }
};