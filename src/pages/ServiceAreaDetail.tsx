import { useParams, Navigate } from "react-router-dom";
import { getAreaBySlug } from "@/data/serviceAreas";
import { getCityContent } from "@/data/cityContent";
import CityPage from "@/components/CityPage";

// Legacy imports for non-enhanced cities
import LegacyCityPage from "@/components/LegacyCityPage";

const ServiceAreaDetail = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const area = citySlug ? getAreaBySlug(citySlug) : undefined;

  // De-risk redirect: pruned /areas/{city} pages fall back to the areas hub.
  if (!area) return <Navigate to="/areas" replace />;

  // Check if this city has enhanced content
  const content = getCityContent(citySlug!);

  if (content) {
    return <CityPage content={content} areaPhoto={area.photo} areaTagline={area.tagline} />;
  }

  // Fallback to legacy page for non-enhanced cities
  return <LegacyCityPage area={area} citySlug={citySlug!} />;
};

export default ServiceAreaDetail;
