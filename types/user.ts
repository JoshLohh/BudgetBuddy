export interface User {
  $id: string;
  email: string;
  username?: string;
  avatar?: string | null;
  bio?: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  avatar: string | null;
  email?: string;
  bio?: string;
}
