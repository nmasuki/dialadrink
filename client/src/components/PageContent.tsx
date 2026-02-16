import type { IPage } from "@/models/Page";

interface PageContentProps {
  page: IPage;
  showBrief?: boolean;
}

export default function PageContent({ page, showBrief = true }: PageContentProps) {
  const hasContent = page.content && page.content.trim().length > 0;
  const hasBrief = showBrief && page.breafContent && page.breafContent.trim().length > 0;

  if (!hasContent && !hasBrief) return null;

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      {hasBrief && (
        <div
          className="text-gray-600 text-lg leading-relaxed mb-6"
          dangerouslySetInnerHTML={{ __html: page.breafContent }}
        />
      )}
      {hasContent && (
        <div
          className="prose prose-gray max-w-none prose-headings:text-gray-800 prose-a:text-teal prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-700"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      )}
    </section>
  );
}
