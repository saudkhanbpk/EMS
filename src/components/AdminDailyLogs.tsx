import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  User,
  Notebook,
  Search,
  MessageCircle,
  Star,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { analyzeMessageForRating } from "../lib/openrouter";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  unread_count?: number;
  monthly_rating?: number;
  overall_rating?: number;
  last_message?: string;
  last_message_time?: string;
}

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
  source?: 'web' | 'slack';
  user?: {
    full_name: string;
    email: string;
  };
}

// Function to format Slack markdown
const formatSlackMarkdown = (text: string) => {
  return text
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>') // *bold*
    .replace(/_([^_]+)_/g, '<em>$1</em>') // _italic_
    .replace(/~([^~]+)~/g, '<del>$1</del>') // ~strikethrough~
    .replace(/`([^`]+)`/g, '<code>$1</code>') // `code`
    .replace(/#([\w-]+)/g, '<span style="color: #0066cc; font-weight: 500;">#$1</span>'); // #channel
};

const AdminDailyLogs: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingRating, setPendingRating] = useState<{
    messageId: string;
    rating: number;
  } | null>(null);
  const [analyzingMessageId, setAnalyzingMessageId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, {
    rating: number;
    reasoning: string;
  }>>({});
  const [showAiSuggestion, setShowAiSuggestion] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unstar' | 'unread' | 'unsent'>('all');
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const user = useAuthStore((state) => state.user);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logs.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [logs]);

  // Auto-scroll to bottom when employee is selected and logs are loaded
  useEffect(() => {
    if (selectedEmployee && logs.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, [selectedEmployee, logs.length]);

  // Additional scroll effect for when loading completes
  useEffect(() => {
    if (!isLoading && selectedEmployee && logs.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [isLoading, selectedEmployee, logs.length]);

  // Fetch all employees and logs
  useEffect(() => {
    fetchEmployees();
    fetchAllLogs();
  }, []);

  // Fetch logs when employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeLogs(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  // AI analysis function
  const analyzeWithAI = async (messageId: string, message: string) => {
    setAnalyzingMessageId(messageId);

    try {
      const suggestion = await analyzeMessageForRating(message);
      setAiSuggestions(prev => ({
        ...prev,
        [messageId]: {
          rating: suggestion.suggestedRating,
          reasoning: suggestion.reasoning
        }
      }));
      setShowAiSuggestion(messageId);
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to get AI suggestion: ${errorMessage}`);
    } finally {
      setAnalyzingMessageId(null);
    }
  };

  // Apply AI suggestion
  const applyAiSuggestion = (messageId: string) => {
    const suggestion = aiSuggestions[messageId];
    if (suggestion) {
      handleRatingClick(messageId, suggestion.rating);
      setShowAiSuggestion(null);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email")
        .not("email", "like", "%@admin.com")
        .order("full_name");

      if (error) {
        console.error("Error fetching employees:", error);
      } else {
        // Fetch additional data for each employee
        const employeesWithStats = await Promise.all(
          (data || []).map(async (employee) => {
            const stats = await fetchEmployeeStats(employee.id);
            return { ...employee, ...stats };
          })
        );
        setEmployees(employeesWithStats);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Fetch all logs for filtering
  const fetchAllLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("dailylog")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching all logs:", error);
      } else {
        setAllLogs(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchEmployeeStats = async (employeeId: string) => {
    try {
      // Get unread count
      const { count: unreadCount } = await supabase
        .from("dailylog")
        .select("*", { count: "exact", head: true })
        .eq("userid", employeeId)
        .eq("sender_type", "employee")
        .eq("is_read", false);

      // Get monthly rating (current month)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-based month
      const startOfCurrentMonth = new Date(
        currentYear,
        currentMonth,
        1
      ).toISOString();
      const startOfNextMonth = new Date(
        currentYear,
        currentMonth + 1,
        1
      ).toISOString();

      const { data: monthlyLogs } = await supabase
        .from("dailylog")
        .select("rating")
        .eq("userid", employeeId)
        .eq("sender_type", "employee")
        .not("rating", "is", null)
        .gte("created_at", startOfCurrentMonth)
        .lt("created_at", startOfNextMonth);

      // Get overall rating
      const { data: allLogs } = await supabase
        .from("dailylog")
        .select("rating")
        .eq("userid", employeeId)
        .eq("sender_type", "employee")
        .not("rating", "is", null);

      const monthlyRating = monthlyLogs?.length
        ? monthlyLogs.reduce((sum, log) => sum + (log.rating || 0), 0) /
        monthlyLogs.length
        : 0;

      const overallRating = allLogs?.length
        ? allLogs.reduce((sum, log) => sum + (log.rating || 0), 0) /
        allLogs.length
        : 0;

      // Get last message from EITHER employee OR admin (most recent)
      const { data: lastMessageData } = await supabase
        .from("dailylog")
        .select("dailylog, created_at, sender_type")
        .or(`userid.eq.${employeeId},admin_id.eq.${employeeId}`)
        .order("created_at", { ascending: false })
        .limit(1);

      // Get first 5 words of last message
      const lastMessage = lastMessageData?.[0]?.dailylog;
      const lastMessagePreview = lastMessage
        ? lastMessage.split(" ").slice(0, 5).join(" ") +
        (lastMessage.split(" ").length > 5 ? "..." : "")
        : "";

      return {
        unread_count: unreadCount || 0,
        last_message: lastMessagePreview,
        last_message_time: lastMessageData?.[0]?.created_at,
        monthly_rating: Math.round(monthlyRating * 10) / 10, // Round to 1 decimal place
        overall_rating: Math.round(overallRating * 10) / 10, // Round to 1 decimal place
      };
    } catch (error) {
      console.error("Error fetching employee stats:", error);
      return {
        unread_count: 0,
        last_message: "",
        last_message_time: "",
        monthly_rating: 0,
        overall_rating: 0,
      };
    }
  };

  // Save Slack messages to database (avoiding duplicates)
  const saveSlackMessagesToDatabase = async (employeeId: string, slackMessages: any[]) => {
    if (!slackMessages || slackMessages.length === 0) return [];

    try {
      // Get existing Slack messages from database for this employee using id_temp field
      const { data: existingSlackLogs, error: fetchError } = await supabase
        .from("dailylog")
        .select("id_temp")
        .eq("userid", employeeId)
        .eq("source", "slack")
        .not("id_temp", "is", null);

      if (fetchError) {
        console.error("Error fetching existing Slack logs:", fetchError);
        return [];
      }

      // Create a Set of existing Slack message IDs to check for duplicates
      const existingSlackIds = new Set(
        existingSlackLogs?.map(log => log.id_temp).filter(Boolean) || []
      );

      // Filter out duplicate messages using client_msg_id as unique identifier
      const newMessages = slackMessages.filter(msg => 
        msg.client_msg_id && !existingSlackIds.has(msg.client_msg_id)
      );

      if (newMessages.length === 0) {
        console.log("No new Slack messages to save");
        return [];
      }

      // Prepare messages for database insertion
      const logsToInsert = newMessages.map(msg => ({
        userid: employeeId,
        dailylog: msg.text,
        sender_type: "employee",
        source: "slack",
        id_temp: msg.client_msg_id, // Store Slack client_msg_id as unique identifier
        created_at: new Date(parseFloat(msg.ts) * 1000).toISOString(),
        is_read: false,
        rating: null,
        reply_to_id: null,
        admin_id: null
      }));

      // Insert new messages
      const { data: insertedLogs, error: insertError } = await supabase
        .from("dailylog")
        .insert(logsToInsert)
        .select();

      if (insertError) {
        console.error("Error inserting Slack messages:", insertError);
        return [];
      }

      console.log(`Successfully saved ${insertedLogs?.length || 0} new Slack messages`);
      return insertedLogs || [];
    } catch (error) {
      console.error("Error saving Slack messages:", error);
      return [];
    }
  };

  // Fetch Slack messages for specific employee
  const fetchSlackMessages = async (employeeId: string) => {
    try {
      // Get employee's slack_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("slack_id")
        .eq("id", employeeId)
        .single();

      if (userError || !userData?.slack_id) {
        console.log("No slack_id found for employee:", employeeId);
        return [];
      }

      console.log("Fetching Slack messages for employee:", userData.slack_id.trim());

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://ems-backend-ax7d.onrender.com';
      const response = await fetch(`${backendUrl}/api/get-slack-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.slack_id.trim(),
          channelId: 'C05TPM3SH8X' // dailylogs channel
        })
      });

      if (!response.ok) {
        console.error("Failed to fetch Slack messages:", response.status);
        return [];
      }

      const data = await response.json();
      console.log("Slack messages fetched:", data.messages?.length || 0);

      if (data.success && data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        // Save new messages to database
        await saveSlackMessagesToDatabase(employeeId, data.messages);
        return data.messages;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching Slack messages:", error);
      return [];
    }
  };

  // Function to sync Slack messages for current employee
  const syncSlackMessages = async () => {
    if (!selectedEmployee) return;
    
    setIsLoading(true);
    try {
      await fetchSlackMessages(selectedEmployee.id);
      await fetchEmployeeLogs(selectedEmployee.id);
      await fetchEmployees();
    } catch (error) {
      console.error('Error syncing Slack messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeLogs = async (employeeId: string) => {
    setIsLoading(true);
    try {
      // Fetch database logs
      const { data: dbLogs, error } = await supabase
        .from("dailylog")
        .select(
          `
          *,
          user:users!dailylog_userid_fkey(full_name, email)
        `
        )
        .or(`userid.eq.${employeeId},admin_id.eq.${employeeId}`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching database logs:", error);
      }

      // Fetch fresh Slack messages
      const slackMessages = await fetchSlackMessages(employeeId);

      // Convert Slack messages to DailyLog format (only if not already in database)
      const formattedSlackMessages = slackMessages
        .filter(msg => {
          // Check if this Slack message is already in database using client_msg_id
          return msg.client_msg_id && !dbLogs?.some(log => 
            log.source === 'slack' && log.id_temp === msg.client_msg_id
          );
        })
        .map((msg: any) => ({
          id: `slack-${msg.client_msg_id}`,
          dailylog: msg.text,
          userid: employeeId,
          created_at: new Date(parseFloat(msg.ts) * 1000).toISOString(),
          sender_type: 'employee',
          source: 'slack',
          is_read: false,
          rating: null,
          user: {
            full_name: selectedEmployee?.full_name || 'Unknown',
            email: selectedEmployee?.email || ''
          }
        }));

      // Combine and sort all messages by timestamp
      const allLogs = [...(dbLogs || []), ...formattedSlackMessages];
      allLogs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setLogs(allLogs);
      // Mark employee messages as read
      await markMessagesAsRead(employeeId);
    } catch (error) {
      console.error("Error:", error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async (employeeId: string) => {
    try {
      await supabase
        .from("dailylog")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("userid", employeeId)
        .eq("sender_type", "employee")
        .eq("is_read", false);

      // Refresh employee list to update unread counts
      fetchEmployees();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleRatingClick = (messageId: string, rating: number) => {
    setPendingRating({ messageId, rating });
    setShowRatingModal(true);
  };

  const confirmRating = async () => {
    if (!pendingRating) return;

    try {
      const logToRate = logs.find(log => log.id === pendingRating.messageId);
      
      if (!logToRate) {
        alert("Message not found. Please try again.");
        return;
      }

      // Check if this is a temporary Slack message (not yet in database)
      if (logToRate.id.startsWith('slack-')) {
        const clientMsgId = logToRate.id.replace('slack-', '');
        
        // First check if this Slack message already exists in database
        const { data: existingLog, error: findError } = await supabase
          .from("dailylog")
          .select("*")
          .eq("userid", logToRate.userid)
          .eq("source", "slack")
          .eq("id_temp", clientMsgId)
          .single();

        if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error("Error finding existing Slack message:", findError);
          alert("Failed to save rating. Please try again.");
          return;
        }

        if (existingLog) {
          // Update existing Slack message with rating
          const { error: updateError } = await supabase
            .from("dailylog")
            .update({
              rating: pendingRating.rating,
              rated_at: new Date().toISOString(),
            })
            .eq("id", existingLog.id);

          if (updateError) {
            console.error("Error updating existing Slack message rating:", updateError);
            alert("Failed to save rating. Please try again.");
            return;
          }

          // Update local state
          setLogs((prev) =>
            prev.map((log) =>
              log.id === pendingRating.messageId
                ? {
                  ...existingLog,
                  rating: pendingRating.rating,
                  rated_at: new Date().toISOString(),
                  user: logToRate.user
                }
                : log
            )
          );
        } else {
          // This is a new temporary Slack message, save it to database with rating
          const { data: savedLog, error: insertError } = await supabase
            .from("dailylog")
            .insert({
              userid: logToRate.userid,
              dailylog: logToRate.dailylog,
              sender_type: 'employee',
              source: 'slack',
              id_temp: clientMsgId,
              created_at: logToRate.created_at,
              is_read: false,
              rating: pendingRating.rating,
              rated_at: new Date().toISOString(),
              reply_to_id: null,
              admin_id: null
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error saving Slack message with rating:", insertError);
            alert("Failed to save rating. Please try again.");
            return;
          }

          // Update local state with the saved log
          setLogs((prev) =>
            prev.map((log) =>
              log.id === pendingRating.messageId
                ? {
                  ...savedLog,
                  user: logToRate.user
                }
                : log
            )
          );
        }
      } else {
        // Regular database message, just update rating
        const { error } = await supabase
          .from("dailylog")
          .update({
            rating: pendingRating.rating,
            rated_at: new Date().toISOString(),
          })
          .eq("id", pendingRating.messageId);

        if (error) {
          console.error("Error rating message:", error);
          alert("Failed to save rating. Please try again.");
          return;
        }

        // Update local state
        setLogs((prev) =>
          prev.map((log) =>
            log.id === pendingRating.messageId
              ? {
                ...log,
                rating: pendingRating.rating,
                rated_at: new Date().toISOString(),
              }
              : log
          )
        );
      }

      // Refresh employee stats
      fetchEmployees();
      setShowRatingModal(false);
      setPendingRating(null);
    } catch (error) {
      console.error("Error rating message:", error);
      alert("Failed to save rating. Please try again.");
    }
  };

  const cancelRating = () => {
    setShowRatingModal(false);
    setPendingRating(null);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedEmployee || !user?.id) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from("dailylog")
        .insert([
          {
            userid: user.id,
            dailylog: replyText.trim(),
            sender_type: "admin",
            admin_id: selectedEmployee.id,
          },
        ])
        .select(
          `
          *,
          user:users!dailylog_userid_fkey(full_name, email)
        `
        )
        .single();

      if (error) {
        console.error("Error sending reply:", error);
        alert("Failed to send reply. Please try again.");
      } else {
        setLogs((prev) => [...prev, data]);
        setReplyText("");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send reply. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const hour = date.getHours();
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;

    return `${day} ${month} ${year} ${displayHour}${ampm}`;
  };


  // Helper function to get date label (Today, Yesterday, or actual date)
  const getDateLabel = (dateString: string) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare only dates
    const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Helper function to group logs by date
  const groupLogsByDate = (logs: DailyLog[]) => {
    const groups: { [key: string]: DailyLog[] } = {};

    logs.forEach(log => {
      const dateKey = new Date(log.created_at).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });

    return groups;
  };

  // Star Display Component with Color Coding - Always shows 5 stars
  const StarDisplay: React.FC<{
    rating: number;
    size?: "sm" | "md" | "lg";
  }> = ({ rating, size = "sm" }) => {
    const getStarColor = (rating: number) => {
      if (rating <= 2) return "text-red-500 fill-red-500";
      if (rating <= 4) return "text-yellow-500 fill-yellow-500";
      return "text-green-500 fill-green-500";
    };

    const getStarSize = (size: string) => {
      switch (size) {
        case "sm":
          return "w-3 h-3";
        case "md":
          return "w-4 h-4";
        case "lg":
          return "w-5 h-5";
        default:
          return "w-3 h-3";
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
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: "50%" }}
            >
              <Star
                className={`${getStarSize(size)} ${getStarColor(rating)}`}
              />
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

  const StarRating: React.FC<{
    messageId: string;
    currentRating?: number;
    onRate: (messageId: string, rating: number) => void;
  }> = ({ messageId, currentRating, onRate }) => {
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);

    return (
      <div className="flex items-center space-x-1 mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(messageId, star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(null)}
            className="transition-colors duration-150 hover:scale-110"
          >
            <Star
              className={`w-4 h-4 ${star <= (hoveredStar || currentRating || 0)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300 hover:text-yellow-200"
                }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Filter employees based on active filter
  const getFilteredEmployees = () => {
    const today = new Date().toISOString().split('T')[0];

    return employees.filter((employee) => {
      // First apply search filter
      const matchesSearch = employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const employeeLogs = allLogs.filter(log => log.userid === employee.id && log.sender_type === 'employee');
      const lastEmployeeLog = employeeLogs[0]; // Most recent log

      switch (activeFilter) {
        case 'all':
          return true;

        case 'unstar':
          // Show if admin hasn't assigned rating to the last log
          return lastEmployeeLog && !lastEmployeeLog.rating;

        case 'unread':
          // Show if person has not read the log (admin messages to this employee)
          const adminLogsToEmployee = allLogs.filter(log =>
            log.admin_id === employee.id && log.sender_type === 'admin' && !log.is_read
          );
          return adminLogsToEmployee.length > 0;

        case 'unsent':
          // Show if person hasn't sent log today
          const todayLogs = employeeLogs.filter(log =>
            log.created_at.split('T')[0] === today
          );
          return todayLogs.length === 0;

        default:
          return true;
      }
    }).sort((a, b) => {
      // Sort by unread messages first (employees with unread messages at top)
      const aHasUnread = (a.unread_count || 0) > 0;
      const bHasUnread = (b.unread_count || 0) > 0;

      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;

      if (aHasUnread && bHasUnread) {
        return (b.unread_count || 0) - (a.unread_count || 0);
      }

      return a.full_name.localeCompare(b.full_name);
    });
  };

  const filteredEmployees = getFilteredEmployees();

  return (
    <>
      {/* Rating Confirmation Modal */}
      {showRatingModal && pendingRating && (
        <div className="fixed inset-0  bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Rating
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to rate this message with{" "}
              {pendingRating.rating} star{pendingRating.rating !== 1 ? "s" : ""}
              ?
            </p>
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 mx-1 ${star <= pendingRating.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                    }`}
                />
              ))}
            </div>
            <div className="flex space-x-3 ">
              <button
                onClick={cancelRating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Navbar - Always visible */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${activeFilter === 'all'
                ? 'bg-gray-800 text-white shadow-md transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline sm:inline">All</span>
            </button>

            <button
              onClick={() => setActiveFilter('unstar')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${activeFilter === 'unstar'
                ? 'bg-yellow-500 text-white shadow-md transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700'
                }`}
            >
              <Star className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline sm:inline">Unstar</span>
            </button>

            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${activeFilter === 'unread'
                ? 'bg-blue-500 text-white shadow-md transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                }`}
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline sm:inline">Unread</span>
            </button>

            <button
              onClick={() => setActiveFilter('unsent')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${activeFilter === 'unsent'
                ? 'bg-red-500 text-white shadow-md transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                }`}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline sm:inline">Unsent</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-50">
        {/* Employee List Sidebar - Fixed height with internal scroll */}
        <div
          className={`${selectedEmployee ? "hidden sm:flex" : "flex"
            } flex-col w-full sm:w-[300px] md:w-[320px] lg:w-[350px] xl:w-[380px] bg-white border-r border-gray-300`}
        >
          {/* Fixed Header */}
          <div className="flex-none p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3 justify-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Notebook className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Daily Logs
                </h1>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
              />
            </div>
          </div>

          {/* Scrollable Employee List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No employees found</p>
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-all duration-200 ${selectedEmployee?.id === employee.id
                    ? "bg-blue-100 border-blue-300 shadow-sm"
                    : "hover:shadow-sm"
                    }`}
                >
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedEmployee?.id === employee.id
                        ? "bg-blue-600"
                        : "bg-gradient-to-r from-gray-400 to-gray-500"
                        }`}
                    >
                      <User className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 ">
                      <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {employee.full_name}
                      </p>

                      {/* Last Message Preview - In front of username */}
                      {/* {employee.last_message && (
                        <p className="text-xs text-gray-600 truncate mb-1 italic">
                          "{employee.last_message}"
                        </p>
                      )} */}

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-blue-700 font-medium">
                            Monthly:
                          </span>
                          <StarDisplay
                            rating={employee.monthly_rating || 0}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-700 font-medium">
                            Overall:
                          </span>
                          <StarDisplay
                            rating={employee.overall_rating || 0}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* {employee.last_message && (
                      <p className="text-xs text-gray-600 truncate mb-1 italic">
                        "{employee.last_message}"
                      </p>
                    )} */}

                    {/* Message Icon with Unread Count */}
                    <div className="relative">
                      {employee.unread_count && employee.unread_count > 0 ? (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none shadow-md animate-pulse">
                          {employee.unread_count}
                        </span>
                      ) : (
                        ""
                      )}
                      <MessageCircle
                        className={`w-5 h-5 ${selectedEmployee?.id === employee.id
                          ? "text-blue-600"
                          : "text-gray-400"
                          }`}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area - Fixed height with internal scroll for messages */}
        <div
          className={`${selectedEmployee ? "flex" : "hidden sm:flex"
            } flex-col flex-1 h-full`}
        >
          {selectedEmployee ? (
            <>
              {/* Fixed Chat Header */}
              <div className="flex-none bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center">
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="sm:hidden p-2 mr-2 text-gray-600 hover:text-gray-900"
                    aria-label="Back to chat list"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 ms-10 md:ms-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <div className="flex items-center flex-1 min-w-0 space-x-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold text-gray-900 truncate">
                        {selectedEmployee.full_name}
                      </h2>
                      <p className="text-xs text-gray-500">
                        Daily Logs Conversation
                      </p>
                    </div>

                    {/* Sync Slack Messages Button */}
                    <button
                      onClick={syncSlackMessages}
                      disabled={isLoading}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                      title="Sync Slack Messages"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Sync Slack</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Messages Area */}
              <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 bg-gray-50">
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No daily logs yet from this employee.
                    </p>
                  </div>) : (
                  (() => {
                    const groupedLogs = groupLogsByDate(logs);
                    const sortedDates = Object.keys(groupedLogs).sort((a, b) =>
                      new Date(a).getTime() - new Date(b).getTime()
                    );

                    return sortedDates.map(dateKey => (
                      <div key={dateKey}>
                        {/* Date Header */}
                        <div className="flex justify-center my-6">
                          <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                            {getDateLabel(groupedLogs[dateKey][0].created_at)}
                          </div>
                        </div>

                        {/* Messages for this date */}
                        <div className="space-y-4">
                          {groupedLogs[dateKey].map((log) => {
                            const isAdmin = log.sender_type === "admin";
                            return (
                              <div
                                key={log.id}
                                className={`flex ${isAdmin ? "justify-end" : "justify-start"
                                  }`}
                              >
                                <div
                                  className={`flex items-start space-x-2 max-w-xs sm:max-w-sm lg:max-w-md ${isAdmin ? "flex-row-reverse space-x-reverse" : ""
                                    }`}
                                >
                                  {/* Avatar */}
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? "bg-green-600" : "bg-blue-600"
                                      }`}
                                  >
                                    <User className="w-4 h-4 text-white" />
                                  </div>

                                  {/* Message Bubble */}
                                  <div
                                    className={`rounded-2xl px-4 py-2 ${isAdmin
                                      ? "bg-green-600 text-white"
                                      : "bg-white text-gray-800 shadow-sm border border-gray-200"
                                      }`}
                                  >
                                    <div
                                      className="text-sm whitespace-pre-wrap"
                                      dangerouslySetInnerHTML={{ __html: formatSlackMarkdown(log.dailylog) }}
                                    />
                                    <p
                                      className={`text-xs mt-1 ${isAdmin ? "text-green-100" : "text-gray-500"
                                        }`}
                                    >
                                      {formatTime(log.created_at)}
                                    </p>

                                    {!isAdmin && log.source === 'slack' && (
                                      <div className="text-xs text-blue-600 font-medium mb-1 flex items-center space-x-1">
                                        <MessageCircle className="w-3 h-3" />
                                        <span>via Slack</span>
                                      </div>
                                    )}

                                    {/* Star Rating and AI Analysis for Employee Messages */}
                                    {!isAdmin && (
                                      <div className="space-y-2">
                                        {/* Show rating for all employee messages */}
                                        <StarRating
                                          messageId={log.id}
                                          currentRating={log.rating}
                                          onRate={handleRatingClick}
                                        />

                                        {/* AI Analysis Button - Show for all messages including Slack */}
                                        {!log.rating && (
                                          <button
                                            onClick={() => analyzeWithAI(log.id, log.dailylog)}
                                            disabled={analyzingMessageId === log.id}
                                            className="flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors mt-2"
                                          >
                                            {analyzingMessageId === log.id ? (
                                              <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                                <span>Analyzing...</span>
                                              </>
                                            ) : (
                                              <>
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>Analyze with AI</span>
                                              </>
                                            )}
                                          </button>
                                        )}

                                        {/* Show AI suggestion indicator if already analyzed but not showing */}
                                        {aiSuggestions[log.id] && showAiSuggestion !== log.id && !log.rating && (
                                          <button
                                            onClick={() => setShowAiSuggestion(log.id)}
                                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 mt-1"
                                          >
                                            <Sparkles className="w-3 h-3" />
                                            <span>View AI suggestion</span>
                                          </button>
                                        )}

                                        {/* AI Suggestion Display */}
                                        {showAiSuggestion === log.id && aiSuggestions[log.id] && (
                                          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-start space-x-2">
                                              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                              <div className="flex-1">
                                                <p className="text-xs font-medium text-blue-900 mb-1">
                                                  AI Suggestion: {aiSuggestions[log.id].rating} stars
                                                </p>
                                                <p className="text-xs text-blue-700 mb-2">
                                                  {aiSuggestions[log.id].reasoning}
                                                </p>
                                                <div className="flex space-x-2">
                                                  <button
                                                    onClick={() => applyAiSuggestion(log.id)}
                                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                                  >
                                                    Apply Rating
                                                  </button>
                                                  <button
                                                    onClick={() => setShowAiSuggestion(null)}
                                                    className="text-xs text-blue-600 hover:text-blue-700"
                                                  >
                                                    Dismiss
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Fixed Reply Input */}
              <div className="flex-none bg-white border-t border-gray-200 p-4">
                <div className="flex items-end space-x-2">
                  <textarea
                    ref={replyInputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim() || isSending}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Employee Selected - Content Area */
            <div className="flex flex-1 items-center justify-center bg-gray-50 p-8">
              <div className="text-center max-w-md mx-auto">
                {activeFilter === 'all' && (
                  <>
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      All Employees
                    </h3>
                    <p className="text-gray-600">
                      View all employees in your organization. Select an employee to view their daily logs and send messages.
                    </p>
                  </>
                )}

                {activeFilter === 'unstar' && (
                  <>
                    <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Unrated Logs
                    </h3>
                    <p className="text-gray-600">
                      Employees whose latest logs haven't been rated yet. Select an employee to review and rate their work.
                    </p>
                  </>
                )}

                {activeFilter === 'unread' && (
                  <>
                    <MessageCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Unread Messages
                    </h3>
                    <p className="text-gray-600">
                      Employees who haven't read your admin messages yet. Select an employee to follow up.
                    </p>
                  </>
                )}

                {activeFilter === 'unsent' && (
                  <>
                    <Send className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Logs Today
                    </h3>
                    <p className="text-gray-600">
                      Employees who haven't submitted their daily logs today. Select an employee to send a reminder.
                    </p>
                  </>
                )}

                {filteredEmployees.length === 0 && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700 font-medium">
                      🎉 All caught up! No employees in this category.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDailyLogs;
