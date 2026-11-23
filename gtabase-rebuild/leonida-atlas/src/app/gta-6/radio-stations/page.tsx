import type { Metadata } from "next";
import Link from "next/link";
import { guideCopy, radioStations } from "@/data";
import { playableTracks } from "@/lib";
import { ArtImage } from "@/components/ui";
import { GuideHeader, SectionHeading } from "@/components/content/GuideParts";
import { FloatingPlayer, RadioProvider, TrackTable, radioClipUrls, radioStationData } from "@/components/radio";

const copy = guideCopy["radio-stations"];

export const metadata: Metadata = { title: copy.title, description: copy.intro };

/** Radio guide (R-1013..R-1021): one block per station with its tracklist, one floating player. */
export default function Page() {
  const stations = radioStations.map(radioStationData);
  return (
    <article className="atlas-guide">
      <GuideHeader heading={copy.heading} intro={copy.intro} />
      <RadioProvider stations={stations} clips={radioClipUrls()}>
        <SectionHeading>{copy.sections[0]}</SectionHeading>
        <div className="atlas-stations">
          {radioStations.map((s, i) => {
            const silent = playableTracks(s).length === 0;
            return (
              <section key={s.slug} className="atlas-station" data-testid={silent ? "station-row station-without-tracks" : "station-row"}>
                <div className="atlas-station-head">
                  <ArtImage art={s.image} alt="" width={84} height={84} className="atlas-station-cover" />
                  <div>
                    <h3 className="atlas-station-name">
                      <Link href={s.canonicalPath} aria-label={`Read more: ${s.name}`}>
                        {s.name}
                      </Link>
                    </h3>
                    <p className="atlas-station-genre">{s.genre}</p>
                  </div>
                </div>
                <TrackTable station={i} />
              </section>
            );
          })}
        </div>
        <FloatingPlayer />
      </RadioProvider>
    </article>
  );
}
