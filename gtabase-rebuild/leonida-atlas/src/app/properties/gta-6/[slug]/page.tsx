import { detailRoute } from "@/components/detail/detail-route";

const route = detailRoute("properties", "legacy");

export const generateMetadata = route.generateMetadata;
export default route.Page;
