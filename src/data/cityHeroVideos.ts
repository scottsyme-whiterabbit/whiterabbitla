// Looping aerial hero videos for select city pages under /areas/:citySlug.
// Each entry points at a CDN-hosted .asset.json pointer in src/assets/city-heroes/.
// Cities without an entry keep the standard photo hero.

import losAngelesVideo from "@/assets/city-heroes/city-los-angeles.mp4.asset.json";
import losAngelesPoster from "@/assets/city-heroes/city-los-angeles-poster.jpg.asset.json";
import lasVegasVideo from "@/assets/city-heroes/city-las-vegas.mp4.asset.json";
import lasVegasPoster from "@/assets/city-heroes/city-las-vegas-poster.jpg.asset.json";
import miamiVideo from "@/assets/city-heroes/city-miami.mp4.asset.json";
import miamiPoster from "@/assets/city-heroes/city-miami-poster.jpg.asset.json";
import newYorkVideo from "@/assets/city-heroes/city-new-york.mp4.asset.json";
import newYorkPoster from "@/assets/city-heroes/city-new-york-poster.jpg.asset.json";
import sanFranciscoVideo from "@/assets/city-heroes/city-san-francisco.mp4.asset.json";
import sanFranciscoPoster from "@/assets/city-heroes/city-san-francisco-poster.jpg.asset.json";

export interface CityHeroVideo {
  video: string;
  poster: string;
}

export const cityHeroVideos: Record<string, CityHeroVideo> = {
  "los-angeles": { video: losAngelesVideo.url, poster: losAngelesPoster.url },
  "las-vegas": { video: lasVegasVideo.url, poster: lasVegasPoster.url },
  "miami": { video: miamiVideo.url, poster: miamiPoster.url },
  "new-york": { video: newYorkVideo.url, poster: newYorkPoster.url },
  "san-francisco": { video: sanFranciscoVideo.url, poster: sanFranciscoPoster.url },
};

export const getCityHeroVideo = (citySlug: string): CityHeroVideo | undefined =>
  cityHeroVideos[citySlug];
