import { useParams } from "react-router-dom";
import { getAreaBySlug } from "@/data/serviceAreas";
import { getCityContent } from "@/data/cityContent";
import CityPage from "@/components/CityPage";
import LegacyCityPage from "@/components/LegacyCityPage";
import RemovedRouteRedirect from "@/components/RemovedRouteRedirect";

const ServiceAreaDetail = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const area = citySlug ? getAreaBySlug(citySlug) : undefined;

  // Pruned /areas/{city} pages: emit noindex + canonical to /areas then redirect,
  // so search engines drop the removed URL instead of treating a JS-only
  // <Navigate/> as a soft-200 with cached snapshot content.
  if (!area) return <RemovedRouteRedirect to="/areas" />;

  const content = getCityContent(citySlug!);
  if (content) {
    return <CityPage content={content} areaPhoto={area.photo} areaTagline={area.tagline} />;
  }
  return <LegacyCityPage area={area} citySlug={citySlug!} />;
};

export default ServiceAreaDetail;
