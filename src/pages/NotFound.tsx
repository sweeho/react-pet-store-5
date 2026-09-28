import { ErrorState } from "@/components/state";
import { useScreen } from "@/i18n/screens";

const NotFound = () => {
  const t = useScreen("not-found");

  return <ErrorState title={t.title} description={t.description} />;
};

export default NotFound;
