export type BackgroundMode = "ALL" | "GROUP" | "SINGLE";

export type BackgroundImageItem = {
  id: number;
  url: string;
  title: string | null;
  groupKey: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BackgroundApiResponse = {
  backgroundUrl: string | null;
  mode: BackgroundMode;
  group: string | null;
  imageId: number | null;
  selectedBackgrounds: BackgroundImageItem[];
};
