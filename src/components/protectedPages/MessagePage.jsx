import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useApp, api } from "../../context/Appcontext.jsx";
import { Phone, Video, Send, Search, MoreVertical, Paperclip, Smile, Check, CheckCheck, Image as ImageIcon, Plus, ArrowLeft, Shield, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, isYesterday, differenceInMinutes } from "date-fns";
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export function MessagesPage() {

  const { currentUser, users } = useApp();
  const socketRef = useRef(null);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeatureWarning, setShowFeatureWarning] = useState(true);
  const [pendingMessages, setPendingMessages] = useState(new Map());
  const [showError, setShowError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasInitialized = useRef(false);
  const hasAutoSelected = useRef(false);
  const messageContainerRef = useRef(null);
  const pendingMessageIdRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser?._id) return;

    socketRef.current = io(SOCKET_URL, {
      query: { userId: currentUser._id },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on("receiveMessage", (data) => {
      // Always update conversation list so new chats appear
      setConversations(prev => {
        const exists = prev.find(c => c.userId === data.senderId || c.userId?.toString() === data.senderId?.toString());
        if (exists) {
          return prev.map(c =>
            (c.userId === data.senderId || c.userId?.toString() === data.senderId?.toString())
              ? { ...c, lastMessage: data.message, timestamp: new Date(data.timestamp) }
              : c
          );
        }
        // New conversation from someone — add it to the list
        return [{
          id: data.senderId,
          userId: data.senderId,
          username: data.senderUsername || "Unknown",
          profilePic: data.senderProfilePic || null,
          lastMessage: data.message,
          timestamp: new Date(data.timestamp),
          unread: 1,
          isOnline: true,
        }, ...prev];
      });

      // Only append to messages if this conversation is currently open
      setSelectedConversation(current => {
        if (current && (current.userId === data.senderId || current.userId?.toString() === data.senderId?.toString())) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            senderId: data.senderId,
            senderName: current.username,
            content: data.message,
            timestamp: new Date(data.timestamp),
            isOwn: false,
            read: true,
          }]);
        }
        return current; // don't change selectedConversation
      });
    });

    // Listen for message delivery confirmation
    socketRef.current.on("messageDelivered", (data) => {
      pendingMessageIdRef.current = null;
      setPendingMessages((prev) => {
        const updated = new Map(prev);
        updated.delete(data.messageId);
        return updated;
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, read: true, isPending: false }
            : msg
        )
      );
    });

    // Listen for message send error (receiver offline — message still saved in DB)
    socketRef.current.on("messageSendError", (data) => {
      pendingMessageIdRef.current = null;
      setPendingMessages((prev) => {
        const updated = new Map(prev);
        updated.delete(data.messageId);
        return updated;
      });
      // Message is already saved in DB via REST API — just mark it as sent, not delivered
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, isPending: false, read: false } : msg
        )
      );
      setSendingMessage(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
}, [currentUser?._id, selectedConversation]);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUser?._id) return;
    setIsLoading(true);
    try {
      const response = await api.get('/messages/conversations');
      
      // Transform conversations to match UI format
      const transformedConversations = response.data.map((conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id !== currentUser._id
        );
        const lastMessage = conv.messages[0];
        
        return {
          id: otherUser._id,
          userId: otherUser._id,
          username: otherUser.username,
          profilePic: otherUser.profilePic,
          lastMessage: lastMessage?.message || "No messages yet",
          timestamp: lastMessage?.createdAt || new Date(),
          unread: 0,
          isOnline: onlineUsers.includes(otherUser._id),
        };
      });
      
      setConversations(transformedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?._id, onlineUsers]);

  // Fetch messages for selected conversation
  const loadMessagesForConversation = useCallback(
    async (conversation) => {
      if (!currentUser?._id) return;

      setIsLoading(true);
      try {
        // Ensure userId is properly converted to string
        const userId = conversation.userId.toString ? conversation.userId.toString() : conversation.userId;
        const response = await api.get(`/messages/${userId}`);

        const transformedMessages = response.data.map((msg) => ({
          id: msg._id,
          senderId: msg.senderId._id,
          senderName: msg.senderId.username,
          content: msg.message,
          timestamp: new Date(msg.createdAt),
          isOwn: msg.senderId._id.toString ? msg.senderId._id.toString() === currentUser._id.toString() : msg.senderId._id === currentUser._id,
          read: true,
        }));

        setMessages(transformedMessages);
      } catch (error) {
        console.error("Error loading messages:", error);
        if (error.response?.status === 403) {
          alert("You can only message users you are following");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser?._id]
  );

  // Auto-fetch conversations on mount
  useEffect(() => {
    if (!hasInitialized.current && currentUser?._id) {
      fetchConversations();
      hasInitialized.current = true;
    }
  }, [currentUser?._id, fetchConversations]);

  // Auto-select first conversation only on initial load, not after user navigates back
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation && !hasAutoSelected.current) {
      hasAutoSelected.current = true;
      const firstConv = conversations[0];
      setSelectedConversation(firstConv);
      loadMessagesForConversation(firstConv);
    }
  }, [conversations, selectedConversation, loadMessagesForConversation]);

  // Smooth scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Add scroll effect to message container
  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isNearBottom) {
          // Auto-scroll styling can be applied here
        }
      };
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) =>
      conv.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const messageGroups = useMemo(() => {
    const groups = [];
    let currentDate = null;
    let currentGroup = null;

    messages.forEach((message) => {
      const dateObj = new Date(message.timestamp);
      const messageDate = format(dateObj, "MMM d, yyyy");

      if (messageDate !== currentDate) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentDate = messageDate;

        let dateLabel = messageDate;
        if (isToday(dateObj)) dateLabel = "Today";
        else if (isYesterday(dateObj)) dateLabel = "Yesterday";

        currentGroup = {
          date: dateLabel,
          messages: [message],
        };
      } else {
        currentGroup.messages.push(message);
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (messageInput.trim() && selectedConversation && currentUser) {
      if (sendingMessage) return; // Prevent double submissions
      
      const messageId = Date.now().toString();
      const messageContent = messageInput.trim(); // Store message content before clearing
      setSendingMessage(true);
      setShowError(null);

      try {
        // Send message via API
        const response = await api.post('/messages/send', {
          receiverId: selectedConversation.userId,
          message: messageContent,
        });

        // Create message - API confirmed it was saved, so mark as delivered
        const newMessage = {
          id: messageId,
          senderId: currentUser._id,
          senderName: currentUser.username,
          content: messageContent,
          timestamp: new Date(),
          isOwn: true,
          read: false,
          isPending: false, // Message is already saved in DB via API
        };

        // Add message to UI immediately
        setMessages((prev) => [...prev, newMessage]);
        setMessageInput("");
        setIsTyping(false);

        // Send via socket for real-time notification to receiver
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("sendMessage", {
            receiverId: selectedConversation.userId,
            message: messageContent,
            senderId: currentUser._id,
            messageId: messageId,
          });
        }
        // Socket delivery is for real-time notification only, not required for message to appear
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        
        if (error.response?.status === 403) {
          setShowError("You don't have permission to send this message");
        } else {
          setShowError("Failed to send message. Please check your connection and try again.");
        }
      } finally {
        setSendingMessage(false);
      }
    }
  }, [messageInput, selectedConversation, currentUser, sendingMessage]);

  const handleInputChange = useCallback((e) => {
    setMessageInput(e.target.value);
    setIsTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, []);

  const formatMessageTime = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d, h:mm a");
  };

  const formatConversationTime = (date) => {
    const d = new Date(date);
    const minutesAgo = differenceInMinutes(new Date(), d);

    if (minutesAgo < 1) return "Just now";
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday";

    return format(d, "MMM d");
  };

  const handleSelectConversation = useCallback(
    (conversation) => {
      setSelectedConversation(conversation);
      loadMessagesForConversation(conversation);
    },
    [loadMessagesForConversation]
  );

  const handleStartNewChat = useCallback(
    (user) => {
      // Check if user is already in following list
      if (!currentUser?.following?.some(fId => 
        fId.toString ? fId.toString() === user._id.toString() : fId === user._id
      )) {
        alert("You can only message users you are following");
        return;
      }

      const existingConv = conversations.find((c) => c.userId === user._id);

      if (existingConv) {
        handleSelectConversation(existingConv);
      } else {
        const newConv = {
          id: user._id,
          userId: user._id,
          username: user.username,
          profilePic: user.profilePic,
          lastMessage: "Start a conversation...",
          timestamp: new Date(),
          unread: 0,
          isOnline: onlineUsers.includes(user._id.toString ? user._id.toString() : user._id),
        };
        setConversations((prev) => [newConv, ...prev]);
        handleSelectConversation(newConv);
      }

      setNewChatOpen(false);
    },
    [conversations, currentUser?.following, currentUser?._id, handleSelectConversation, onlineUsers]
  );

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-180px)]">
        <p>Please log in to view messages</p>
      </div>
    );
  }

  // Filter users to only show following
  const followingUsers = users.filter(
    (u) => u._id !== currentUser._id && currentUser?.following?.some(fId => 
      fId.toString ? fId.toString() === u._id.toString() : fId === u._id
    )
  );

  return (
    <div className="container mx-auto p-0 sm:p-4">
      <div className="container mx-auto p-0 sm:p-4 h-[calc(100vh-64px)] sm:h-[calc(100vh-120px)] max-w-[1400px] space-y-3 sm:space-y-4 flex flex-col">

        {showFeatureWarning && (
          <div
            className="rounded-xl border text-sm sm:text-xs md:text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2 shadow-sm flex-shrink-0"
            style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
          >
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
              <p className="text-gray-700 leading-snug text-xs sm:text-sm">
                Voice call, video call, **basic encryption**, and **delete message** features
                are not available yet in this messaging app. We’re actively working on them –
                thanks for being part of our community!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFeatureWarning(false)}
              className="self-start sm:self-center inline-flex items-center justify-center rounded-md border border-transparent px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white/60 flex-shrink-0"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Dismiss
            </button>
          </div>
        )}

        {/* Network Error Alert */}
        {showError && (
          <div
            className="rounded-lg border px-4 py-3 text-sm flex items-center justify-between gap-3 flex-shrink-0 animate-in slide-in-from-top"
            style={{ backgroundColor: "#FEE2E2", borderColor: "#FECACA" }}
          >
            <p className="text-red-800">{showError}</p>
            <button
              onClick={() => setShowError(null)}
              className="text-red-600 hover:text-red-800 font-semibold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        <div
          className="rounded-xl border shadow-sm flex-1 flex overflow-hidden bg-white sm:rounded-lg min-h-0"
          style={{ borderColor: "#E5D4C1" }}
        >
          {/* Conversations List */}
          <div
            className={`${
              selectedConversation ? "hidden" : "flex"
            } w-full border-r flex-col flex-shrink-0 md:flex md:w-80 lg:w-96`}
            style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}
          >
            <div
              className="flex flex-col space-y-1.5 p-6 pb-3 border-b flex-shrink-0"
              style={{ backgroundColor: "#FFFFFF", borderColor: "#E5D4C1" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-semibold leading-none tracking-tight">
                  Messages
                </h3>

                {/* New Chat Button & Dialog */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNewChatOpen(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-gray-100 hover:text-gray-900 h-10 w-10 hover:bg-transparent"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {newChatOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold leading-none tracking-tight">
                            New Message
                          </h2>
                          <button
                            type="button"
                            onClick={() => setNewChatOpen(false)}
                            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                            <span className="sr-only">Close</span>
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          Select a user you follow to start a conversation
                        </p>
                        <div className="overflow-y-auto max-h-96 pr-4 space-y-3">
                          {followingUsers.length > 0 ? (
                            followingUsers.map((user) => (
                              <button
                                key={user._id}
                                onClick={() => handleStartNewChat(user)}
                                className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-50"
                              >
                                <div className="relative flex-shrink-0 h-10 w-10 overflow-hidden rounded-full">
                                  {user.profilePic ? (
                                    <img
                                      src={user.profilePic}
                                      alt={user.username}
                                      className="aspect-square h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 font-medium">
                                      {user.username
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-semibold">
                                    {user.username}
                                  </p>
                                  {user.bio && (
                                    <p className="text-sm text-gray-500 truncate">
                                      {user.bio}
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-8">
                              You are not following any users yet
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <p>Loading conversations...</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                      <button
                        key={conversation.userId}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`w-full flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? "shadow-sm bg-white"
                            : "hover:bg-white"
                        }`}
                      >
                        <div className="relative flex-shrink-0 h-12 w-12 rounded-full overflow-hidden">
                          {conversation.profilePic ? (
                            <img
                              src={conversation.profilePic}
                              alt={conversation.username}
                              className="aspect-square h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 font-medium">
                              {conversation.username
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          {conversation.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-10" />
                          )}
                        </div>

                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm truncate">
                              {conversation.username}
                            </span>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2 flex-shrink-0">
                              {formatConversationTime(
                                conversation.timestamp
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage}
                          </p>
                        </div>
                        {conversation.unread > 0 && (
                          <div
                            className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mt-1"
                            style={{ backgroundColor: "#D4A574" }}
                          >
                            {conversation.unread}
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No conversations found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col bg-white min-w-0 w-full">
              {/* Chat Header */}
              <div
                className="border-b p-3 sm:p-4 flex items-center justify-between bg-white flex-shrink-0"
                style={{ borderColor: "#E5D4C1" }}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <button
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ring-offset-background hover:bg-gray-100 h-10 w-10 flex-shrink-0 md:hidden"
                    onClick={() => setSelectedConversation(null)}
                    title="Back to conversations"
                    style={{ color: "#D4A574" }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Link
                    to={`/profile/${selectedConversation.username}`}
                    className="flex-shrink-0"
                  >
                    <div
                      className="relative flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden cursor-pointer group"
                      style={{ "--tw-ring-color": "#D4A574" }}
                    >
                      <div className="absolute inset-0 rounded-full group-hover:ring-2 transition-all p-0"></div>
                      {selectedConversation.profilePic ? (
                        <img
                          src={selectedConversation.profilePic}
                          alt={selectedConversation.username}
                          className="aspect-square h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 font-medium">
                          {selectedConversation.username
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      {selectedConversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full z-10" />
                      )}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${selectedConversation.username}`}>
                      <h3 className="font-semibold text-sm sm:text-base hover:underline cursor-pointer truncate">
                        {selectedConversation.username}
                      </h3>
                    </Link>
                    <div className="text-xs text-gray-500">
                      {selectedConversation.isOnline ? (
                        <span className="text-green-600 flex items-center">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                          Active now
                        </span>
                      ) : (
                        "Offline"
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                  <button
                    title="Voice Call"
                    className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ring-offset-background hover:bg-gray-100 h-10 w-10 hover:bg-transparent"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    title="Video Call"
                    className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ring-offset-background hover:bg-gray-100 h-10 w-10 hover:bg-transparent"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    title="More options"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ring-offset-background hover:bg-gray-100 h-10 w-10 hover:bg-transparent"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 scroll-smooth min-h-0"
                style={{ backgroundColor: "#FFF8ED" }}
                ref={messageContainerRef}
              >
                <div className="space-y-6 max-w-4xl mx-auto w-full">
                  {isLoading ? (
                    <p className="text-center text-gray-500">Loading messages...</p>
                  ) : (
                    <>
                      {messageGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                          {/* Date Separator */}
                          <div className="flex items-center justify-center my-4">
                            <div
                              className="px-3 py-1 rounded-full"
                              style={{ backgroundColor: "#E5D4C1" }}
                            >
                              <span className="text-xs text-gray-600 font-medium">
                                {group.date}
                              </span>
                            </div>
                          </div>

                          {/* Messages for this date */}
                          <div className="space-y-3">
                            {group.messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${
                                  message.isOwn
                                    ? "justify-end"
                                    : "justify-start"
                                } animate-in fade-in`}
                              >
                                <div
                                  className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${
                                    message.isOwn ? "flex-row-reverse" : ""
                                  }`}
                                >
                                  {!message.isOwn && (
                                    <div className="relative flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 rounded-full overflow-hidden">
                                      {selectedConversation.profilePic ? (
                                        <img
                                          src={
                                            selectedConversation.profilePic
                                          }
                                          alt={message.senderName}
                                          className="aspect-square h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 font-medium text-xs">
                                          {message.senderName
                                            .charAt(0)
                                            .toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <div
                                      className={`px-3 sm:px-4 py-2 rounded-2xl break-words ${
                                        message.isOwn
                                          ? "text-white rounded-br-sm"
                                          : "text-gray-900 border rounded-bl-sm"
                                      }`}
                                      style={{
                                        backgroundColor: message.isOwn
                                          ? "#D4A574"
                                          : "#FFFFFF",
                                        borderColor: message.isOwn
                                          ? "#D4A574"
                                          : "#E5D4C1",
                                      }}
                                    >
                                      <p className="text-sm whitespace-pre-wrap">
                                        {message.content}
                                      </p>
                                    </div>
                                    <div
                                      className={`flex items-center gap-1 mt-1 px-2 ${
                                        message.isOwn
                                          ? "justify-end"
                                          : "justify-start"
                                      }`}
                                    >
                                      <span className="text-xs text-gray-500">
                                        {formatMessageTime(
                                          message.timestamp
                                        )}
                                      </span>
                                      {message.isOwn && (
                                        <span className="text-gray-500">
                                          {message.read ? (
                                            <CheckCheck
                                              className="w-3 h-3"
                                              style={{ color: "#D4A574" }}
                                            />
                                          ) : (
                                            <Check className="w-3 h-3" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div
                className="border-t p-2 sm:p-3 md:p-4 bg-white flex-shrink-0"
                style={{ borderColor: "#E5D4C1" }}
              >
                <div className="flex items-center gap-1 sm:gap-2 max-w-4xl mx-auto">
                  <button
                    title="Attach file"
                    className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ring-offset-background hover:bg-gray-100 h-10 w-10 hover:bg-transparent"
                  >
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    title="Add image"
                    className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ring-offset-background hover:bg-gray-100 h-10 w-10 hover:bg-transparent"
                  >
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex-1 relative min-w-0">
                    <input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        handleSendMessage()
                      }
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 border-gray-200 text-sm sm:text-base"
                      style={{ backgroundColor: "#FFF8ED" }}
                    />
                    <button
                      title="Add emoji"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none ring-offset-background hover:bg-gray-100 h-10 w-10 hover:bg-transparent"
                    >
                      <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-9 w-9 sm:w-10 sm:h-10 p-0"
                    style={{
                      backgroundColor: (messageInput.trim() && !sendingMessage)
                        ? "#D4A574"
                        : "rgba(212, 165, 116, 0.4)",
                      color: "#FFFFFF",
                      cursor: (!messageInput.trim() || sendingMessage) ? "not-allowed" : "pointer",
                    }}
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                {isTyping && (
                  <p className="text-xs text-gray-500 mt-2 max-w-4xl mx-auto">
                    typing...
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div
              className="hidden md:flex flex-1 items-center justify-center bg-gray-50"
              style={{ backgroundColor: "#FFF8ED" }}
            >
              <div className="text-center text-gray-500">
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;