import { Link } from "react-router";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * The small crumb trail every catalog mockup shows above its heading
 * (mockup-category/product/item/search). The last item is the current
 * page and is never a link.
 */
export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-muted-foreground-1 flex flex-wrap gap-1.5 text-sm">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {item.to ? (
            <Link to={item.to} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <b className="text-foreground font-semibold">{item.label}</b>
          )}
        </span>
      ))}
    </nav>
  );
}
