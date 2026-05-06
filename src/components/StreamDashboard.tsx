export function StreamDashboard() {
  return (
    <div className="-mx-4 sm:-mx-6 -my-6" style={{ height: 'calc(100vh - 56px)' }}>
      <iframe
        src="/stream-dashboard.html"
        title="Physical AI Stream Performance Dashboard"
        className="w-full h-full border-0"
        style={{ display: 'block' }}
      />
    </div>
  );
}
