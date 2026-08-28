import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { listBlogPosts } from "../lib/blogPosts";
import { PRODUCT_NAME } from "../lib/legal";

export default function BlogIndexPage() {
  const posts = listBlogPosts();

  return (
    <section className="blog-page" data-testid="blog-index">
      <p className="page-kicker">Research blog</p>
      <h1>Guidance credibility, evidence, and desk workflows</h1>
      <p className="muted lede">
        Practical articles from {PRODUCT_NAME} on measuring management delivery — not sentiment, not
        stock tips. Every piece stays factual for Indian equity research teams.
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
                {post.readingMinutes} min · {post.tags.join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
