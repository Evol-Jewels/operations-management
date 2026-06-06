export const INTERNAL_USER_STATUSES = [
  "INACTIVE",
  "ACTIVE",
  "BLOCKED",
] as const;

export const INTERNAL_PROFILE_ROLES = ["SALES", "OPERATIONS", "ADMIN"] as const;

export const INTERNAL_INVITE_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "CANCELLED",
] as const;

export type InternalUserStatus = (typeof INTERNAL_USER_STATUSES)[number];
export type InternalProfileRole = (typeof INTERNAL_PROFILE_ROLES)[number];
export type InternalInviteStatus = (typeof INTERNAL_INVITE_STATUSES)[number];

export interface InternalUserProfile {
  gender: "MALE" | "FEMALE" | "OTHERS" | null;
  role: InternalProfileRole | null;
  department: string | null;
  locationId: string | null;
}

export interface InternalUserWithProfile {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: "internal";
  status: InternalUserStatus;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: InternalUserProfile | null;
}

export interface InternalInviteRow {
  id: string;
  userId: string;
  email: string;
  username?: string;
  role: InternalProfileRole;
  status: InternalInviteStatus;
  onlyUsernameLogin?: boolean;
  expirationAt: string;
  createdBy: string;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InternalUsersQuery {
  status?: InternalUserStatus;
  role?: InternalProfileRole;
  department?: string;
}

export interface InternalInvitesQuery {
  status?: InternalInviteStatus;
  userId?: string;
}

export interface CreateInternalInviteInput {
  email: string;
  role: InternalProfileRole;
  username?: string;
  onlyUsernameLogin?: boolean;
  expiration?: string;
}

export interface CreateInternalInviteResponse {
  id: string;
  email: string;
  role: InternalProfileRole;
  username?: string;
  password?: string;
  userStatus: InternalUserStatus;
  inviteStatus: InternalInviteStatus;
  expiration: string;
  createdAt: string;
}

export interface ExpireInviteResponse {
  id: string;
  userId: string;
  email: string;
  role: InternalProfileRole;
  status: "EXPIRED";
  expirationAt: string;
  acceptedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlockUserResponse {
  id: string;
  email: string;
  username: string;
  status: "BLOCKED";
  updatedAt: string;
}

export interface UnblockUserResponse {
  id: string;
  email: string;
  username: string;
  status: "ACTIVE";
  updatedAt: string;
}

export interface ResetPasswordResponse {
  id: string;
  username: string;
  passwordUpdated: boolean;
}
