import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, MoreVertical, Trash2, Check, CheckCheck, ChevronDown, ChevronUp, Image, Smile, X, PhoneCall, Video, ExternalLink, Info, Edit2 } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useUserContext } from '../lib/userprovider';
import { deleteMessage, editMessage, fetchChatMessages, markMessagesAsSeen, sendMessage } from './chatlib/supabasefunc';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import ConfirmationAlert from './confirmdelete';

interface Message {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    seen: boolean;
}

interface ChatUser {
    id: string;
    full_name: string;
    role: string;
}

const Chat = ({ id, closechatperson }: { id: string, closechatperson: () => void }) => {

    const { chatUsers } = useUserContext();
    const chatuser = chatUsers.find((user) => user.id === id);
    const [isVisible, setIsVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);
    const currentuser = useAuthStore((state) => state.user);

    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [initialLoading, setInitialLoading] = useState(false); // For initial message loading only
    const [isSending, setIsSending] = useState(false); // For tracking message sending state
    const [showUserCard, setShowUserCard] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const userCardRef = useRef<HTMLDivElement>(null);
    const userAvatarRef = useRef<HTMLImageElement>(null);
    const editInputRef = useRef<HTMLTextAreaElement>(null);

    // Handle click outside of user card
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                userCardRef.current &&
                !userCardRef.current.contains(event.target as Node) &&
                userAvatarRef.current &&
                !userAvatarRef.current.contains(event.target as Node)
            ) {
                setShowUserCard(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Focus on edit input when editing starts
    useEffect(() => {
        if (editingMessageId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingMessageId]);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatMessageTime = (timestamp: string) => {
        const now = new Date();
        const messageDate = new Date(timestamp);

        const hours = messageDate.getHours().toString().padStart(2, '0');
        const minutes = messageDate.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;

        if (
            messageDate.getDate() !== now.getDate() ||
            messageDate.getMonth() !== now.getMonth() ||
            messageDate.getFullYear() !== now.getFullYear()
        ) {
            const day = messageDate.getDate().toString().padStart(2, '0');
            const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
            const year = messageDate.getFullYear();
            return `${day}/${month}/${year} ${timeString}`;
        }

        return timeString;
    };

    const groupMessagesByDate = () => {
        const groups: { [key: string]: Message[] } = {};
        messages.forEach(msg => {
            const date = new Date(msg.created_at);
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(msg);
        });
        return groups;
    };

    const getDayLabel = (dateKey: string) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month, day);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'TODAY';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'YESTERDAY';
        } else {
            const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('en-US', options).toUpperCase();
        }
    };

    const handleSendMessage = useCallback(async () => {
        if (!messageText.trim() || !currentuser?.id || !chatuser?.id) return;

        try {
            setIsSending(true);

            // Create a temporary message to show immediately
            const tempMessage: Message = {
                id: `temp-${Date.now()}`,
                content: messageText,
                created_at: new Date().toISOString(),
                sender_id: currentuser.id,
                seen: false
            };

            // Add the temporary message to the UI immediately
            setMessages(prevMessages => [...prevMessages, tempMessage]);

            // Clear the input field right away for better UX
            setMessageText('');

            // Actually send the message to the server
            const data = await sendMessage(currentuser.id, chatuser.id, tempMessage.content);

            // If successful, replace the temp message with the real one
            if (data && data.length > 0) {
                const newMessage = data[0];
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === tempMessage.id ? newMessage : msg
                    )
                );
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // If there's an error, remove the temporary message
            setMessages(prevMessages =>
                prevMessages.filter(msg => msg.id !== `temp-${Date.now()}`)
            );
        } finally {
            setIsSending(false);
        }
    }, [messageText, currentuser?.id, chatuser?.id]);

    const handleDeleteMessage = async (id: string) => {
        try {
            setIsVisible(true);
            setIsDeleting(true);
            await deleteMessage(id);
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== id));
        } catch (error) {
            console.error('Error deleting message:', error);
        } finally {
            setIsDeleting(false);
            setTimeout(() => {
                setIsVisible(false);
            }, 700);
        }
    };

    const handleStartEditing = (message: Message) => {
        setEditingMessageId(message.id);
        setEditingText(message.content);
    };

    const handleCancelEditing = () => {
        setEditingMessageId(null);
        setEditingText('');
    };

    const handleSaveEdit = async () => {
        if (!editingMessageId || !editingText.trim()) return;

        try {
            const data = await editMessage(editingMessageId, editingText);

            // Update the message locally instead of waiting for the subscription
            if (data && data.length > 0) {
                const updatedMessage = data[0];
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === updatedMessage.id ? updatedMessage : msg
                    )
                );
            }

            setEditingMessageId(null);
            setEditingText('');
        } catch (error) {
            console.error('Error updating message:', error);
        }
    };

    const isCurrentUserMessage = (msg: Message) => {
        return msg.sender_id === currentuser?.id;
    };

    const loadMessages = async () => {
        if (!currentuser?.id || !chatuser?.id) return;

        try {
            setInitialLoading(true);
            const data = await fetchChatMessages(currentuser.id, chatuser.id);
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    // Add visibility change detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsPageVisible(document.visibilityState === 'visible');

            // Mark messages as seen when the page becomes visible
            if (document.visibilityState === 'visible' && currentuser?.id && chatuser?.id) {
                markMessagesAsSeen(currentuser.id, chatuser.id);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [currentuser?.id, chatuser?.id]);

    // Replace the existing useEffect for markMessagesAsSeen
    useEffect(() => {
        if (!currentuser?.id || !chatuser?.id || !isPageVisible) return;

        const markAsSeen = async () => {
            try {
                await markMessagesAsSeen(currentuser.id, chatuser.id);
            } catch (error) {
                console.error('Error marking messages as seen:', error);
            }
        };

        markAsSeen();

        const intervalId = setInterval(markAsSeen, 30000); // Reduced frequency from 5s to 30s

        return () => {
            clearInterval(intervalId);
        };
    }, [messages, currentuser?.id, chatuser?.id, isPageVisible]);

    useEffect(() => {
        if (!currentuser?.id || !chatuser?.id) return;

        loadMessages();

        const channel = supabase
            .channel(`chat-messages-${currentuser.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                async (payload: any) => {
                    // Only handle messages from other users via subscription
                    // Our own messages are handled directly in the send/edit/delete functions
                    if (payload.eventType === 'INSERT' && payload.new.sender_id !== currentuser.id) {
                        setMessages(prevMessages => [...prevMessages, payload.new]);

                        // Mark messages as seen immediately when a new message arrives
                        if (payload.new.sender_id === chatuser.id && currentuser?.id) {
                            await markMessagesAsSeen(currentuser.id, chatuser.id);
                        }
                    }

                    if (payload.eventType === 'UPDATE' && payload.new.sender_id !== currentuser.id) {
                        setMessages(prevMessages =>
                            prevMessages.map(msg =>
                                msg.id === payload.new.id ? payload.new : msg
                            )
                        );
                    }

                    // Add a specific subscription for seen status updates
                    if (payload.eventType === 'UPDATE' && payload.old && payload.new &&
                        payload.old.seen !== payload.new.seen) {
                        setMessages(prevMessages =>
                            prevMessages.map(msg =>
                                msg.id === payload.new.id ? payload.new : msg
                            )
                        );
                    }

                    if (payload.eventType === 'DELETE' && payload.old.sender_id !== currentuser.id) {
                        setMessages(prevMessages =>
                            prevMessages.filter(msg => msg.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe();

        // Add a separate channel specifically for seen status updates
        const seenChannel = supabase
            .channel(`message-seen-${currentuser.id}-${chatuser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${currentuser.id}`
                },
                (payload: any) => {
                    if (payload.new && payload.old && payload.new.seen !== payload.old.seen) {
                        // Update the seen status in the UI
                        setMessages(prevMessages =>
                            prevMessages.map(msg =>
                                msg.id === payload.new.id ? payload.new : msg
                            )
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
            seenChannel.unsubscribe();
        };
    }, [currentuser?.id, chatuser?.id]);

    if (!chatuser) {
        return (
            <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50">
                <div className="flex justify-center items-center h-full text-gray-400 bg-black p-4 rounded-t-lg shadow-xl border border-gray-700">
                    <p className='text-xl'>No user found</p>
                </div>
            </div>
        );
    }

    if (chatuser.id === currentuser?.id) {
        return (
            <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50">
                <div className="flex justify-center items-center h-full text-gray-400 bg-black p-4 rounded-t-lg shadow-xl border border-gray-700">
                    <p className='text-xl'>You can't chat with yourself!</p>
                </div>
            </div>
        );
    }

    const messageGroups = groupMessagesByDate();

    return (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50">
            <div
                className={`flex flex-col ${isMinimized ? 'h-16' : 'h-[80vh]'} bg-black shadow-xl rounded-t-lg border border-gray-700 transition-all duration-300`}
                style={{ maxWidth: '750px', width: '90vw' }}
            >
                {/* LinkedIn-style Chat Header */}
                <div className="bg-black p-3 flex items-center justify-between border-b border-gray-700 shadow-sm rounded-t-lg">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img
                                ref={userAvatarRef}
                                className='h-10 w-10 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity border border-gray-300'
                                // Option 1: Inline approach
                                src={(() => {
                                    if (chatuser.profile_image) {
                                        const { data: { publicUrl } } = supabase
                                            .storage
                                            .from("profilepics")
                                            .getPublicUrl(chatuser.profile_image);
                                        return publicUrl;
                                    }
                                    return chatuser.role === "admin" ? "./admin.jpeg" : "./profile.png";
                                })()}
                                alt="profile"
                                onClick={() => setShowUserCard(!showUserCard)}
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div
                            className="flex flex-col cursor-pointer hover:text-blue-400 transition-colors"
                            onClick={() => setShowUserCard(!showUserCard)}
                        >
                            <h2 className="font-medium text-white">{chatuser.full_name}</h2>
                            <span className="text-xs text-gray-400">Online now</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="text-gray-400 p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                            <PhoneCall size={18} />
                        </button>
                        <button className="text-gray-400 p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                            <Video size={18} />
                        </button>
                        <button className="text-gray-400 p-1.5 rounded-full hover:bg-gray-800 transition-colors">
                            <Info size={18} />
                        </button>
                        <button
                            className="text-gray-400 p-1.5 rounded-full hover:bg-gray-800 transition-colors"
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        <button
                            className="text-gray-400 p-1.5 rounded-full hover:bg-gray-800 transition-colors ml-1"
                            onClick={() => closechatperson()}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* LinkedIn-style User Profile Card on Hover */}
                    {showUserCard && (
                        <div
                            ref={userCardRef}
                            className="absolute top-16 left-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 transition-all duration-200 animate-fade-in"
                        >
                            <div className="relative">
                                <div className="h-20 bg-gray-100 rounded-t-lg"></div>
                                <div className="absolute top-8 left-4">
                                    <img
                                        src={(() => {
                                            if (chatuser.profile_image) {
                                                const { data: { publicUrl } } = supabase
                                                    .storage
                                                    .from("profilepics")
                                                    .getPublicUrl(chatuser.profile_image);
                                                return publicUrl;
                                            }
                                            return chatuser.role === "admin" ? "./admin.jpeg" : "./profile.png";
                                        })()}
                                        className="w-16 h-16 rounded-full border-4 border-white"
                                        alt={chatuser.full_name}
                                    />
                                </div>
                            </div>
                            <div className="pt-10 p-4">
                                <h3 className="font-semibold text-lg text-gray-900">{chatuser.full_name}</h3>
                                <p className="text-sm text-gray-600 capitalize">{chatuser.role} at Tech Creator</p>
                                <p className="text-xs text-gray-500 mt-1">Active now</p>

                                <div className="mt-4 flex gap-2">
                                    <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors flex-1">
                                        View Profile
                                    </button>
                                    <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors flex-1">
                                        Connect
                                    </button>
                                </div>
                                {(chatuser.personal_email || chatuser.phone_number) && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <span className="font-medium">Contact info:</span>
                                        </div>

                                        {chatuser.personal_email && (
                                            <div className="mt-1.5 text-sm flex items-center text-gray-600">
                                                <a
                                                    href={`mailto:${chatuser.personal_email}`}
                                                    className="flex items-center hover:text-gray-800 transition-colors"
                                                >
                                                    <ExternalLink size={14} className="mr-2" />
                                                    <span>{chatuser.personal_email}</span>
                                                </a>
                                            </div>
                                        )}

                                        {chatuser.phone_number && (
                                            <div className="mt-1.5 text-sm flex items-center text-gray-600">
                                                <a
                                                    href={`tel:${chatuser.phone_number}`}
                                                    className="flex items-center hover:text-gray-800 transition-colors"
                                                >
                                                    <ExternalLink size={14} className="mr-2" />
                                                    <span>{chatuser.phone_number}</span>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Messages - Only show when not minimized */}
                {
                    !isMinimized && (
                        <div
                            ref={chatContainerRef}
                            className="flex-grow overflow-y-auto bg-black px-4 py-2"
                        >
                            {initialLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <p className="text-gray-400">Loading messages...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex justify-center items-center h-full text-gray-400">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                Object.keys(messageGroups).sort().map(dateKey => (
                                    <div key={dateKey} className="mb-4">
                                        <div className="flex justify-center my-4">
                                            <div className="text-xs text-gray-300 bg-gray-800 px-3 py-1 rounded-full">
                                                {getDayLabel(dateKey)}
                                            </div>
                                        </div>
                                        {messageGroups[dateKey].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(msg => (
                                            <div key={msg.id} className="mb-3">
                                                {!isCurrentUserMessage(msg) ? (
                                                    <div className="flex items-start mb-1 group">
                                                        <div className="relative">
                                                            <img
                                                                src={(() => {
                                                                    if (chatuser.profile_image) {
                                                                        const { data: { publicUrl } } = supabase
                                                                            .storage
                                                                            .from("profilepics")
                                                                            .getPublicUrl(chatuser.profile_image);
                                                                        return publicUrl;
                                                                    }
                                                                    return chatuser.role === "admin" ? "./admin.jpeg" : "./profile.png";
                                                                })()}
                                                                className="w-8 h-8 rounded-full mr-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                                alt="Profile"
                                                                onClick={() => setShowUserCard(true)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center mb-0.5">
                                                                <span
                                                                    className="font-medium text-white text-sm mr-2 cursor-pointer hover:text-blue-600 transition-colors"
                                                                    onClick={() => setShowUserCard(true)}
                                                                >
                                                                    {chatuser.full_name}
                                                                </span>
                                                                <span className="text-xs text-gray-400">{formatMessageTime(msg.created_at)}</span>
                                                            </div>
                                                            <div className="bg-gray-800 rounded-xl rounded-tl-none px-3 py-2 text-white max-w-xs sm:max-w-md relative group">
                                                                {msg.content}
                                                                <div className="absolute left-0 -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                                                    <button className="bg-gray-700 rounded-full p-1 hover:bg-gray-600 transition-colors">
                                                                        <Smile className="w-3.5 h-3.5 text-gray-300" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end">
                                                        <div className="flex flex-col items-end max-w-xs sm:max-w-md">
                                                            <div className="flex items-center mb-0.5 justify-end">
                                                                <span className="text-xs text-gray-400 mr-1">{formatMessageTime(msg.created_at)}</span>
                                                                {msg.seen ? (
                                                                    <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                                                                ) : (
                                                                    <Check className="w-3.5 h-3.5 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex group relative">
                                                                {editingMessageId === msg.id ? (
                                                                    <div className="bg-gray-800 border border-gray-600 rounded-xl p-1 min-w-[200px]">
                                                                        <textarea
                                                                            ref={editInputRef}
                                                                            value={editingText}
                                                                            onChange={(e) => setEditingText(e.target.value)}
                                                                            className="w-full p-2 outline-none text-white resize-none bg-transparent rounded-lg"
                                                                            rows={2}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                                    e.preventDefault();
                                                                                    handleSaveEdit();
                                                                                } else if (e.key === 'Escape') {
                                                                                    handleCancelEditing();
                                                                                }
                                                                            }}
                                                                        />
                                                                        <div className="flex justify-end space-x-2 mt-1 px-2 pb-1">
                                                                            <button
                                                                                onClick={handleCancelEditing}
                                                                                className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                            <button
                                                                                onClick={handleSaveEdit}
                                                                                disabled={!editingText.trim()}
                                                                                className={`px-2 py-1 text-xs rounded ${editingText.trim()
                                                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                                                    }`}
                                                                            >
                                                                                Save
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        {/* Message action buttons - Improved visibility */}
                                                                        <div className="absolute right-full mr-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 bg-black/80 p-0.5 rounded-lg shadow-sm">
                                                                            <button
                                                                                onClick={() => handleStartEditing(msg)}
                                                                                className="p-1.5 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                                                                                aria-label="Edit message"
                                                                            >
                                                                                <Edit2 className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteMessage(msg.id)}
                                                                                className="p-1.5 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                                                                                aria-label="Delete message"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                        <div className="absolute left-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center transform translate-y-full pt-1 space-x-1">
                                                                            <button className="bg-gray-700 rounded-full p-1 hover:bg-gray-600 transition-colors">
                                                                                <Smile className="w-3.5 h-3.5 text-gray-300" />
                                                                            </button>
                                                                        </div>
                                                                        <div className="bg-blue-600 text-white rounded-xl rounded-tr-none px-3 py-2 hover:bg-blue-700 transition-colors">
                                                                            {msg.content}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    )
                }

                <ConfirmationAlert isDeleting={isDeleting} isVisible={isVisible} />

                {/* Message Input - Only show when not minimized */}
                {
                    !isMinimized && (
                        <div className="bg-black p-2 border-t border-gray-700 mt-auto">
                            <div className="rounded-lg border border-gray-600 bg-gray-900">
                                <textarea
                                    placeholder="Write a message..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    className="w-full p-3 outline-none text-white placeholder-gray-400 resize-none min-h-[40px] max-h-32 text-sm bg-transparent"
                                    rows={1}
                                />
                                <div className="flex justify-between items-center p-2 border-t border-gray-700">
                                    <div className="flex space-x-1">
                                        <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors relative">
                                            <Image className="w-5 h-5 text-gray-400" />
                                            <div className="absolute bottom-full left-0 mb-2 bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                                                Add image
                                            </div>
                                        </button>
                                        <button className="p-1.5 rounded-full hover:bg-gray-800 transition-colors relative">
                                            <Paperclip className="w-5 h-5 text-gray-400" />
                                            <div className="absolute bottom-full left-0 mb-2 bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                                                Attach file
                                            </div>
                                        </button>
                                        <div className="relative">
                                            <button
                                                className="p-1.5 rounded-full hover:bg-gray-800 transition-colors"
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            >
                                                <Smile className="w-5 h-5 text-gray-400" />
                                            </button>
                                            {showEmojiPicker && (
                                                <div className="absolute bottom-full mb-2 bg-gray-800 rounded-lg shadow-lg border border-gray-600 p-2 w-64 grid grid-cols-7 gap-1">
                                                    {/* Simple emoji picker UI */}
                                                    {['😀', '😂', '😊', '🥰', '😍', '🤔', '😎', '👍', '👏', '❤️', '🎉', '🔥', '💯', '🙏'].map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            className="text-xl hover:bg-gray-700 p-1 rounded"
                                                            onClick={() => {
                                                                setMessageText(prev => prev + emoji);
                                                                setShowEmojiPicker(false);
                                                            }}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!messageText.trim() || isSending}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium ${messageText.trim() && !isSending
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            } transition-colors`}
                                    >
                                        {isSending ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default Chat;
