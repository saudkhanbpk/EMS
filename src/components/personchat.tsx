
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical, Trash2, Check,CheckCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useUserContext } from '../lib/userprovider';
import { deleteMessage, fetchChatMessages, markMessagesAsSeen, sendMessage } from './chatlib/supabasefunc';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import ConfirmationAlert from './confirmdelete';
import { isValid, set } from 'date-fns';

const Chat = () => {
    let { id } = useParams();
    const { chatUsers } = useUserContext();
    let chatuser = chatUsers.find((user) => user.id == id);
    const [isVisible, setIsVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const currentuser = useAuthStore((state) => state.user);
    
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    // Create a reference to the chat container
    const chatContainerRef = useRef(null);

    // Scroll to the bottom of the chat container
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };
 
    // Scroll to the bottom whenever messages change or when the component mounts
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Format the timestamp for display
    const formatMessageTime = (timestamp) => {
        const now = new Date();
        const messageDate = new Date(timestamp);
        
        // Format time (HH:MM)
        const hours = messageDate.getHours().toString().padStart(2, '0');
        const minutes = messageDate.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        
        // If the message is not from today, also display the date
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

    // Get status text or icon based on message status
    const getMessageStatus = (status) => {
        switch (status) {
            case 'sent':
                return (
                    <span className="text-xs font-light flex items-center">
                        <span className="mr-1">Sent</span>
                        <Check className="w-3 h-3" />
                    </span>
                );
            case 'seen':
                return (
                    <span className="text-xs font-light flex items-center">
                        <span className="mr-1">Seen</span>
                        <Check className="w-3 h-3" />
                    </span>
                );
            default:
                return null;
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        
        try {
            const sentMessage = await sendMessage(currentuser?.id, chatuser.id, messageText);
            
            // Add the new message to the existing messages array
            // if (sentMessage && sentMessage.length > 0) {
            //     setMessages(prevMessages => [...prevMessages, sentMessage[0]]);
            // }
            
            // Clear the input field
            setMessageText("");
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Function to delete a message
    const handleDeleteMessage = async(id:unknown) => {
        setIsVisible(true)
        setIsDeleting(true)
        await deleteMessage(id);
        setMessages(messages.filter(msg => msg.id !== id));
        setIsDeleting(false)
        setTimeout(() => {
            setIsVisible(false);
          }, 700);
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await fetchChatMessages(currentuser?.id, chatuser.id);
            setMessages(data || []);
    
       
           
               
            
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
         markMessagesAsSeen(currentuser?.id, chatuser.id);
    
     
    }, [messages])
    
    
    useEffect(() => {
        if (!currentuser?.id || !chatuser?.id) return;
    
        loadMessages();
    
        const channel = supabase
            .channel(`chat-messages-${currentuser?.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                async (payload) => {
                    console.log("Realtime payload received:", payload);
    
                    if (payload.eventType === 'INSERT') {
                        setMessages((prevMessages) => [...prevMessages, payload.new]);
    
                        // If a new message is received from the chat user, mark it as seen
                        if (payload.new.sender_id === chatuser.id) {
                            await markMessagesAsSeen(currentuser.id, chatuser.id, setMessages);
                        }
                    }
                    
    
                    if (payload.eventType === 'UPDATE') {
                        setMessages((prevMessages) =>
                            prevMessages.map((msg) =>
                                msg.id === payload.new.id ? payload.new : msg
                            )
                        );
                    }
                    
                    if (payload.eventType === 'DELETE') {
                        setMessages((prevMessages) =>
                            prevMessages.filter((msg) => msg.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe();
    
        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentuser?.id, chatuser?.id]);
    
    
    
      
  
    // Determine if a message is from the current user
    const isCurrentUserMessage = (msg) => {
        return msg.sender_id === currentuser?.id;
    };
if(!chatuser){
    return   <div className="flex justify-center items-center h-full text-gray-500">
    <p className='text-3xl'>No user found </p>
</div>
}
if(chatuser.id==currentuser?.id){
    return   <div className="flex justify-center items-center h-full text-gray-500">
    <p className='text-3xl' >You can't chat to yourself sorry!</p>
</div>
}
    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Chat Header */}
            <div className="bg-white p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <span className="text-3xl">
                            <img 
                                className='h-[36px]' 
                                src={`${chatuser.role == "admin" ? "/admin.jpeg" : "/profile.png"}`} 
                                alt="profile image" 
                            />
                        </span>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-800">Chat with {chatuser?.full_name}</h2>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <MoreVertical className="w-5 h-5 text-gray-600 cursor-pointer" />
                </div>
            </div>

            {/* Chat Messages */}
            <div 
                ref={chatContainerRef}
                className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#E6E6FA]"
            >
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <p>Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-500">
                        <p >No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex ${isCurrentUserMessage(msg) ? 'justify-end' : 'justify-start'}`}
                        >
                            <div 
                                className={`
                                    relative max-w-xs p-3 rounded-lg group
                                    ${isCurrentUserMessage(msg) 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-white text-gray-800 border'}
                                `}
                            >
                                <div className="mb-1">{msg.content}</div>
                                
                                {/* Time and status information */}
                                <div className={`flex items-center justify-between mt-1 ${isCurrentUserMessage(msg) ? 'text-blue-100' : 'text-gray-500'}`}>
                                    <span className="text-xs">{formatMessageTime(msg.created_at)}</span>
                                    {isCurrentUserMessage(msg) && (
                                        <div className="flex items-center">
                                            {msg.seen?   <CheckCheck className="w-4 h-4 mr-1" />
                                           : <Check className="w-4 h-4" />}
                                         
                                        </div>
                                    )}
                                    {isCurrentUserMessage(msg) && (
                                        <span className="ml-2">{getMessageStatus(msg.status)}</span>
                                    )}
                                </div>
                                
                                {/* Delete button - only visible for user's own messages */}
                                {isCurrentUserMessage(msg) && (
                                    <button 
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="absolute -left-8 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                                        aria-label="Delete message"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
<ConfirmationAlert isDeleting={isDeleting} isVisible={isVisible} ></ConfirmationAlert>
            {/* Message Input */}
            <div className="bg-white p-4 flex items-center space-x-4 border-t">
                <Paperclip className="w-6 h-6 text-gray-600 cursor-pointer" />
                <div className="flex-grow">
                    <input 
                        type="text"
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button 
                    onClick={handleSendMessage}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Chat;
