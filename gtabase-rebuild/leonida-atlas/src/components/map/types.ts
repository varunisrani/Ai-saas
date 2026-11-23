/** Serializable map data handed from the server page to the client map (trace F4 §T1: data inline in the page). */

export interface MapGroupData {
  id: string;
  name: string;
  color: string;
}

export interface MapCategoryData {
  id: string;
  name: string;
  singularName: string;
  group: string;
  trackable: boolean;
  hiddenByDefault: boolean;
  multiSpawn: boolean;
  slug?: string;
  linkKey: string;
}

export interface MapMarkerData {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  description?: string;
  /** Placeholder screenshot (art kind + id). */
  image?: { kind: "marker"; id: string; width: number; height: number };
  detailsPath?: string;
}

export interface MapArtData {
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  island: [number, number][];
  lagoons: [number, number][][];
  roads: [number, number][][];
  regions: { id: string; name: string; labelX: number; labelY: number }[];
}

export interface MapSettings {
  minZoom: number;
  maxZoom: number;
  startZoom: number;
  closeZoom: number;
  clusterBelowZoom: number;
  startMarkerId: string;
  notice: { start: string; end: string; heading: string; text: string };
}

export interface MapAppProps {
  groups: MapGroupData[];
  /** Categories with markers, in config order (R-1609). */
  categories: MapCategoryData[];
  markers: MapMarkerData[];
  art: MapArtData;
  settings: MapSettings;
  /** One-category page (R-819): the category of a valid `?feature=` key. */
  featureCategoryId: string | null;
  /** Sidebar h1 text (normal case; shown in capitals). */
  heading: string;
}
