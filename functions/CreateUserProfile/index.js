const sdk = require("node-appwrite");

module.exports = async function (req, res) {
  const client = new sdk.Client();
  const databases = new sdk.Databases(client);

  client
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  // The payload is the new user object
  const user = JSON.parse(req.payload);
  const userId = user.$id;

  try {
    // Create a profile document using the Auth userId as a unique field
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_USERS_COLLECTION_ID,
      sdk.ID.unique(),
      {
        userId,
        username: user.name || '',
        email: user.email || '',
        avatar: '',
        bio: ''
      },
      [
        sdk.Permission.read(sdk.Role.user(userId)),
        sdk.Permission.update(sdk.Role.user(userId)),
        sdk.Permission.delete(sdk.Role.user(userId))
      ]
    );
    res.json({ success: true });
  } catch (err) {
    // If the document already exists, ignore the error
    res.json({ error: err.message }, 500);
  }
};
