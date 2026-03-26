/** 產生隨機不重複的 seed，供 MemberAvatar 使用 */
export function randomAvatarSeed(): string {
  return crypto.randomUUID();
}
