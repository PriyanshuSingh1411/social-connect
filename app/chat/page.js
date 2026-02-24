"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaPaperPlane, FaImage, FaArrowLeft } from "react-icons/fa";
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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
        // API returns { users: [...] }, so we need to access res.data.users
        const users = res.data.users || res.data;
        setSearchResults(users.filter((u) => u._id !== session?.user?.id));
      } catch (error) {
        console.error("Error searching users:", error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;

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
                  <img
                    src={user.profilePicture || "/default-avatar.png"}
                    alt={user.name}
                    className={styles.avatar}
                  />
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
              <img
                src={conv.partner.profilePicture || "/default-avatar.png"}
                alt={conv.partner.name}
                className={styles.avatar}
              />
              <div className={styles.conversationInfo}>
                <div className={styles.userName}>{conv.partner.name}</div>
                <div className={styles.lastMessage}>
                  {conv.lastMessage?.content?.substring(0, 30)}...
                </div>
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
              <img
                src={
                  selectedChat.partner.profilePicture || "/default-avatar.png"
                }
                alt={selectedChat.partner.name}
                className={styles.avatar}
              />
              <div>
                <div className={styles.userName}>
                  {selectedChat.partner.name}
                </div>
                <div className={styles.userUsername}>
                  @{selectedChat.partner.username}
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
                onChange={(e) => setNewMessage(e.target.value)}
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
