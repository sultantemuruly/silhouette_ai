import React from "react";

type YouTubeEmbedProps = {
  videoId: string;
};

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoId }) => {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      frameBorder="0"
      allow="autoplay; encrypted-media"
      allowFullScreen
      title="YouTube video"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
};

export default YouTubeEmbed;
