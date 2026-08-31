import { Link, Navigate, useParams } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { getBlogPost, listBlogPosts } from "../lib/blogPosts";
import { BLOG_BYLINE, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

export default function BlogPostPage() {
  const { slug = "" } = useParams();
  const post = getBlogPost(slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const others = listBlogPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 4);

  return (
    <article className="blog-page blog-post" data-testid="blog-post">
      <p className="page-kicker">
        <Link to="/blog">Research blog</Link>
      </p>
      <header className="blog-post-header">
        <h1>{post.title}</h1>
        <p className="blog-meta">
          <span className="blog-byline">{BLOG_BYLINE}</span>
          {" · "}
          <time dateTime={post.published}>{post.published}</time>
          {post.updated && post.updated !== post.published ? (
            <>
              {" · "}
              <time dateTime={post.updated}>Updated {post.updated}</time>
            </>
          ) : null}
          {" · "}
          {post.readingMinutes} min read
          {" · "}
          {post.tags.join(" · ")}
        </p>
        <p className="muted lede">{post.description}</p>
      </header>
      <Disclaimer />
      <div className="blog-body">
        {post.sections.map((section, i) => (
          <section key={i} className="blog-section">
            {section.heading && <h2>{section.heading}</h2>}
            {section.paragraphs.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </section>
        ))}
      </div>
      <footer className="blog-post-footer panel">
        <p>
          {PRODUCT_NAME} is a product of {LEGAL_ENTITY}. Factual research tooling — not investment
          advice. No Buy / Hold / Sell.
        </p>
        <div className="about-cta-row">
          <Link to="/tracker" className="btn primary">
            Open GCI Tracker
          </Link>
          <Link to="/package" className="btn">
            Package &amp; pricing
          </Link>
          <Link to="/blog" className="btn ghost">
            All articles
          </Link>
        </div>
      </footer>
      {others.length > 0 && (
        <aside className="blog-related">
          <h2>More from the blog</h2>
          <ul>
            {others.map((p) => (
              <li key={p.slug}>
                <Link to={`/blog/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
