import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "like",
        "comment",
        "follow",
        "followRequest",
        "share",
        "story_comment",
        "story_reply",
         "reply",
         "mention",
      ],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    // Story reference is intentionally best-effort: stories auto-expire
    // and delete after 24 hours (see the TTL index in models/Story.js),
    // so this can end up pointing at a story that no longer exists.
    // That's an acceptable trade-off since the notification's own
    // `message` text carries the meaningful content, not this
    // reference — a dangling ref just populates as null.
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
