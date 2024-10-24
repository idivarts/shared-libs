import { onRequest } from "firebase-functions/v2/https";
import { StreamChat } from "stream-chat";

export const health = onRequest((request, response) => {
  response.send("Health is good");
});

export const getStreamPushNotificationToken = onRequest(
  { secrets: ["STREAM_API_KEY", "STREAM_API_SECRET_KEY"] },
  (request, response) => {
    const userId = request.params[0];

    const serverClient = StreamChat.getInstance(
      process.env.STREAM_API_KEY!,
      process.env.STREAM_API_SECRET_KEY!
    );

    const token = serverClient.createToken(userId);

    response.json({
      token,
    });
  }
);
