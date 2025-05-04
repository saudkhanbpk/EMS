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

export { fetchChatMessages, sendMessage, deleteMessage, markMessagesAsSeen, getUnseenMessageCount, getonecountmsg, editMessage }  