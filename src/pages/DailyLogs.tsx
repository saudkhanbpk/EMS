import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Notebook, Star } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';

interface DailyLog {
  id: string;
  dailylog: string;
  userid: string;
  created_at: string;
  sender_type?: string;
  reply_to_id?: string;
  admin_id?: string;
  rating?: number;
  is_read?: boolean;
  rated_at?: string;
  read_at?: string;
}

const DailyLogs: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const user = useAuthStore((state) => state.user);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    fetchLogs();
  }, []);

  // Fetch existing logs from Supabase (including admin replies)
  const fetchLogs = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dailylog')
        .select('*')
        .or(`userid.eq.${user.id},admin_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching logs:', error);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save new log to Supabase
  const handleSendMessage = async () => {
    if (!inputText.trim() || !user?.id) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('dailylog')
        .insert([
          {
            userid: user.id,
            dailylog: inputText.trim(),
            sender_type: 'employee'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving log:', error);
        alert('Failed to save log. Please try again.');
      } else {
        // Add the new log to the local state
        setLogs(prev => [...prev, data]);
        setInputText('');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save log. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Star Display Component with Color Coding - Always shows 5 stars
  const StarDisplay: React.FC<{
    rating: number;
    size?: 'sm' | 'md' | 'lg';
  }> = ({ rating, size = 'sm' }) => {
    const getStarColor = (rating: number) => {
      if (rating <= 2) return 'text-red-400 fill-red-400';
      if (rating <= 4) return 'text-yellow-400 fill-yellow-400';
      return 'text-green-400 fill-green-400';
    };

    const getStarSize = (size: string) => {
      switch (size) {
        case 'sm': return 'w-3 h-3';
        case 'md': return 'w-4 h-4';
        case 'lg': return 'w-5 h-5';
        default: return 'w-3 h-3';
      }
    };

    const filledStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - filledStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center space-x-0.5">
        {/* Filled Stars */}
        {[...Array(filledStars)].map((_, index) => (
          <Star
            key={`filled-${index}`}
            className={`${getStarSize(size)} ${getStarColor(rating)}`}
          />
        ))}

        {/* Half Star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${getStarSize(size)} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${getStarSize(size)} ${getStarColor(rating)}`} />
            </div>
          </div>
        )}

        {/* Empty Stars - Always show remaining stars as empty */}
        {[...Array(emptyStars)].map((_, index) => (
          <Star
            key={`empty-${index}`}
            className={`${getStarSize(size)} text-gray-300`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Notebook className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Daily Logs</h1>
            <p className="text-sm text-gray-500">
              {user?.email ? `Send your daily updates to your boss` : 'Send your daily updates'}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Logs Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <Notebook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No daily logs yet. Start by sending your first update!</p>
          </div>
        ) : (
          logs.map((log) => {
            const isAdmin = log.sender_type === 'admin';
            return (
              <div key={log.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex items-start space-x-2 max-w-xs sm:max-w-sm lg:max-w-md ${
                  isAdmin ? '' : 'flex-row-reverse space-x-reverse'
                }`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isAdmin ? 'bg-green-600' : 'bg-blue-600'
                  }`}>
                    <User className="w-4 h-4 text-white" />
                  </div>

                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-2 ${
                    isAdmin
                      ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {isAdmin && (
                      <p className="text-xs text-green-600 font-medium mb-1">Admin Reply</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{log.dailylog}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        isAdmin ? 'text-gray-500' : 'text-blue-100'
                      }`}>
                        {formatTime(log.created_at)}
                      </p>

                      {/* Show rating for employee messages */}
                      {!isAdmin && log.rating && (
                        <div className="flex items-center space-x-1">
                          <StarDisplay rating={log.rating} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your daily update here..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="md:w-4 md:h-4 w-2 h-2" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyLogs;
