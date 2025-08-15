import { Avatar } from "flowbite-react";
import Image from "@/ui/Image";
import { getAvatarUrl } from "@/utils/DiscordAvatar";
import { useTranslation } from "react-i18next";

type PlayerAvatarProps = {
  id: string;
  avatar: string | null;
  displayname?: string;
  username?: string;
  size?: "sm" | "md" | "lg";
  bordered?: boolean;
  color?: string;
  stacked?: boolean;
  rounded?: boolean;
  className?: string;
  onClick?: () => void;
};
export const PlayerAvatar = ({ id, rounded, stacked, avatar, displayname, username, size = "md", bordered = false, color = "", className = "", onClick }: PlayerAvatarProps) => {
  const { t } = useTranslation();
  return (
  <Avatar
    img={(props) => <Image {...props} defaultSrc="/default.png" src={getAvatarUrl(id, avatar || "")} />}
    size={size}
    bordered={bordered}
    rounded={rounded}
    stacked={stacked}
    color={color}
    className={className}
    alt={displayname || username || t("alt_texts.player")}
    onClick={onClick}
  />
  );
};
