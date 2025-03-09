import WholesaleLayout from "@/components/layout/wholesale-layout";
import { WholesaleProfileSettings } from "@/components/wholesale/profile-settings";

export default function WholesaleProfilePage() {
  return (
    <WholesaleLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
        <WholesaleProfileSettings />
      </div>
    </WholesaleLayout>
  );
}
