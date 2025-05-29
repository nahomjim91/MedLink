// socket/chatController.js
const { db, FieldValue, admin } = require("../../config/firebase");

const isUserOnline = (userId, userConnections) => {
  return (
    userConnections.has(Number(userId)) &&
    userConnections.get(Number(userId)).size > 0
  );
};

const hasUserBlocked = async (blockerId, blockedId) => {
  try {
    const blockSnapshot = await db
      .collection("chatBlocks")
      .where("blockerId", "==", blockerId)
      .where("blockedId", "==", blockedId)
      .get();

    return !blockSnapshot.empty;
  } catch (error) {
    console.error("Error checking if user blocked:", error);
    return false;
  }
};

const hasUserArchived = async (archiverId, archivedId) => {
  try {
    const archiveSnapshot = await db
      .collection("chatArchives")
      .where("archiverId", "==", archiverId)
      .where("archivedId", "==", archivedId)
      .get();

    return !archiveSnapshot.empty;
  } catch (error) {
    console.error("Error checking if user archived:", error);
    return false;
  }
};

const getUserProfile = async (userId) => {
  try {
    const userDoc = await db.collection("msUsers").doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

const fetchChatInfo = async (chatId, userId) => {
  try {
    const chatUser = await getUserProfile(chatId);
    if (!chatUser) {
      throw new Error(`User not found: ${chatId}`);
    }

    // Get unread message count
    const unreadSnapshot = await db
      .collection("chatMessages")
      .where("from", "==", chatId)
      .where("to", "==", userId)
      .where("isSeen", "==", false)
      .get();

    // Get last message using chatRoomId instead of array-contains
    const roomName = `chat_${[userId, chatId].sort().join("_")}`;
    const lastMessageSnapshot = await db
      .collection("chatMessages")
      .where("chatRoomId", "==", roomName)
      .orderBy("sendTime", "desc")
      .limit(1)
      .get();

    let lastMessage = null;
    if (!lastMessageSnapshot.empty) {
      lastMessage = {
        id: lastMessageSnapshot.docs[0].id,
        ...lastMessageSnapshot.docs[0].data(),
      };
    }

    return {
      // chatId,
      // profileName: chatUser.contactName || chatUser.companyName,
      // email: chatUser.email || null,
      // companyName: chatUser.companyName || null,
      // phoneNumber: chatUser.phoneNumber || null,
      // address: chatUser.address || null,
      // lastSeenTime: chatUser.lastSeenTime || null,
      // unreadCount: unreadSnapshot.size,
      id: chatId, // Frontend expects 'id'
      name: chatUser.contactName || chatUser.companyName, // Added 'name'
      avatar: chatUser.profilePictureURL || null, // Added 'avatar'
      participants: [
        // Added 'participants' array
        {
          userId: chatId,
          name: chatUser.contactName || chatUser.companyName,
          profilePictureURL: chatUser.profilePictureURL || null,
        },
      ],
      lastMessage: lastMessage?.textContent || null, // String instead of object
      lastMessageTime: lastMessage?.sendTime || null, // Separate timestamp
      unreadCount: unreadSnapshot.size,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            textContent: lastMessage.textContent,
            from: lastMessage.from,
            sendTime: lastMessage.sendTime,
            isSeen: lastMessage.isSeen,
          }
        : null,
      participants: [
        {
          userId: chatId,
          name: chatUser.contactName || chatUser.companyName,
          profilePictureURL: chatUser.profilePictureURL || null,
        },
      ],
      isArchived: await hasUserArchived(userId, chatId),
      haveIBlockedUser: await hasUserBlocked(userId, chatId),
      hasUserBlockedMe: await hasUserBlocked(chatId, userId),
      isOnline: false, // Will be set by socket system
    };
  } catch (error) {
    console.error("Error fetching chat info:", error);
    throw error;
  }
};

const createConversation = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { participants, type } = req.body;

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return res.status(400).json({ error: "Participants are required" });
    }

    const chatPartnerId = participants.find((id) => id !== userId);
    if (!chatPartnerId) {
      return res.status(400).json({ error: "No valid participant" });
    }

    // Optionally: Check if a conversation already exists between these two

    // You could use chatMessages as the "conversation" implicitly
    // Or create a separate "conversations" collection
    const newConversation = {
      id: chatPartnerId,
      participants: [userId, chatPartnerId],
      type: type || "private",
      createdAt: FieldValue.serverTimestamp(),
    };

    res.status(200).json({
      success: true,
      conversation: newConversation,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
};

module.exports = {
  // Archive/Unarchive chat
  addChatToArchives: async (req, res) => {
    try {
      const userId = req.user.uid; // Assuming you have Firebase auth middleware
      const { chatId } = req.body;

      if (!chatId) {
        return res.status(400).json({ error: "chatId is required" });
      }

      // Check if chat user exists
      const chatUser = await getUserProfile(chatId);
      if (!chatUser) {
        return res.status(400).json({ error: "Invalid chatId" });
      }

      // Check if already archived
      if (await hasUserArchived(userId, chatId)) {
        return res.status(200).json({
          success: true,
          message: "Chat is already archived",
        });
      }

      // Add to archives
      await db.collection("chatArchives").add({
        archiverId: userId,
        archivedId: chatId,
        createdAt: FieldValue.serverTimestamp(),
      });

      res.status(200).json({
        success: true,
        message: "Chat archived successfully",
      });
    } catch (error) {
      console.error("Error archiving chat:", error);
      res.status(500).json({ error: "Could not archive chat" });
    }
  },
  // create a new conversation
  createConversation,

  // Remove chat from archives
  removeChatFromArchives: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { chatId } = req.body;

      if (!chatId) {
        return res.status(400).json({ error: "chatId is required" });
      }

      // Find and delete archive record
      const archiveSnapshot = await db
        .collection("chatArchives")
        .where("archiverId", "==", userId)
        .where("archivedId", "==", chatId)
        .get();

      if (archiveSnapshot.empty) {
        return res.status(200).json({
          success: true,
          message: "Chat is not archived",
        });
      }

      // Delete all matching archive records
      const batch = db.batch();
      archiveSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      res.status(200).json({
        success: true,
        message: "Chat removed from archives",
      });
    } catch (error) {
      console.error("Error removing from archives:", error);
      res.status(500).json({ error: "Could not remove from archives" });
    }
  },

  // Block/Unblock user
  blockUser: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { chatId } = req.body;

      if (!chatId) {
        return res.status(400).json({ error: "chatId is required" });
      }

      // Check if already blocked
      if (await hasUserBlocked(userId, chatId)) {
        return res.status(200).json({
          success: true,
          message: "User is already blocked",
        });
      }

      // Add block record
      await db.collection("chatBlocks").add({
        blockerId: userId,
        blockedId: chatId,
        createdAt: FieldValue.serverTimestamp(),
      });

      res.status(200).json({
        success: true,
        message: "User blocked successfully",
      });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ error: "Could not block user" });
    }
  },

  unblockUser: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { chatId } = req.body;

      if (!chatId) {
        return res.status(400).json({ error: "chatId is required" });
      }

      // Find and delete block record
      const blockSnapshot = await db
        .collection("chatBlocks")
        .where("blockerId", "==", userId)
        .where("blockedId", "==", chatId)
        .get();

      if (blockSnapshot.empty) {
        return res.status(200).json({
          success: true,
          message: "User is not blocked",
        });
      }

      // Delete all matching block records
      const batch = db.batch();
      blockSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      res.status(200).json({
        success: true,
        message: "User unblocked successfully",
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ error: "Could not unblock user" });
    }
  },

  // Report message
  reportMessage: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { messageId, remark } = req.body;

      if (!messageId) {
        return res.status(400).json({ error: "messageId is required" });
      }

      // Check if message exists
      const messageDoc = await db
        .collection("chatMessages")
        .doc(messageId)
        .get();
      if (!messageDoc.exists) {
        return res.status(400).json({ error: "Message does not exist" });
      }

      const messageData = messageDoc.data();

      // Check if user can report this message
      if (messageData.from === userId) {
        return res
          .status(400)
          .json({ error: "Cannot report your own message" });
      }

      if (messageData.to !== userId) {
        return res
          .status(400)
          .json({ error: "Cannot report a message not sent to you" });
      }

      // Create report
      await db.collection("chatMessageReports").add({
        messageId,
        reporterId: userId,
        remark: remark || "",
        createdAt: FieldValue.serverTimestamp(),
      });

      res.status(200).json({
        success: true,
        message: "Message reported successfully",
      });
    } catch (error) {
      console.error("Error reporting message:", error);
      res.status(500).json({ error: "Could not report message" });
    }
  },

  // Get chat data
  getChatData: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { chatId } = req.query;

      if (!chatId) {
        return res.status(400).json({ error: "chatId is required" });
      }

      const chatData = await getUserProfile(chatId);
      if (!chatData) {
        return res.status(400).json({ error: "Invalid chat ID" });
      }

      res.status(200).json({
        success: true,
        chatData: {
          profileName: chatData.contactName || chatData.companyName,
          email: chatData.email,
          companyName: chatData.companyName,
          phoneNumber: chatData.phoneNumber,
          address: chatData.address,
          lastSeenTime: chatData.lastSeenTime,
          isApproved: chatData.isApproved,
        },
        hasUserBlockedMe: await hasUserBlocked(chatId, userId),
        haveIBlockedUser: await hasUserBlocked(userId, chatId),
        isOnline: false, // Will be updated by socket
      });
    } catch (error) {
      console.error("Error getting chat data:", error);
      res.status(500).json({ error: "Could not get chat data" });
    }
  },

  // Send chat message
  sendChatMessage: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { textContent, to } = req.body;

      if (!textContent || !textContent.trim()) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }

      if (!to) {
        return res.status(400).json({ error: "Recipient is required" });
      }

      const recipient = await getUserProfile(to);
      if (!recipient) {
        return res.status(400).json({ error: "Recipient not found" });
      }

      if (await hasUserBlocked(to, userId)) {
        return res
          .status(400)
          .json({ error: "Cannot send message - you are blocked" });
      }

      if (await hasUserBlocked(userId, to)) {
        return res
          .status(400)
          .json({ error: "Cannot send message - you have blocked this user" });
      }

      const roomName = `chat_${[userId, to].sort().join("_")}`;

      const messageData = {
        textContent: textContent.trim(),
        from: userId,
        to: to,
        participants: [userId, to],
        chatRoomId: roomName,
        isSeen: false,
        sendTime: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      };

      const messageRef = await db.collection("chatMessages").add(messageData);
      const messageDoc = await messageRef.get();
      const savedMessage = { id: messageDoc.id, ...messageDoc.data() };

      res.status(200).json({
        success: true,
        message: savedMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Could not send message" });
    }
  },

  // Fetch chat messages - FIXED
  fetchChatMessages: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { chatId, before, after, limit = 20 } = req.query;

      if (!chatId) {
        return res.status(400).json({ error: "chatId is required" });
      }

      const roomName = `chat_${[userId, chatId].sort().join("_")}`;

      let query = db
        .collection("chatMessages")
        .where("chatRoomId", "==", roomName)
        .orderBy("sendTime", "desc")
        .limit(parseInt(limit));

      if (before) {
        const beforeDoc = await db.collection("chatMessages").doc(before).get();
        if (beforeDoc.exists) {
          query = query.startAfter(beforeDoc);
        }
      }

      if (after) {
        const afterDoc = await db.collection("chatMessages").doc(after).get();
        if (afterDoc.exists) {
          query = query.endBefore(afterDoc);
        }
      }

      const snapshot = await query.get();
      const messages = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          sendTime: doc.data().sendTime?.toDate?.() || doc.data().sendTime,
        }))
        .reverse();

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Could not fetch messages" });
    }
  },

  // Mark messages as seen
  markMessagesAsSeen: async (req, res) => {
    try {
      const userId = req.user.uid;
      const { chatId } = req.body;

      if (!chatId) {
        return res.status(400).json({ error: "chatId is required" });
      }

      // Get all unseen messages from the chat partner to current user
      const unseenMessages = await db
        .collection("chatMessages")
        .where("from", "==", chatId)
        .where("to", "==", userId)
        .where("isSeen", "==", false)
        .get();

      // Mark all as seen
      const batch = db.batch();
      unseenMessages.docs.forEach((doc) => {
        batch.update(doc.ref, {
          isSeen: true,
          seenAt: FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error marking messages as seen:", error);
      res.status(500).json({ error: "Could not mark messages as seen" });
    }
  },

  // Get total unread message count
  getTotalUnreadMessageCount: async (req, res) => {
    try {
      const userId = req.user.uid;

      // Get all unread messages to this user
      const unreadSnapshot = await db
        .collection("chatMessages")
        .where("to", "==", userId)
        .where("isSeen", "==", false)
        .get();

      res.status(200).json({
        success: true,
        data: unreadSnapshot.size,
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ error: "Could not get unread count" });
    }
  },

  // Get all chats with message counts - OPTIMIZED
  getChatsWithCounts: async (req, res) => {
    try {
      const userId = req.user.uid;

      // Get all messages where user is from or to (instead of array-contains)
      const [sentMessages, receivedMessages] = await Promise.all([
        db.collection("chatMessages").where("from", "==", userId).get(),
        db.collection("chatMessages").where("to", "==", userId).get(),
      ]);

      // Extract unique chat partners
      const chatPartners = new Set();

      sentMessages.docs.forEach((doc) => {
        const data = doc.data();
        if (data.to !== userId) {
          chatPartners.add(data.to);
        }
      });

      receivedMessages.docs.forEach((doc) => {
        const data = doc.data();
        if (data.from !== userId) {
          chatPartners.add(data.from);
        }
      });

      // Fetch chat info for each partner
      const chats = [];
      for (const partnerId of chatPartners) {
        try {
          const chatInfo = await fetchChatInfo(partnerId, userId);
          chats.push(chatInfo);
        } catch (error) {
          console.error(`Error fetching chat info for ${partnerId}:`, error);
        }
      }

      // Sort by last message time
      chats.sort((a, b) => {
        const timeA = a.lastMessage?.sendTime || 0;
        const timeB = b.lastMessage?.sendTime || 0;
        return new Date(timeB) - new Date(timeA);
      });

      res.status(200).json({
        success: true,
        data: chats,
      });
    } catch (error) {
      console.error("Error getting chats:", error);
      res.status(500).json({ error: "Could not get chats" });
    }
  },
};
