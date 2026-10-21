import type { PrivateDedicationStyle } from "@/lib/db/schema";

const SHARE_TOKEN_LENGTH = 16;
const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16}$/;

type PrivateDedicationSlug = {
  shareToken: string;
  storyStyle: PrivateDedicationStyle | null;
};

function isPrivateDedicationStyle(
  value: string,
): value is PrivateDedicationStyle {
  return ["editorial", "noche", "tinta"].includes(value);
}

export function parsePrivateDedicationSlug(
  slug: string,
): PrivateDedicationSlug | null {
  const separatorIndex = slug.length - SHARE_TOKEN_LENGTH - 2;

  if (separatorIndex < 0 || slug.slice(separatorIndex, separatorIndex + 2) !== "--") {
    return null;
  }

  const shareToken = slug.slice(-SHARE_TOKEN_LENGTH);

  if (!SHARE_TOKEN_PATTERN.test(shareToken)) {
    return null;
  }

  const prefix = slug.slice(0, separatorIndex);
  const styleSeparatorIndex = prefix.lastIndexOf("--");
  const style =
    styleSeparatorIndex === -1 ? "" : prefix.slice(styleSeparatorIndex + 2);

  return {
    shareToken,
    storyStyle: isPrivateDedicationStyle(style) ? style : null,
  };
}
