import React from "react";

type YouTubeEmbedProps = {
  videoId: string;
};

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoId }) => {
  return (
    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="YouTube video"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default YouTubeEmbed;
