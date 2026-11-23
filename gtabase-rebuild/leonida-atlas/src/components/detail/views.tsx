/**
 * Content of the detail pages owned by the database builder (F2, R-603..R-617): vehicles, weapons, animals,
 * characters, properties and radio stations. Section order and headings come from the rules module
 * (detailSectionTitles); a section without content is left out, gallery sections never (R-606, R-609).
 */
import Link from "next/link";
import type { ReactNode } from "react";
import {
  artUrl,
  displayName,
  getCompareToEntries,
  getManufacturerById,
  getNeighbours,
  getSimilarVehicles,
  getStandoutSetById,
  getVehicleBySlug,
  getVehicleClassById,
  getWeaponBySlug,
  getWeaponClassById,
  listConfig,
  type Animal,
  type Character,
  type GalleryImage,
  type Property,
  type RadioStation,
  type Vehicle,
  type Weapon,
} from "@/data";
import {
  VEHICLE_STAT_LABELS,
  WEAPON_STAT_LABELS,
  compareToHref,
  detailH1,
  detailSectionTitles,
  formatPrice,
  type SectionKey,
  type SectionTitle,
} from "@/lib";
import { ArtImage } from "@/components/ui";
import { FloatingPlayer, RadioProvider, TrackTable, radioClipUrls, radioStationData } from "@/components/radio";
import { DetailShell } from "./DetailShell";
import { GalleryStrip } from "./GalleryStrip";
import { DetailSection, InfoRows, MiniCards, StatsBlock, presentRows, type MiniCardData, type StatRow } from "./parts";

// ---------------------------------------------------------------- helpers

function sectionMap(titles: SectionTitle[]): Map<SectionKey, SectionTitle> {
  return new Map(titles.map((t) => [t.key, t]));
}

/** Renders the sections in the rule order; `content[key]` null/undefined = section left out. */
function Sections({ titles, content }: { titles: SectionTitle[]; content: Partial<Record<SectionKey, ReactNode>> }) {
  return (
    <>
      {titles.map((t) => {
        const body = content[t.key];
        if (body === null || body === undefined || body === false) return null;
        return (
          <DetailSection key={t.key} title={t}>
            {body}
          </DetailSection>
        );
      })}
    </>
  );
}

