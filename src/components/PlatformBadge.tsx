import { Platform, PLATFORM_INFO } from "@/lib/types";

interface PlatformBadgeProps {
  platform: Platform;
}

export default function PlatformBadge({ platform }: PlatformBadgeProps) {
  const info = PLATFORM_INFO[platform];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: info.bgColor,
        color: info.color,
      }}
    >
      {info.name}
    </span>
  );
}
