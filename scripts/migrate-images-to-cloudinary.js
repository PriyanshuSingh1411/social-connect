import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import Post from "../models/Post.js";
import User from "../models/User.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing from .env.local");
}

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error("Cloudinary environment variables are missing");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isBase64Image = (value) => {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/")
  );
};

async function uploadToCloudinary(base64Data, folder, publicId) {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    public_id: publicId,
    resource_type: "image",
  });

  return result.secure_url;
}

async function migratePosts() {
  console.log("\n==============================");
  console.log("Migrating Post images");
  console.log("==============================\n");

  let scanned = 0;
  let migrated = 0;
  let failed = 0;

  const cursor = Post.find({
    $or: [
      { img: /^data:image\// },
      { images: /^data:image\// },
    ],
  }).cursor();

  for await (const post of cursor) {
    scanned++;

    try {
      let changed = false;

      // -----------------------------
      // Single post image
      // -----------------------------
      if (isBase64Image(post.img)) {
        console.log(`Uploading post ${post._id} img...`);

        const url = await uploadToCloudinary(
          post.img,
          "socialconnect/posts",
          `post_${post._id}`
        );

        post.img = url;
        changed = true;

        console.log("✓ Post img migrated");
      }

      // -----------------------------
      // Multiple post images
      // -----------------------------
      if (Array.isArray(post.images) && post.images.length > 0) {
        const newImages = [];

        for (let i = 0; i < post.images.length; i++) {
          const image = post.images[i];

          if (isBase64Image(image)) {
            console.log(
              `Uploading post ${post._id} image ${i + 1}...`
            );

            const url = await uploadToCloudinary(
              image,
              "socialconnect/posts",
              `post_${post._id}_${i + 1}`
            );

            newImages.push(url);
            changed = true;

            console.log(
              `✓ Post ${post._id} image ${i + 1} migrated`
            );
          } else {
            newImages.push(image);
          }
        }

        post.images = newImages;
      }

      if (changed) {
        await post.save();
        migrated++;

        console.log(`✓ Post ${post._id} saved\n`);
      }
    } catch (error) {
      failed++;

      console.error(
        `✗ Failed to migrate post ${post._id}:`,
        error.message
      );
    }
  }

  console.log("\nPost migration complete.");
  console.log(`Scanned:   ${scanned}`);
  console.log(`Migrated:  ${migrated}`);
  console.log(`Failed:    ${failed}`);
}

async function migrateUsers() {
  console.log("\n==============================");
  console.log("Migrating User images");
  console.log("==============================\n");

  let scanned = 0;
  let migrated = 0;
  let failed = 0;

  const cursor = User.find({
    $or: [
      { profilePicture: /^data:image\// },
    ],
  }).cursor();

  for await (const user of cursor) {
    scanned++;

    try {
      let changed = false;

      if (changed) {
        await user.save();
        migrated++;

        console.log(`✓ User ${user._id} saved\n`);
      }
    } catch (error) {
      failed++;

      console.error(
        `✗ Failed to migrate user ${user._id}:`,
        error.message
      );
    }
  }

  console.log("\nUser migration complete.");
  console.log(`Scanned:   ${scanned}`);
  console.log(`Migrated:  ${migrated}`);
  console.log(`Failed:    ${failed}`);
}

async function main() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI);

    console.log("✓ MongoDB connected");

    console.log(
      `✓ Cloudinary connected: ${process.env.CLOUDINARY_CLOUD_NAME}`
    );

    await migratePosts();
    await migrateUsers();

    console.log("\n================================");
    console.log("ALL MIGRATIONS COMPLETED");
    console.log("================================\n");
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

main();