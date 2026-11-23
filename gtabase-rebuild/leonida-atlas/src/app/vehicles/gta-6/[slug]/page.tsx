import { detailRoute } from "@/components/detail/detail-route";

const route = detailRoute("vehicles", "legacy");

export const generateMetadata = route.generateMetadata;
export default route.Page;
