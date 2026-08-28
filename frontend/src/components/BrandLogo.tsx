import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../lib/legal";

const LOGO_SRC = "/citealpha-logo.png";

type BrandLogoProps = {
  /** Header wordmark (default) or compact sizing for console chrome. */
  variant?: "header" | "mark";
  className?: string;
  link?: boolean;
};

export default function BrandLogo({
  variant = "header",
  className = "",
  link = true,
}: BrandLogoProps) {
  const compact = variant === "mark";
  const img = (
    <img
      src={LOGO_SRC}
      alt={PRODUCT_NAME}
      className={`brand-logo ${compact ? "brand-logo-mark" : "brand-logo-wordmark"} ${className}`.trim()}
      width={compact ? 120 : 168}
      height={compact ? 28 : 40}
      decoding="async"
    />
  );

  if (!link) return img;

  return (
    <Link to="/" className="brand brand-logo-link" aria-label={`${PRODUCT_NAME} home`}>
      {img}
    </Link>
  );
}
