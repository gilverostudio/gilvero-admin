import { type ReactNode } from "react";

type PageTitleProps = {
  eyebrow: string;
  title: ReactNode;
  copy?: ReactNode;
  action?: ReactNode;
};

/** Heading block at the top of every admin screen — mirrors the website's SectionHeading. */
export function PageTitle({ eyebrow, title, copy, action }: PageTitleProps) {
  return (
    <div className="reveal flex flex-col gap-5 pb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-3xl leading-[1.08] sm:text-[2.5rem]">{title}</h1>
        {copy ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{copy}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
