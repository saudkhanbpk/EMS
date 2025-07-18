import React, { useState, useEffect } from 'react';
import { Trash2, ThumbsUp, ThumbsDown, MessageSquare, Heart, Laugh, Frown, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchComplaints, addComment, toggleReaction, type Complaint as ComplaintType, type ComplaintComment, type ComplaintReaction } from '../lib/complaints';
import { supabase } from '../lib/supabase';

// Extended complaint interface with comments and reactions
interface ExtendedComplaint extends ComplaintType {
    comments: ComplaintComment[];
    reactions: ComplaintReaction[];
    users?: {
        full_name: string;
    };
}

const SuperAdminComplaint: React.FC = () => {
    const [complaints, setComplaints] = useState<ExtendedComplaint[]>([]);
    const [newComments, setNewComments] = useState<{ [key: number]: string }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [visibleComments, setVisibleComments] = useState<{ [key: number]: boolean }>({});

    // Get current user ID
    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        getCurrentUser();
    }, []);

    // Fetch complaints from database
    useEffect(() => {
        const loadComplaints = async () => {
            try {
                setLoading(true);
                setError(null);
                const complaintsData = await fetchComplaints();
                setComplaints(complaintsData || []);
            } catch (err) {
                console.error('Error fetching complaints:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch complaints');
            } finally {
                setLoading(false);
            }
        };

        loadComplaints();
    }, []);

    // Format date to be more readable
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    // Handle adding a comment to a complaint
    const handleAddComment = async (complaintId: number) => {
        if (!newComments[complaintId] || newComments[complaintId].trim() === '' || !currentUserId) return;

        try {
            const newComment = await addComment(complaintId, currentUserId, newComments[complaintId]);

            if (newComment) {
                const updatedComplaints = complaints.map(complaint => {
                    if (complaint.id === complaintId) {
                        return {
                            ...complaint,
                            comments: [...complaint.comments, newComment]
                        };
                    }
                    return complaint;
                });

                setComplaints(updatedComplaints);
                setNewComments({ ...newComments, [complaintId]: '' });
            }
        } catch (err) {
            console.error('Error adding comment:', err);
            setError(err instanceof Error ? err.message : 'Failed to add comment');
        }
    };

    // Handle adding a reaction to a complaint
    const handleReaction = async (complaintId: number, reactionType: string) => {
        if (!currentUserId) return;

        try {
            await toggleReaction(complaintId, currentUserId, reactionType);

            // Refresh complaints to get updated reactions
            const complaintsData = await fetchComplaints();
            setComplaints(complaintsData || []);
        } catch (err) {
            console.error('Error toggling reaction:', err);
            setError(err instanceof Error ? err.message : 'Failed to toggle reaction');
        }
    };

    // Handle deleting a comment
    const handleDeleteComment = async (commentId: number, complaintId: number) => {
        if (!currentUserId) return;
        try {
            const { error } = await supabase
                .from('complaint_comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', currentUserId); // Ensure user can only delete their own comments

            if (error) throw error;

            // Update local state to remove the deleted comment
            const updatedComplaints = complaints.map(complaint => {
                if (complaint.id === complaintId) {
                    return {
                        ...complaint,
                        comments: complaint.comments.filter(comment => comment.id !== commentId)
                    };
                }
                return complaint;
            });

            setComplaints(updatedComplaints);
        } catch (err) {
            console.error('Error deleting comment:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete comment');
        }
    };



    // Handle deleting a complaint
    const handleDeleteComplaint = async (complaintId: number) => {
        try {
            const { error } = await supabase
                .from('software_complaints')
                .delete()
                .eq('id', complaintId);

            if (error) throw error;

            // Remove from local state
            setComplaints(complaints.filter(c => c.id !== complaintId));
        } catch (err) {
            console.error('Error deleting complaint:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete complaint');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Software Complaints</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : complaints.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    <p>No complaints found.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {complaints.map(complaint => (
                        <div key={complaint.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm text-gray-500">{formatDate(complaint.created_at)}</p>
                                        <span className="text-sm font-medium text-blue-600">• {complaint.users?.full_name || 'Anonymous'}</span>
                                    </div>
                                    <p className="text-gray-800">{complaint.complaint_text}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteComplaint(complaint.id)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Delete complaint"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Reactions */}
                            <div className="flex gap-4 mt-4">
                                <button
                                    onClick={() => handleReaction(complaint.id, 'like')}
                                    className={`flex items-center gap-1 ${complaint.reactions?.some(r => r.user_id === currentUserId && r.reaction_type === 'like') ? 'text-blue-600' : 'text-gray-500'}`}
                                >
                                    <ThumbsUp size={16} />
                                    <span>{complaint.reactions?.filter(r => r.reaction_type === 'like').length || 0}</span>
                                </button>

                                <button
                                    onClick={() => handleReaction(complaint.id, 'dislike')}
                                    className={`flex items-center gap-1 ${complaint.reactions?.some(r => r.user_id === currentUserId && r.reaction_type === 'dislike') ? 'text-red-600' : 'text-gray-500'}`}
                                >
                                    <ThumbsDown size={16} />
                                    <span>{complaint.reactions?.filter(r => r.reaction_type === 'dislike').length || 0}</span>
                                </button>

                                <button
                                    onClick={() => handleReaction(complaint.id, 'heart')}
                                    className={`flex items-center gap-1 ${complaint.reactions?.some(r => r.user_id === currentUserId && r.reaction_type === 'heart') ? 'text-red-500' : 'text-gray-500'}`}
                                >
                                    <Heart size={16} />
                                    <span>{complaint.reactions?.filter(r => r.reaction_type === 'heart').length || 0}</span>
                                </button>

                                <button
                                    onClick={() => handleReaction(complaint.id, 'laugh')}
                                    className={`flex items-center gap-1 ${complaint.reactions?.some(r => r.user_id === currentUserId && r.reaction_type === 'laugh') ? 'text-yellow-500' : 'text-gray-500'}`}
                                >
                                    <Laugh size={16} />
                                    <span>{complaint.reactions?.filter(r => r.reaction_type === 'laugh').length || 0}</span>
                                </button>

                                <button
                                    onClick={() => handleReaction(complaint.id, 'sad')}
                                    className={`flex items-center gap-1 ${complaint.reactions?.some(r => r.user_id === currentUserId && r.reaction_type === 'sad') ? 'text-blue-400' : 'text-gray-500'}`}
                                >
                                    <Frown size={16} />
                                    <span>{complaint.reactions?.filter(r => r.reaction_type === 'sad').length || 0}</span>
                                </button>

                                <div className="flex items-center gap-1 text-gray-500">
                                    <MessageSquare size={16} />
                                    <span>{complaint.comments?.length || 0}</span>
                                </div>
                            </div>

                            {/* Comments section */}
                            <div className="mt-4">
                                {complaint.comments && complaint.comments.length > 0 && (
                                    <div className="border-t pt-3 mt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-sm font-medium">Comments</h3>
                                            <button 
                                                onClick={() => setVisibleComments(prev => ({
                                                    ...prev,
                                                    [complaint.id]: !prev[complaint.id]
                                                }))}
                                                className="text-gray-500 hover:text-blue-500 flex items-center"
                                                title={visibleComments[complaint.id] ? "Hide comments" : "Show comments"}
                                            >
                                                {visibleComments[complaint.id] ? 
                                                    <ChevronUp size={16} /> : 
                                                    <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                        {visibleComments[complaint.id] && (
                                        <div className="space-y-2">
                                            {complaint.comments.map(comment => (
                                                <div key={comment.id} className="bg-gray-50 p-2 rounded text-sm relative group">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm mb-1">{comment.full_name || 'Anonymous'}</p>
                                                            <p className="text-gray-800">{comment.comment_text}</p>
                                                            <p className="text-xs text-gray-500 mt-1">{formatDate(comment.created_at)}</p>
                                                        </div>
                                                        {/* Show delete button only for user's own comments */}
                                                        {comment.user_id === currentUserId && (
                                                            <button
                                                                onClick={() => handleDeleteComment(comment.id, complaint.id)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                                                                title="Delete comment"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        )}
                                    </div>
                                )}

                                {/* Add comment form - always visible */}
                                <div className="mt-3 flex">
                                    <input
                                        type="text"
                                        value={newComments[complaint.id] || ''}
                                        onChange={(e) => setNewComments({ ...newComments, [complaint.id]: e.target.value })}
                                        placeholder="Add a comment..."
                                        className="flex-grow border rounded-l px-3 py-1 text-sm"
                                        onFocus={() => {
                                            if (!visibleComments[complaint.id] && complaint.comments.length > 0) {
                                                setVisibleComments(prev => ({ ...prev, [complaint.id]: true }));
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => handleAddComment(complaint.id)}
                                        className="bg-blue-500 text-white px-3 py-1 rounded-r text-sm hover:bg-blue-600"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuperAdminComplaint;