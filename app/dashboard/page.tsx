import { Navbar } from "@/components/dashboard/navbar";
import { GmailList } from "@/components/dashboard/GmailList";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div>
      <Navbar />
      <div>
        <div className="flex justify-center">
          <div>
            In order to see your gmails please connect your google account via
            oauth consent
          </div>
          <Button variant={"regular"}>
            <a href="/api/oauth/google">Connect your Google</a>
          </Button>
        </div>
        <div>
          <GmailList />
        </div>
      </div>
    </div>
  );
}
