import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../lib/legal";

const LOGO_SRC = "/citealpha-logo.png";
const LOGO_DISPLAY_WEBP = "/citealpha-logo-display.webp";
const LOGO_DISPLAY_PNG = "/citealpha-logo-display.png";

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
    <picture>
      <source srcSet={LOGO_DISPLAY_WEBP} type="image/webp" />
      <source srcSet={LOGO_DISPLAY_PNG} type="image/png" />
      <img
        src={LOGO_SRC}
        alt={PRODUCT_NAME}
        className={`brand-logo ${compact ? "brand-logo-mark" : "brand-logo-wordmark"} ${className}`.trim()}
        width={compact ? 48 : 168}
        height={compact ? 32 : 112}
        decoding="async"
      />
    </picture>
  );

  if (!link) return img;

  return (
    <Link to="/" className="brand brand-logo-link" aria-label={`${PRODUCT_NAME} home`}>
      {img}
    </Link>
  );
}
