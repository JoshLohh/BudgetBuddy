import { Client, Databases, Permission, Users } from "node-appwrite";
import { Models } from "appwrite";
import { Role } from "react-native-appwrite";

interface RequestBody extends Models.User<Models.Preferences> {
  targets: Models.Target[];
  accessedAt: string;
}

// This Appwrite function will be executed every time the function is triggered
export default async ({ req, res, log, error }: any) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  console.log("✅ Appwrite Function started");
  const databaseId = process.env.DATABASE_ID ?? '';
  const collectionId = process.env.COLLECTION_ID ?? '';

  const client = new Client()
    .setEndpoint(Bun.env["APPWRITE_FUNCTION_API_ENDPOINT"])
    .setProject(Bun.env["APPWRITE_FUNCTION_PROJECT_ID"])
    .setKey(req.headers["x-appwrite-key"] ?? "");
  const users = new Users(client);
  const databases = new Databases(client);

  const data: RequestBody = req.bodyJson;
  console.log("📦 Payload received:");

  try {
    if (!databaseId || !collectionId) {
      throw new Error('Missing required environment variables: DATABASE_ID or COLLECTION_ID');
    }
    const user = await databases.getDocument(
      databaseId,
      collectionId,
      data.$id,
    );

    if (user) {
      return res.json({ message: "User already exists" });
    }
  } catch (e: any) {
    log("User does not exist in database. Proceed with creating the user in database.")
  }
  
  try {
    await databases.createDocument(
      databaseId,
      collectionId,
      data.$id,
      {
        username: data.name,
        email: data.email
      },
      [
        Permission.read(Role.user(data.$id)),
        Permission.update(Role.user(data.$id)),
        Permission.delete(Role.user(data.$id))
      ]
    );
    console.log("✅ Document created:");
    log("User created successfully");
    return res.json({ message: "User created successfully" });
  } catch (e: any) {
    error("Failed to create the user in the database: " + JSON.stringify(e));
    console.error("❌ Error creating document:", error);
    return res.json({ message: "Failed to create the user in the database:" + JSON.stringify(e)});
  }
};