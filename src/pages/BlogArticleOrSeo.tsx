import { useParams } from "react-router-dom";
import { getBlogArticleBySlug } from "@/data/blogArticles";
import BlogArticle from "./BlogArticle";
import SeoLanding from "./SeoLanding";

// Lives in its own lazy chunk so the large blog/SEO data files stay out of the main bundle.
const BlogArticleOrSeo = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getBlogArticleBySlug(slug) : undefined;
  if (article) return <BlogArticle />;
  return <SeoLanding />;
};

export default BlogArticleOrSeo;
