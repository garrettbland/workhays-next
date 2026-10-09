import { marked } from "marked";
import { PAGES, type PageKey } from "@/content/pages";
import { sanitizeRichText } from "@/lib/sanitize";

export function InfoPage({ page }: { page: PageKey }) {
  const { title, markdown } = PAGES[page];
  const html = sanitizeRichText(marked.parse(markdown, { async: false }) as string);
  return (
    <main className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-12">
      <h1 className="condensed text-[40px] sm:text-[52px]">{title}</h1>
      <div className="mt-8 border-t-[3px] border-ink pt-8">
        <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </main>
  );
}
