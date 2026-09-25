type StaticSiteProps = {
  markup: string;
};

export function StaticSite({ markup }: StaticSiteProps) {
  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: markup }} />;
}
