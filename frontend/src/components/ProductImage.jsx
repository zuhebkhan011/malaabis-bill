import React, { useState } from "react";
import { getProductImageUrl, getFallbackImage } from "../utils/imageUrl";

/**
 * ProductImage — renders a product image with graceful error fallback.
 * When the primary image fails (e.g. broken /uploads/ on Render server),
 * it automatically switches to a curated fashion fallback image.
 */
export default function ProductImage({
  src,
  alt = "",
  className = "",
  style = {},
  productName = "",
}) {
  const primaryUrl = getProductImageUrl(src);
  const fallbackUrl = getFallbackImage(productName || alt);

  const [currentSrc, setCurrentSrc] = useState(primaryUrl);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (!failed) {
      setFailed(true);
      setCurrentSrc(fallbackUrl);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
    />
  );
}
