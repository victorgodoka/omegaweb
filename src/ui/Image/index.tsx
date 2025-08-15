import React from "react";
import { useTranslation } from "react-i18next";

interface ImageProps
  extends React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  > {
  defaultSrc: string;
}

const Image = ({ src, defaultSrc, alt, ...props }: ImageProps) => {
  const { t } = useTranslation();
  const handleError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = event.currentTarget;
    target.onerror = null;
    target.src = defaultSrc;
  };

  return (
    <img
      src={src}
      alt={alt || t("alt_texts.image")}
      onError={handleError}
      {...props}
    />
  );
};

export default Image;
