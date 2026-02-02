interface PageBannerProps {
  url: string;
  pageId: string;
}

export default function PageBanner({ url }: PageBannerProps) {
  return (
    <div className="w-full h-48 bg-muted overflow-hidden">
      <img
        src={url}
        alt="Page banner"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
