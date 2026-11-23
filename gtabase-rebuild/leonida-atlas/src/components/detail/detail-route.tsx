/**
 * Route glue of the detail pages (R-601, R-602, R-603, R-008): resolves `<list>/<slug>` in either path form (both
 * render the same page, no redirect, the canonical path is declared as the canonical link); an unknown slug is the
 * 404 page. Vehicle routes also serve the class rankings `best-<page slug>` (R-716) — the ranking pages share the
 * dynamic segment with the vehicle slugs.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getItemByPath, getVehicleClassById, getVehicleClassByPageSlug, type DetailLookup, type PathForm } from "@/data";
import { detailTitle } from "@/lib";
import { RankingView, rankingMetadata } from "../compare/RankingView";
import {
  AnimalDetail,
  CharacterDetail,
  PropertyDetail,
  RadioDetail,
  VehicleDetail,
  WeaponDetail,
  vehicleH1,
  weaponH1,
} from "./views";

export type OwnedDetailList = "vehicles" | "weapons" | "animals" | "characters" | "properties" | "radio-stations";

type Params = Promise<{ slug: string }>;

function rankingClass(list: OwnedDetailList, form: PathForm, slug: string) {
  if (list !== "vehicles" || form !== "gta6" || !slug.startsWith("best-")) return undefined;
  return getVehicleClassByPageSlug(slug);
}

function lookup(list: OwnedDetailList, form: PathForm, slug: string): DetailLookup | undefined {
  const found = getItemByPath(list, slug, form);
  if (!found) return undefined;
  const allowed: Record<OwnedDetailList, DetailLookup["type"]> = {
    vehicles: "vehicle",
    weapons: "weapon",
    animals: "animal",
    characters: "character",
    properties: "property",
    "radio-stations": "radio",
  };
  return found.type === allowed[list] ? found : undefined;
}

function titleOf(found: DetailLookup): string {
  switch (found.type) {
    case "vehicle": {
      const cls = getVehicleClassById(found.item.classes[0]);
      return detailTitle("vehicle", vehicleH1(found.item), cls?.titleNoun);
    }
    case "weapon":
      return detailTitle(
        "weapon",
        weaponH1(found.item),
        undefined,
        found.item.type === "unique-variant" ? found.item.name : undefined,
      );
    case "animal":
      return detailTitle("animal", found.item.name);
    case "character":
      return detailTitle("character", found.item.name);
    case "property":
      return detailTitle("property", found.item.name);
    case "radio":
      return detailTitle("radio-station", found.item.name);
    default:
      return found.canonicalPath;
  }
}

function descriptionOf(found: DetailLookup): string | undefined {
  const item = found.item as { description?: string };
  return item.description;
}

export function detailRoute(list: OwnedDetailList, form: PathForm) {
  async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params;
    const cls = rankingClass(list, form, slug);
    if (cls) return rankingMetadata(cls, cls.rankingPath);
    const found = lookup(list, form, slug);
    if (!found) return {};
    return {
      title: { absolute: titleOf(found) },
      description: descriptionOf(found),
      alternates: { canonical: found.canonicalPath },
    };
  }

  async function Page({ params }: { params: Params }) {
    const { slug } = await params;
    const cls = rankingClass(list, form, slug);
    if (cls) return <RankingView cls={cls} />;
    const found = lookup(list, form, slug);
    if (!found) notFound();
    switch (found.type) {
      case "vehicle":
        return <VehicleDetail vehicle={found.item} />;
      case "weapon":
        return <WeaponDetail weapon={found.item} />;
      case "animal":
        return <AnimalDetail animal={found.item} />;
      case "character":
        return <CharacterDetail character={found.item} />;
      case "property":
        return <PropertyDetail property={found.item} />;
      case "radio":
        return <RadioDetail station={found.item} />;
      default:
        notFound();
    }
  }

  return { generateMetadata, Page };
}
