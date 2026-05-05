export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-testid="dashboard-layout"
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {children}
    </div>
  )
}
