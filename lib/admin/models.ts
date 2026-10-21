export type PlaylistCardTone = "bolero" | "stories" | "dedication";

export type AdminPlaylistViewModel = {
  id: string;
  title: string;
  description: string;
  spotifyUrl: string;
  imageUrl: string;
  label: string;
  visible: boolean;
  order: number;
  tone: PlaylistCardTone;
};

export type RibbonItemKind = "artist" | "song" | "phrase";

export type RibbonItemViewModel = {
  id: string;
  label: string;
  kind: RibbonItemKind;
  visible: boolean;
  order: number;
};

export type AboutImageViewModel = {
  id: string;
  imageUrl: string;
  altText: string;
  objectPosition: string;
  visible: boolean;
  order: number;
};

export type DedicationRecommendationViewModel = {
  id: string;
  moodKey: string;
  moodLabel: string;
  moodDescription: string;
  song: string;
  artist: string;
  description: string;
  playlistUrl: string;
  spotifyTrackId: string;
  spotifyUrl: string;
  visible: boolean;
  order: number;
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
  imageAlt: string;
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
