import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useI18n } from "../i18n";
import { listBlogPosts } from "../lib/blogPosts";
import { PRODUCT_NAME } from "../lib/legal";

export default function BlogIndexPage() {
  const { t } = useI18n();
  const posts = listBlogPosts();

  return (
    <section className="blog-page" data-testid="blog-index">
      <p className="page-kicker">{t("ui.BlogIndexPage.kicker")}</p>
      <h1>{t("ui.BlogIndexPage.title")}</h1>
      <p className="muted lede">
        {t("ui.BlogIndexPage.lede", { product: PRODUCT_NAME })}
      </p>
      <Disclaimer />
      <ul className="blog-list">
        {posts.map((post) => (
          <li key={post.slug} className="blog-list-item">
            <Link to={`/blog/${post.slug}`} className="blog-list-link">
              <time dateTime={post.published}>{post.published}</time>
              <h2>{post.title}</h2>
              <p className="muted">{post.description}</p>
              <span className="blog-meta">
                {t("ui.BlogIndexPage.minutes", { n: post.readingMinutes })} · {post.tags.join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