function Prose({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="m-0 mb-3 max-w-3xl leading-relaxed">{text}</p>;
}

function galleryNode(images: GalleryImage[], label: string, firstIndex = 0) {
  return <GalleryStrip images={images} label={label} thumbs={images.map((i) => artUrl(i.art))} firstIndex={firstIndex} />;
}

function vehicleCard(v: Vehicle): MiniCardData {
  return { title: displayName(v), href: v.canonicalPath, art: v.image };
}

function weaponCard(w: Weapon): MiniCardData {
  return { title: displayName(w), href: w.canonicalPath, art: w.image };
}

function Logo({ makeId }: { makeId: string }) {
  const m = getManufacturerById(makeId);
  if (!m) return <>{makeId}</>;
  return (
    <span className="inline-flex items-center gap-2">
      <ArtImage art={m.logo} alt="" width={24} height={24} className="h-6 w-6 rounded-full" />
      <span>{m.label}</span>
    </span>
  );
}

function neighbours(list: Parameters<typeof getNeighbours>[0], slug: string) {
  const n = getNeighbours(list, slug);
  return {
    prev: n.prev ? { name: n.prev.name, path: n.prev.path } : undefined,
    next: n.next ? { name: n.next.name, path: n.next.path } : undefined,
  };
}

// ---------------------------------------------------------------- vehicles

export function vehicleH1(v: Vehicle): string {
  return detailH1("vehicle", v.name, getManufacturerById(v.make)?.label);
}

export function VehicleDetail({ vehicle: v }: { vehicle: Vehicle }) {
  const make = getManufacturerById(v.make)?.label ?? v.make;
  const h1 = vehicleH1(v);
  const standout = v.standoutSet !== undefined;
  const titles = detailSectionTitles(standout ? "vehicle-standout" : "vehicle", v.name, make);
  const base = v.baseModel ? getVehicleBySlug(v.baseModel) : undefined;
  const variants = v.variants.map((s) => getVehicleBySlug(s)).filter((x): x is Vehicle => !!x);
  const similar = standout ? [] : getSimilarVehicles(v.slug);
  const config = listConfig("vehicles");

  const infoRows = presentRows([
    { label: "Standout Set", value: v.standoutSet ? getStandoutSetById(v.standoutSet)?.label : undefined },
    {
      label: "Vehicle Class",
      value: v.classes.map((c, i) => (
        <span key={c}>
          {i > 0 ? ", " : null}
          <Link href={`/gta-6/vehicles/best-vehicles/?class=${c}`} prefetch={false}>
            {getVehicleClassById(c)?.label ?? c}
          </Link>
        </span>
      )),
    },
    { label: "Manufacturer", value: <Logo makeId={v.make} /> },
    { label: "Style", value: v.style },
    { label: "Era", value: v.era },
    { label: "Specialist", value: v.specialist },
    { label: "Seats", value: String(v.seats) },
    { label: "Based on (Real Life)", value: v.realLife },
    { label: "Mass / Weight", value: v.mass },
    { label: "Base Model", value: base ? <MiniCards cards={[vehicleCard(base)]} titleToken="variants" /> : undefined },
    { label: "Drive Train", value: v.driveTrain },
    { label: "Gears", value: v.gears },
  ]);
  const howRows = standout
    ? []
    : presentRows([
        { label: "Variant / Conversion", value: variants.length ? <MiniCards cards={variants.map(vehicleCard)} titleToken="variants" /> : undefined },
        { label: "Notable Owners", value: v.notableOwners.length ? v.notableOwners.join(", ") : undefined },
      ]);

  const L = VEHICLE_STAT_LABELS;
  const stats: StatRow[] = [
    { label: L[0], value: v.speed, bar: true },
    { label: L[1], value: v.acceleration, bar: true },
    { label: L[2], value: v.asphaltHandling, bar: true },
    { label: L[3], value: v.offroadHandling, bar: true },
    { label: L[4], value: v.strength, bar: true },
    { label: L[5], value: v.offroadRating, bar: false, whole: true },
    { label: "Road rating", value: v.roadRating, bar: false, whole: true, noLabel: true },
  ];

  const compareTo = getCompareToEntries("vehicles", v.slug).map((e) => ({
    slug: e.slug,
    name: e.name,
    href: compareToHref(config.path, "vehicle", v.compareKey, e.compareKey),
  }));
  const screenshots = sectionMap(titles).get("screenshots");

  return (
    <DetailShell
      type="vehicle"
      h1={h1}
      section={{ label: "Vehicles", href: "/gta-6/vehicles/" }}
      list="vehicles"
      slug={v.slug}
      rating={v.rating}
      heroImages={[
        { art: v.image, alt: `${h1} - GTA 6 Vehicle Stats, Price, How To Get` },
        ...(getManufacturerById(v.make) ? [{ art: getManufacturerById(v.make)!.logo, alt: `${make} Manufacturer`, logo: true }] : []),
      ]}
      compareTo={compareTo}
      {...neighbours("vehicles", v.slug)}
    >
      <Sections
        titles={titles}
        content={{
          info: <InfoRows rows={infoRows} />,
          "how-to-get":
            !standout && (v.howToGet || howRows.length) ? (
              <>
                <Prose text={v.howToGet} />
                <InfoRows rows={howRows} />
              </>
            ) : null,
          statistics: (
            <>
              <StatsBlock rows={stats} />
              {similar.length ? (
                <div className="mt-5">
                  <h3 data-testid="similar-title" className="mb-2! font-display text-lg font-bold">
                    Similar Vehicles
                  </h3>
                  <MiniCards cards={similar.map(vehicleCard)} />
                </div>
              ) : null}
            </>
          ),
          description: <Prose text={v.description} />,
          screenshots: v.gallery !== null && screenshots ? galleryNode(v.gallery, screenshots.text) : null,
          appearances: v.appearances.length ? (
            <MiniCards cards={v.appearances.map((a) => ({ title: a }))} titleToken="appearances" />
          ) : null,
        }}
      />
    </DetailShell>
  );
}

// ---------------------------------------------------------------- weapons

export function weaponH1(w: Weapon): string {
  return detailH1("weapon", w.name, getManufacturerById(w.make)?.label);
}

export function WeaponDetail({ weapon: w }: { weapon: Weapon }) {
  const make = getManufacturerById(w.make)?.label ?? w.make;
  const h1 = weaponH1(w);
  const unique = w.type === "unique-variant";
  const titles = detailSectionTitles(unique ? "weapon-unique" : "weapon", w.name, make);
  const base = w.baseModel ? getWeaponBySlug(w.baseModel) : undefined;
  const variants = w.variants.map((s) => getWeaponBySlug(s)).filter((x): x is Weapon => !!x);
  const config = listConfig("weapons");

  const infoRows = presentRows([
    { label: "Manufacturer", value: <Logo makeId={w.make} /> },
    { label: "Weapon Class", value: getWeaponClassById(w.weaponClass)?.label ?? w.weaponClass },
    { label: "Based on (Real Life)", value: w.realLife },
    { label: "Base Model", value: base ? <MiniCards cards={[weaponCard(base)]} titleToken="variants" /> : undefined },
    { label: "Ammo Capacity", value: w.ammoCapacity },
    { label: "Extended Ammo", value: w.extendedAmmo },
  ]);
  const howRows = presentRows([
    { label: "Acquisition Method", value: w.acquisitionMethod },
    { label: "How To Unlock", value: w.howToUnlock },
    { label: "Story Mode Price", value: w.storyModePrice },
    { label: "Modifications", value: w.modifications },
    { label: "Variant / Conversion", value: variants.length ? <MiniCards cards={variants.map(weaponCard)} titleToken="variants" /> : undefined },
  ]);
  const L = WEAPON_STAT_LABELS;
  const stats: StatRow[] = [
    { label: L[0], value: w.damage, bar: true },
    { label: L[1], value: w.accuracy, bar: true },
    { label: L[2], value: w.handling, bar: true },
    { label: L[3], value: w.range, bar: true },
    { label: L[4], value: w.overall, bar: false },
  ];
  const compareTo = getCompareToEntries("weapons", w.slug).map((e) => ({
    slug: e.slug,
    name: e.name,
    href: compareToHref(config.path, "weapon", w.compareKey, e.compareKey),
  }));
  const screenshots = sectionMap(titles).get("screenshots");

  return (
    <DetailShell
      type="weapon"
      h1={h1}
      section={{ label: "Weapons", href: "/gta-6/weapons/" }}
      list="weapons"
      slug={w.slug}
      rating={w.rating}
      compareTo={compareTo}
      {...neighbours("weapons", w.slug)}
    >
      <Sections
        titles={titles}
        content={{
          description: w.description ? <Prose text={w.description} /> : null,
          info: (
            <>
              <ArtImage art={w.image} alt={h1} className="mb-4 aspect-[16/9] w-full max-w-2xl rounded-xl bg-sand object-cover" />
              <InfoRows rows={infoRows} />
            </>
          ),
          "how-to-get": howRows.length ? <InfoRows rows={howRows} /> : null,
          statistics: <StatsBlock rows={stats} />,
          screenshots: screenshots ? galleryNode(w.gallery, screenshots.text) : null,
          appearances: w.appearances.length ? (
            <MiniCards cards={w.appearances.map((a) => ({ title: a }))} titleToken="appearances" />
          ) : null,
        }}
      />
    </DetailShell>
  );
}

// ---------------------------------------------------------------- animals

export function AnimalDetail({ animal: a }: { animal: Animal }) {
  const titles = detailSectionTitles("animal", a.name);
  const rows = presentRows([
    { label: "Animal Category", value: a.animalCategory },
    { label: "Habitat", value: a.habitat },
    { label: "Recommended Weapon", value: a.recommendedWeapon },
    { label: "Animal Species", value: a.species },
    { label: "Animal Class", value: a.animalClass },
  ]);
  const shots = sectionMap(titles).get("screenshots");
  return (
    <DetailShell
      type="animal"
      h1={a.name}
      section={{ label: "Animals", href: "/gta-6/animals/" }}
      list="animals"
      slug={a.slug}
      rating={a.rating}
      {...neighbours("animals", a.slug)}
    >
      <Sections
        titles={titles}
        content={{
          info: (
            <>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                <ArtImage art={a.image} alt={a.name} className="aspect-[4/3] w-full rounded-xl bg-sand object-cover sm:w-64" />
                <Prose text={a.description} />
              </div>
              <InfoRows rows={rows} />
            </>
          ),
          screenshots: shots ? galleryNode(a.gallery, shots.text) : null,
        }}
      />
    </DetailShell>
  );
}

// ---------------------------------------------------------------- characters

export function CharacterDetail({ character: c }: { character: Character }) {
  const titles = detailSectionTitles("character", c.name);
  const vehicles = c.vehicles.map((s) => getVehicleBySlug(s)).filter((x): x is Vehicle => !!x);
  const rows = presentRows([
    { label: "Role", value: c.role },
    { label: "Gender", value: c.gender },
    { label: "Born In Year", value: c.bornInYear },
    { label: "Nationality", value: c.nationality },
    { label: "Location", value: c.location },
    { label: "Occupation", value: c.occupation },
    { label: "Also Known As", value: c.alsoKnownAs },
    { label: "Performer / Actor", value: c.performer },
    { label: "Family", value: c.family },
    { label: "Affiliation", value: c.affiliation },
    { label: "Property / Safehouse", value: c.propertySafehouse },
    { label: "Vehicles", value: vehicles.length ? <MiniCards cards={vehicles.map(vehicleCard)} /> : undefined },
  ]);
  const m = sectionMap(titles);
  const shots = m.get("screenshots");
  const arts = m.get("artworks");
  return (
    <DetailShell
      type="character"
      h1={c.name}
      section={{ label: "Characters", href: "/gta-6/characters/" }}
      list="characters"
      slug={c.slug as string}
      rating={c.rating}
      {...neighbours("characters", c.slug as string)}
    >
      <Sections
        titles={titles}
        content={{
          info: (
            <>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                <ArtImage art={c.image} alt={c.name} className="aspect-[4/5] w-full rounded-xl bg-sand object-cover sm:w-56" />
                <Prose text={c.description} />
              </div>
              <InfoRows rows={rows} />
            </>
          ),
          screenshots: shots ? galleryNode(c.screenshots, shots.text) : null,
          artworks: arts ? galleryNode(c.artworks, arts.text, c.screenshots.length) : null,
          video: (
            <figure aria-label="Video player" data-testid="video-embed" className="m-0">
              <div className="relative overflow-hidden rounded-xl bg-ink">
                {c.video ? (
                  <ArtImage art={c.video} alt="" className="aspect-video w-full object-cover opacity-80" />
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-teal to-ink" />
                )}
                <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-coral text-ink shadow-soft">
                    <svg viewBox="0 0 24 24" width="28" height="28">
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                  </span>
                </span>
              </div>
              <figcaption className="mt-2 text-sm text-muted">Video placeholder: the trailer clip is coming later.</figcaption>
            </figure>
          ),
        }}
      />
    </DetailShell>
  );
}

// ---------------------------------------------------------------- properties

export function PropertyDetail({ property: p }: { property: Property }) {
  const titles = detailSectionTitles("property", p.name);
  const info = presentRows([
    { label: "Property Type", value: p.propertyType },
    { label: "Property Style", value: p.propertyStyle },
    { label: "Location", value: p.location },
    { label: "State / Region", value: p.region },
    { label: "Vehicles Capacity", value: typeof p.vehicleCapacity === "number" ? String(p.vehicleCapacity) : undefined },
  ]);
  const how = presentRows([
    { label: "How To Unlock", value: p.howToUnlock },
    { label: "Story Mode Price", value: typeof p.price === "number" ? formatPrice(p.price) : undefined },
  ]);
  return (
    <DetailShell
      type="property"
      h1={p.name}
      section={{ label: "Properties", href: "/gta-6/properties/" }}
      list="properties"
      slug={p.slug}
      rating={p.rating}
      {...neighbours("properties", p.slug)}
    >
      <Sections
        titles={titles}
        content={{
          "property-intro": (
            <>
              <Prose text={p.howToGet} />
              <ArtImage art={p.image} alt={p.name} className="aspect-[16/9] w-full max-w-2xl rounded-xl bg-sand object-cover" />
            </>
          ),
          "map-location": (
            <figure className="m-0">
              <ArtImage art={p.mapImage} alt={`${p.name} on the map`} className="aspect-[4/3] w-full max-w-xl rounded-xl border border-sand-dark object-cover" />
              {p.markerId ? (
                <figcaption className="mt-2 text-sm">
                  <Link href={`/gta-6/map/#${p.markerId}`}>Open it on the interactive map</Link>
                </figcaption>
              ) : null}
            </figure>
          ),
          info: (
            <>
              <Prose text={p.description} />
              <InfoRows rows={info} />
            </>
          ),
          "how-to-get": how.length ? <InfoRows rows={how} /> : null,
        }}
      />
    </DetailShell>
  );
}

// ---------------------------------------------------------------- radio stations

export function RadioDetail({ station: r }: { station: RadioStation }) {
  const titles = detailSectionTitles("radio-station", r.name);
  const rows = presentRows([
    { label: "Music Genre", value: r.genre },
    { label: "Radio Host", value: r.host },
  ]);
  return (
    <DetailShell
      type="radio-station"
      h1={r.name}
      section={{ label: "Radio Stations", href: "/gta-6/radio-stations/" }}
      list="radio-stations"
      slug={r.slug}
      rating={r.rating}
      {...neighbours("radio-stations", r.slug)}
    >
      <RadioProvider stations={[radioStationData(r)]} clips={radioClipUrls()}>
        <Sections
          titles={titles}
          content={{
            info: (
              <>
                <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                  <ArtImage art={r.image} alt={r.name} className="aspect-square w-full rounded-xl bg-sand object-cover sm:w-48" />
                  <Prose text={r.description} />
                </div>
                <InfoRows rows={rows} />
              </>
            ),
            tracklist: (
              <div className="overflow-x-auto">
                <TrackTable station={0} tokens={false} />
              </div>
            ),
          }}
        />
        <FloatingPlayer />
      </RadioProvider>
    </DetailShell>
  );
}
