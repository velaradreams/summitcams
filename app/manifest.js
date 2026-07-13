export default function manifest() {
  return {
    name: "SummitCams — Colorado Snow Stake Webcams",
    short_name: "SummitCams",
    description:
      "Live snow stake webcams from Colorado ski resorts, all on one page.",
    start_url: "/",
    display: "standalone",
    background_color: "#060a13",
    theme_color: "#060a13",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
