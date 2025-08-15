export const getAvatarUrl = (id: string, avatar: string) => {
  if (!avatar) return ""
  avatar = avatar.replace("/avatars/undefined/", `/avatars/${id}/`)
  if (avatar.startsWith('http')) return avatar;
  const type = avatar.startsWith('a_') ? 'gif' : 'png'
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${type}`
}
