/**
 * Radio player (owned by UI-A). Station detail pages (UI-B) can reuse it for a single station:
 *   <RadioProvider stations={[radioStationData(station)]} clips={radioClipUrls()}>
 *     <TrackTable station={0} tokens={false} />
 *     <FloatingPlayer />
 *   </RadioProvider>
 */
export { RadioProvider, TrackTable, FloatingPlayer } from "./RadioPlayer";
export type { RadioStationData, RadioTrackData } from "./RadioPlayer";
export { radioStationData, radioClipUrls } from "./radio-data";
