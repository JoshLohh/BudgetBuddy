export interface Group {
  id: string;
  title: string;
  description?: string;
  members: string[];
  createdBy: string;
  avatar?: string | null;

}

export interface CreateGroupInput {
  title: string;
  description?: string;
  // Add more fields as needed
}

export interface MemberProfile {
  userId: string;
  username: string;
  avatar: string | null;
}