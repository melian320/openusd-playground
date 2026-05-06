export function DiscordDashboard() {
  return (
    <div className="-mx-4 sm:-mx-6 -my-6" style={{ height: 'calc(100vh - 56px)' }}>
      <iframe
        src="/discord-dashboard.html"
        title="Omniverse Discord Community Dashboard"
        className="w-full h-full border-0"
        style={{ display: 'block' }}
      />
    </div>
  );
}
