"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaPaperPlane, FaImage, FaArrowLeft, FaCircle } from "react-icons/fa";
import styles from "./chat.module.css";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [partnerTyping, setPartnerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Set user online on mount, offline on unmount
  useEffect(() => {
    if (session) {
      // Set online
      axios.post("/api/users/online", { isOnline: true });

      // Set offline on unmount
      return () => {
        axios.post("/api/users/online", { isOnline: false });
      };
    }
  }, [session]);

  // Poll for online status and typing indicators
  useEffect(() => {
    if (!session) return;

    const fetchOnlineStatus = async () => {
      try {
        const res = await axios.get("/api/users/online", {
          params: {
            userIds: conversations.map((c) => c.partner._id).join(","),
          },
        });
        setOnlineUsers(res.data);
      } catch (error) {
        console.error("Error fetching online status:", error);
      }
    };

    const fetchTypingStatus = async () => {
      try {
        const res = await axios.get("/api/users/typing");
        const typingMap = {};
        res.data.typingUsers.forEach((u) => {
          if (u.userId) {
            typingMap[u.userId._id] = u.userId;
          }
        });
        setTypingUsers(typingMap);
      } catch (error) {
        console.error("Error fetching typing status:", error);
      }
    };

    // Initial fetch
    if (conversations.length > 0) {
      fetchOnlineStatus();
      fetchTypingStatus();
    }

    // Poll every 3 seconds
    const interval = setInterval(() => {
      if (conversations.length > 0) {
        fetchOnlineStatus();
      }
      fetchTypingStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [session, conversations]);

  // Check if partner is typing in current chat
  useEffect(() => {
    if (selectedChat) {
      const isPartnerTyping =
        typingUsers[selectedChat.partner._id] !== undefined;
      setPartnerTyping(isPartnerTyping);
    }
  }, [typingUsers, selectedChat]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchConversations();
    }
  }, [session]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.partner._id);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get("/api/conversations");
      setConversations(res.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const res = await axios.get(`/api/messages?userId=${userId}`);
      setMessages(res.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const searchUsers = async (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const res = await axios.get(`/api/users?search=${query}`);
        const users = res.data.users || res.data;
        setSearchResults(users.filter((u) => u._id !== session?.user?.id));
      } catch (error) {
        console.error("Error searching users:", error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const sendTypingStatus = async (isTyping) => {
    if (!selectedChat || isTypingRef.current === isTyping) return;

    isTypingRef.current = isTyping;
    try {
      await axios.post("/api/users/typing", {
        receiverId: selectedChat.partner._id,
        isTyping,
      });
    } catch (error) {
      console.error("Error sending typing status:", error);
    }
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (e.target.value && !isTypingRef.current) {
      sendTypingStatus(true);
    }

    // Clear typing after 2 seconds of no input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
      isTypingRef.current = false;
    }, 2000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;

    // Stop typing indicator
    sendTypingStatus(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const res = await axios.post("/api/messages", {
        receiverId: selectedChat.partner._id,
        content: newMessage,
        image: selectedImage,
      });
      setMessages([...messages, res.data]);
      setNewMessage("");
      setSelectedImage(null);
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startChat = (user) => {
    const existing = conversations.find(
      (c) => c.partner._id === user._id || c.partner._id === user.id,
    );

    if (existing) {
      setSelectedChat(existing);
    } else {
      setSelectedChat({
        partner: user._id
          ? user
          : {
              _id: user.id,
              name: user.name,
              username: user.username,
              profilePicture: user.profilePicture,
            },
      });
    }
    setSearchResults([]);
    setSearchQuery("");
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Online";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (status === "loading") {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <h2>Messages</h2>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search users to chat..."
            value={searchQuery}
            onChange={(e) => searchUsers(e.target.value)}
            className={styles.searchInput}
          />
          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className={styles.searchResult}
                  onClick={() => startChat(user)}
                >
                  <div className={styles.avatarContainer}>
                    <img
                      src={user.profilePicture || "/default-avatar.png"}
                      alt={user.name}
                      className={styles.avatar}
                    />
                    {onlineUsers[user._id]?.isOnline && (
                      <span className={styles.onlineIndicator}></span>
                    )}
                  </div>
                  <div>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userUsername}>@{user.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.conversationList}>
          {conversations.map((conv, index) => (
            <div
              key={index}
              className={`${styles.conversation} ${selectedChat?.partner?._id === conv.partner._id ? styles.active : ""}`}
              onClick={() => setSelectedChat(conv)}
            >
              <div className={styles.avatarContainer}>
                <img
                  src={conv.partner.profilePicture || "/default-avatar.png"}
                  alt={conv.partner.name}
                  className={styles.avatar}
                />
                {onlineUsers[conv.partner._id]?.isOnline && (
                  <span className={styles.onlineIndicator}></span>
                )}
              </div>
              <div className={styles.conversationInfo}>
                <div className={styles.userName}>{conv.partner.name}</div>
                {typingUsers[conv.partner._id] ? (
                  <div className={styles.typingIndicator}>typing...</div>
                ) : (
                  <div className={styles.lastMessage}>
                    {conv.lastMessage?.content?.substring(0, 30)}...
                  </div>
                )}
              </div>
              {conv.unreadCount > 0 && (
                <div className={styles.unreadBadge}>{conv.unreadCount}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.chatArea}>
        {selectedChat ? (
          <>
            <div className={styles.chatHeader}>
              <button
                className={styles.backButton}
                onClick={() => setSelectedChat(null)}
              >
                <FaArrowLeft />
              </button>
              <div className={styles.avatarContainer}>
                <img
                  src={
                    selectedChat.partner.profilePicture || "/default-avatar.png"
                  }
                  alt={selectedChat.partner.name}
                  className={styles.avatar}
                />
                {onlineUsers[selectedChat.partner._id]?.isOnline && (
                  <span className={styles.onlineIndicator}></span>
                )}
              </div>
              <div>
                <div className={styles.userName}>
                  {selectedChat.partner.name}
                </div>
                <div className={styles.userStatus}>
                  {onlineUsers[selectedChat.partner._id]?.isOnline
                    ? "Online"
                    : formatLastSeen(
                        onlineUsers[selectedChat.partner._id]?.lastSeen,
                      )}
                </div>
              </div>
            </div>

            <div className={styles.messages}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${msg.sender._id === session?.user?.id || msg.sender === session?.user?.id ? styles.sent : styles.received}`}
                >
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Shared"
                      className={styles.messageImage}
                    />
                  )}
                  <div className={styles.messageContent}>{msg.content}</div>
                  <div className={styles.messageTime}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
              {partnerTyping && (
                <div className={`${styles.message} ${styles.received}`}>
                  <div className={styles.typingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              {selectedImage && (
                <div className={styles.imagePreview}>
                  <img src={selectedImage} alt="Preview" />
                  <button onClick={() => setSelectedImage(null)}>×</button>
                </div>
              )}
              <button
                className={styles.imageButton}
                onClick={() => fileInputRef.current?.click()}
              >
                <FaImage />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                style={{ display: "none" }}
              />
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleMessageChange}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className={styles.messageInput}
              />
              <button onClick={sendMessage} className={styles.sendButton}>
                <FaPaperPlane />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noChat}>
            <h3>Select a conversation or search for users to start chatting</h3>
          </div>
        )}
      </div>
    </div>
  );
}
