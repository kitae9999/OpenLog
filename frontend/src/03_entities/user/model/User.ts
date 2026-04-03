export interface User {
  id: number;
  username: string | null;
  nickname: string | null;
  email: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  isOnboardingComplete: boolean;
}
