import { v2 as cloudinary } from "cloudinary";
import { getSessionUserId } from "../../../lib/session";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paramsToSign } = body;

    if (!paramsToSign) {
      return Response.json(
        { error: "Missing paramsToSign" },
        { status: 400 }
      );
    }

    // Only allow uploads into our post folder
    if (paramsToSign.folder !== "socialconnect/posts") {
      return Response.json(
        { error: "Invalid upload folder" },
        { status: 400 }
      );
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return Response.json({
      signature,
    });
  } catch (error) {
    console.error("Cloudinary signature error:", error);

    return Response.json(
      { error: "Failed to generate Cloudinary signature" },
      { status: 500 }
    );
  }
}