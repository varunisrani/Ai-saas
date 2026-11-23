import { detailRoute } from "@/components/detail/detail-route";

const route = detailRoute("animals", "gta6");

export const generateMetadata = route.generateMetadata;
export default route.Page;
