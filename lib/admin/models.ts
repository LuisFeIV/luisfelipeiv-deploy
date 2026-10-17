export type PlaylistCardTone = "bolero" | "stories" | "dedication";

export type AdminPlaylistViewModel = {
  id: string;
  title: string;
  description: string;
  spotifyUrl: string;
  label: string;
  visible: boolean;
  order: number;
  tone: PlaylistCardTone;
};

export type AdminPlaylistDraft = Omit<AdminPlaylistViewModel, "id" | "order">;

export type PublicNumberViewModel = {
  id: string;
  platform: string;
  value: string;
  suffix: string;
  description: string;
  visible: boolean;
  order: number;
};

export type PublicNumberDraft = Omit<PublicNumberViewModel, "id" | "order">;

export type ArchiveItemViewModel = {
  id: string;
  title: string;
  subtitle: string;
  metric: string;
  destinationUrl: string;
  imagePath: string;
  visible: boolean;
  order: number;
};

export type ArchiveItemDraft = Omit<ArchiveItemViewModel, "id" | "order">;

export type CommunityStoryViewModel = {
  id: string;
  song: string;
  artist: string;
  story: string;
  feeling: string;
  visible: boolean;
  order: number;
};

export type CommunityStoryDraft = Omit<CommunityStoryViewModel, "id" | "order">;
