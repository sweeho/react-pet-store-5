import type { PageInfo } from "../../../lib/catalog/paging";

export interface PagingLinksProps {
  paging: PageInfo;
  makeHref: (start: number) => string;
}

export default function PagingLinks(props: PagingLinksProps): never {
  void props;
  throw new Error("VortexNotImplemented");
}
