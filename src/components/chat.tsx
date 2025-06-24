import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion } from "framer-motion";
import {
  User,
  Search,
  MoreVertical,
  PinIcon,
  LayoutDashboard,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../lib/store";
import { useUserContext } from "../lib/userprovider";
import {
  getonecountmsg,
  getUnseenMessageCount,
} from "./chatlib/supabasefunc";
import { supabase } from "../lib/supabase";

interface ChatUserItemProps {
  chatUser: any;
  currentUser: any;
  onMessageCountChange: (userId: string, count: number) => void;
  openchatperson: (id: string) => void;
}

const ChatUserItem: React.FC<ChatUserItemProps> = ({
  chatUser,
  currentUser,
  onMessageCountChange,
  openchatperson
}) => {
  const [messageCount, setMessageCount] = useState(0);

  const fetchMessageCount = useCallback(async () => {
    try {
      const count = await getonecountmsg(currentUser.id, chatUser.id);
      setMessageCount(count);
      onMessageCountChange(chatUser.id, count);
    } catch (error) {
      console.error("Error fetching message count:", error);
      setMessageCount(0);
      onMessageCountChange(chatUser.id, 0);
    }
  }, [currentUser.id, chatUser.id, onMessageCountChange]);

  const handleNewMessage = useCallback(
    (payload: any) => {
      if (!payload.new.seen) {
        setMessageCount((prevCount) => {
          const newCount = prevCount + 1;
          onMessageCountChange(chatUser.id, newCount);
          return newCount;
        });
      }
    },
    [chatUser.id, onMessageCountChange]
  );

  const handleMessageUpdate = useCallback(
    (payload: any) => {
      if (payload.new.seen !== payload.old.seen) {
        fetchMessageCount();
      }
    },
    [fetchMessageCount]
  );

  useEffect(() => {
    fetchMessageCount();

    const channel = supabase
      .channel(`message-count-${currentUser.id}-${chatUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `reciever_id=eq.${currentUser.id} AND sender_id=eq.${chatUser.id}`,
        },
        handleNewMessage
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `reciever_id=eq.${currentUser.id} AND sender_id=eq.${chatUser.id}`,
        },
        handleMessageUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    currentUser.id,
    chatUser.id,
    fetchMessageCount,
    handleNewMessage,
    handleMessageUpdate,
  ]);

  return (

    <div onClick={() => openchatperson(chatUser.id)} className="flex items-center p-4 hover:bg-gray-900 cursor-pointer transition-colors duration-200 relative">
      {chatUser.role === "admin" && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
          <PinIcon className="w-4 h-4" fill="white" />
        </div>
      )}
      <div className="relative mr-4">
        <img
          // Option 1: Inline approach
          src={(() => {
            if (chatUser.profile_image) {
              const { data: { publicUrl } } = supabase
                .storage
                .from("profilepics")
                .getPublicUrl(chatUser.profile_image);
              return publicUrl;
            }
            return chatUser.role === "admin" ? "./admin.jpeg" : "./profile.png";
          })()}
          alt={chatUser.full_name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {messageCount > 0 && (
          <div className="absolute -top-1 -right-1">
            <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white">
              {messageCount > 99 ? "99+" : messageCount}
            </div>
          </div>
        )}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-white flex items-center">
            {chatUser.full_name}
            {chatUser.role === "admin" && (
              <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </h3>
        </div>
        <p className="text-xs text-gray-400 truncate">Tap to chat</p>
      </div>
      <MoreVertical className="w-5 h-5 text-gray-500 ml-2" />
    </div>

  );
};

const MemoizedChatUserItem = React.memo(ChatUserItem);

const ChatSidebar = ({ closechat, openchatperson }) => {
  const { chatUsers } = useUserContext();
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  console.log("the chat user is", chatUsers)
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalUnseenCount, setTotalUnseenCount] = useState(0);
  const [userMessageCounts, setUserMessageCounts] = useState<
    Record<string, number>
  >({});
  const sidebarRef = useRef<HTMLDivElement | null>(null); // <--- ref for click-outside

  const fetchTotalCount = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const count = await getUnseenMessageCount(currentUser.id);
      setTotalUnseenCount(count);
    } catch (error) {
      console.error("Error fetching total unseen count:", error);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchTotalCount();

    const channel = supabase
      .channel(`total-messages-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `reciever_id=eq.${currentUser.id}`,
        },
        fetchTotalCount
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, fetchTotalCount]);

  const handleMessageCountChange = useCallback(
    (userId: string, count: number) => {
      setUserMessageCounts((prev) => {
        if (prev[userId] === count) return prev;
        return {
          ...prev,
          [userId]: count,
        };
      });
    },
    []
  );

  const filteredChatUsers = useMemo(() => {
    return chatUsers.filter((chatUser) => chatUser.id !== currentUser?.id);
  }, [chatUsers, currentUser?.id]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(
        filteredChatUsers.filter((chatUser) =>
          chatUser.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(filteredChatUsers);
    }
  }, [searchTerm, filteredChatUsers]);

  const sortUsers = useCallback(
    (users: any[]) => {
      return [...users].sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (b.role === "admin" && a.role !== "admin") return 1;

        const aHasMessages = (userMessageCounts[a.id] || 0) > 0;
        const bHasMessages = (userMessageCounts[b.id] || 0) > 0;

        if (aHasMessages && !bHasMessages) return -1;
        if (!aHasMessages && bHasMessages) return 1;

        if (aHasMessages && bHasMessages) {
          return (
            (userMessageCounts[b.id] || 0) - (userMessageCounts[a.id] || 0)
          );
        }

        return a.full_name.localeCompare(b.full_name);
      });
    },
    [userMessageCounts]
  );

  const sortedUsers = useMemo(() => {
    const usersToSort = searchTerm === "" ? filteredChatUsers : filteredUsers;
    return sortUsers(usersToSort);
  }, [searchTerm, filteredChatUsers, filteredUsers, sortUsers]);

  // ✅ CLOSE ON CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {

      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        closechat();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navigate, closechat]);

  return (
    <motion.div
      ref={sidebarRef}
      initial={{
        x: "calc(100% - 80px)", // Position at chat button location (16px margin + 64px button width)
        y: "calc(100vh - 7rem - 80px)", // Position at bottom where chat button is
        scale: 0,
        opacity: 0,
        transformOrigin: "bottom right"
      }}
      animate={{
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        transformOrigin: "bottom right"
      }}
      exit={{
        x: "calc(100% - 80px)",
        y: "calc(100vh - 7rem - 80px)",
        scale: 0,
        opacity: 0,
        transformOrigin: "bottom right"
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.3 }
      }}
      className="fixed md:top-32 right-0 w-full max-w-xs bg-black border-l border-gray-800 md:h-[calc(100vh-8rem)] h-full flex flex-col z-50 overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <User className="w-6 h-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Chats</h2>
        </div>
        <div className="flex items-center space-x-3">

          <div className="relative">

            <button onClick={() => closechat()} >
              <X className="text-white hover:text-blue-400 transition-colors text-xl" />
            </button>

            {totalUnseenCount > 0 && (
              <div className="absolute -top-1 -right-1">
                <div className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {totalUnseenCount > 99 ? "99+" : totalUnseenCount}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search contacts"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto divide-y divide-gray-800">
        {sortedUsers.length > 0 ? (
          sortedUsers.map((chatUser) => (
            <MemoizedChatUserItem
              key={chatUser.id}
              chatUser={chatUser}
              currentUser={currentUser}
              onMessageCountChange={handleMessageCountChange}
              openchatperson={openchatperson}
            />
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            No contacts found
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatSidebar;