import { ErrorState } from "@/components/state";

const NotFound = () => {
  return (
    <ErrorState
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
    />
  );
};

export default NotFound;
