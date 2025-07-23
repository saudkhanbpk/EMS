import { supabase, withRetry } from './supabase';

// Types
export interface Complaint {
  id: number;
  created_at: string;
  complaint_text: string;
  user_id: string;
  organization_id: string;
}

export interface ComplaintComment {
  id: number;
  complaint_id: number;
  user_id: string;
  comment_text: string;
  created_at: string;
  full_name?: string;
}

export interface ComplaintReaction {
  id: number;
  complaint_id: number;
  user_id: string;
  reaction_type: string; // 'like', 'dislike', 'heart', 'laugh', etc.
  created_at: string;
}

// Fetch complaints with comments and reactions
export async function fetchComplaints() {
  const { data: complaints, error } = await withRetry(() => 
    supabase
      .from('software_complaints')
      .select(`
        *,
        users:user_id (full_name)
      `)
      .order('created_at', { ascending: false })
  );

  if (error) throw error;
  
  // Get comments for all complaints with user names
  const { data: comments, error: commentsError } = await withRetry(() => 
    supabase
      .from('complaint_comments')
      .select(`
        *,
        users:user_id (full_name)
      `)
      .in('complaint_id', complaints?.map(c => c.id) || [])
      .order('created_at', { ascending: true })
  );
  
  if (commentsError) throw commentsError;
  
  // Get reactions for all complaints
  const { data: reactions, error: reactionsError } = await withRetry(() => 
    supabase
      .from('complaint_reactions')
      .select('*')
      .in('complaint_id', complaints?.map(c => c.id) || [])
  );
  
  if (reactionsError) throw reactionsError;
  
  // Combine data
  const complaintsWithData = complaints?.map(complaint => {
    return {
      ...complaint,
      comments: comments?.filter(c => c.complaint_id === complaint.id).map(comment => ({
        ...comment,
        full_name: comment.users?.full_name
      })) || [],
      reactions: reactions?.filter(r => r.complaint_id === complaint.id) || []
    };
  });
  
  return complaintsWithData;
}

// Add a comment to a complaint
export async function addComment(complaintId: number, userId: string, commentText: string) {
  // Insert the comment
  const { data, error } = await withRetry(() => 
    supabase
      .from('complaint_comments')
      .insert({
        complaint_id: complaintId,
        user_id: userId,
        comment_text: commentText
      })
      .select()
  );
  
  if (error) throw error;
  
  // Get the user's full name
  if (data && data[0]) {
    const { data: userData, error: userError } = await withRetry(() =>
      supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single()
    );
    
    if (!userError && userData) {
      return {
        ...data[0],
        full_name: userData.full_name
      };
    }
  }
  
  return data?.[0];
}

// Add or toggle a reaction
export async function toggleReaction(complaintId: number, userId: string, reactionType: string) {
  // First check if user already has this reaction
  const { data: existingReaction, error: checkError } = await withRetry(() => 
    supabase
      .from('complaint_reactions')
      .select('*')
      .eq('complaint_id', complaintId)
      .eq('user_id', userId)
      .eq('reaction_type', reactionType)
      .maybeSingle()
  );
  
  if (checkError) throw checkError;
  
  if (existingReaction) {
    // Remove the reaction (toggle off)
    const { error: deleteError } = await withRetry(() => 
      supabase
        .from('complaint_reactions')
        .delete()
        .eq('id', existingReaction.id)
    );
    
    if (deleteError) throw deleteError;
    return null;
  } else {
    // Check if user has a different reaction type
    const { data: otherReaction, error: otherCheckError } = await withRetry(() => 
      supabase
        .from('complaint_reactions')
        .select('*')
        .eq('complaint_id', complaintId)
        .eq('user_id', userId)
        .maybeSingle()
    );
    
    if (otherCheckError) throw otherCheckError;
    
    if (otherReaction) {
      // Update the existing reaction
      const { data: updatedReaction, error: updateError } = await withRetry(() => 
        supabase
          .from('complaint_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', otherReaction.id)
          .select()
      );
      
      if (updateError) throw updateError;
      return updatedReaction?.[0];
    } else {
      // Add new reaction
      const { data: newReaction, error: insertError } = await withRetry(() => 
        supabase
          .from('complaint_reactions')
          .insert({
            complaint_id: complaintId,
            user_id: userId,
            reaction_type: reactionType
          })
          .select()
      );
      
      if (insertError) throw insertError;
      return newReaction?.[0];
    }
  }
}

// Delete a complaint
export async function deleteComplaint(complaintId: number) {
  // Delete will cascade to comments and reactions if you set up foreign keys properly
  const { error } = await withRetry(() => 
    supabase
      .from('software_complaints')
      .delete()
      .eq('id', complaintId)
  );
  
  if (error) throw error;
  return true;
}