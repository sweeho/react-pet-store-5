import {
  ChartPie,
  CircleCheck,
  ClipboardList,
  Info,
  LogOut,
  ShieldCheck,
  SquareArrowOutUpRight,
} from "lucide-react";
import { Link } from "react-router";

import { ErrorState } from "@/components/state";
import { Button } from "@/components/ui/button";
import { useAdminStrings } from "@/i18n/admin/useAdminStrings";

interface StaffSessionResponse {
  signedOn: boolean;
  userId: string | null;
  isAdministrator: boolean;
}

interface LaunchDescriptor {
  host: string;
  port: number;
  sessionId: string;
  ordersUrl: string;
}

async function fetchStaffSession(): Promise<StaffSessionResponse> {
  const response = await fetch("/api/staff/session?realm=admin");
  return (await response.json()) as StaffSessionResponse;
}

async function postStaffSignOff(): Promise<{ redirect: string }> {
  const response = await fetch("/api/staff/signoff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ realm: "admin" }),
  });
  return (await response.json()) as { redirect: string };
}

async function fetchLaunchDescriptor(): Promise<LaunchDescriptor | null> {
  const response = await fetch("/api/admin/launch");
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as LaunchDescriptor;
}

/**
 * SWHR-R-0075, SWHR-R-0076, SWHR-R-0078, SWHR-R-0079: role-gated console.
 * Not signed on (or idle-expired — `GET /api/staff/session` reports it the
 * same way as never having signed on) redirects to `/admin/signin`;
 * signed on without the role shows access-refused (SWHR-R-0075.02); with
 * the role, Manage Orders (SWHR-R-0081, via `GET /api/admin/launch`) and
 * Sign Out (SWHR-R-0078).
 */
export default function AdminConsolePage() {
  const strings = useAdminStrings();
  const navigate = useNavigate();
  const [session, setSession] = useState<StaffSessionResponse | null>(null);
  const [launchFailed, setLaunchFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchStaffSession().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.signedOn) {
        navigate("/admin/signin", { replace: true });
        return;
      }
      setSession(result);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    const result = await postStaffSignOff();
    navigate(result.redirect);
  };

  const handleLaunch = async () => {
    const descriptor = await fetchLaunchDescriptor();
    if (descriptor) {
      navigate("/admin/orders");
    } else {
      setLaunchFailed(true);
    }
  };

  if (!session) {
    return null;
  }

  if (!session.isAdministrator) {
    return (
      <div className="p-8">
        <ErrorState
          title={strings.accessRefusedTitle.label}
          description={strings.accessRefusedDescription.label}
        />
      </div>
    );
  }

  const workspace = [
    {
      icon: ClipboardList,
      title: strings.pendingTab,
      text: strings.workspacePendingText,
      primary: true,
    },
    { icon: CircleCheck, title: strings.nonPendingTab, text: strings.workspaceNonPendingText },
    { icon: ChartPie, title: strings.salesSegment, text: strings.workspaceSalesText },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-8 pt-6 pb-10">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground-1 flex items-center gap-2 text-sm"
      >
        <Link to="/">{strings.crumbHome.label}</Link>
        <span>/</span>
        <b className="text-foreground font-medium">{strings.crumbAdministration.label}</b>
      </nav>
      <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_380px]">
        <section className="from-primary-50 to-background border-line-2 flex flex-col justify-center gap-5 rounded-xl border bg-gradient-to-br to-55% p-10">
          <span className="text-primary inline-flex items-center gap-2 text-[13px] font-semibold">
            <ShieldCheck aria-hidden="true" className="size-4.5" />
            {strings.consoleBadge.label}
          </span>
          <h1 className="text-[32px] leading-tight font-bold tracking-tight">
            {strings.consoleTitle.label}
          </h1>
          <p className="text-muted-foreground-2 max-w-155 text-base">
            {strings.consoleDescription.label}
          </p>
          <div className="mt-2 flex gap-2.5">
            <Button size="lg" onClick={() => void handleLaunch()}>
              <SquareArrowOutUpRight aria-hidden="true" className="mr-2 size-4" />
              {strings.launchClientButton.label}
            </Button>
            <Button size="lg" variant="outline" onClick={() => void handleSignOut()}>
              <LogOut aria-hidden="true" className="mr-2 size-4" />
              {strings.logoutButton.label}
            </Button>
          </div>
          {launchFailed ? (
            <p role="alert" className="text-destructive text-sm">
              {strings.launchFailed.label}
            </p>
          ) : null}
        </section>
        <aside className="bg-background border-line-2 flex flex-col gap-4.5 rounded-xl border p-6">
          <h2 className="text-base font-semibold">{strings.workspaceHeading.label}</h2>
          {workspace.map(({ icon: Icon, title, text, primary }) => (
            <div key={title.label} className="flex gap-3.5">
              <span
                aria-hidden="true"
                className={
                  primary
                    ? "bg-primary-50 text-primary grid size-10 flex-none place-items-center rounded-[10px]"
                    : "bg-background-2 text-muted-foreground-2 grid size-10 flex-none place-items-center rounded-[10px]"
                }
              >
                <Icon className="size-4.5" />
              </span>
              <div>
                <b className="font-semibold">{title.label}</b>
                <p className="text-muted-foreground-1 text-sm">{text.label}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
      <div className="bg-primary-50 border-primary-100 text-primary-700 flex items-start gap-3 rounded-[10px] border px-4 py-3 text-[13px]">
        <Info aria-hidden="true" className="mt-px size-4.5 flex-none" />
        <span>{strings.autoApprovalNote.label}</span>
      </div>
    </div>
  );
}
