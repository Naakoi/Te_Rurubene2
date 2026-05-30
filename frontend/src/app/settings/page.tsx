export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <p className="text-muted-foreground">Manage your profile and security.</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <p className="text-muted-foreground">Audio quality and theme settings.</p>
        </div>
      </div>
    </div>
  );
}
