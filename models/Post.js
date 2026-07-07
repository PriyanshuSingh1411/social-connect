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
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: {
          type: String,
          required: true,
        },
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
    reactions: {
      type: Map,
      of: {
        type: Number,
        default: 0,
      },
      default: {},
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // For repost/share feature
    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    // For multiple images (carousel)
    images: [
      {
        type: String,
      },
    ],
    // For video posts
    video: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Index for search and trending
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ desc: "text" });

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

export default Post;
