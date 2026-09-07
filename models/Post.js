import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    desc: {
      type: String,
      maxlength: 500,
    },

    img: {
      type: String,
      default: "",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // =====================================================
    // COMMENTS
    // =====================================================
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        text: {
          type: String,
          required: true,
          maxlength: 1000,
        },

        // null = normal comment
        // comment ID = reply to that comment
        parentCommentId: {
          type: mongoose.Schema.Types.ObjectId,
          default: null,
        },

        // Users mentioned using @username
        mentions: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    shares: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    hashtags: [
      {
        type: String,
      },
    ],

    isEdited: {
      type: Boolean,
      default: false,
    },

    // Reaction counts
    reactions: {
      type: Map,
      of: Number,
      default: {},
    },

    // Which user selected which reaction
    userReactions: {
      type: Map,
      of: String,
      default: {},
    },

    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    images: [
      {
        type: String,
      },
    ],

    video: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ desc: "text" });

const Post =
  mongoose.models.Post ||
  mongoose.model("Post", postSchema);

export default Post;