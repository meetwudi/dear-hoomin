type AppTab = "journal" | "pet" | "thoughts";

export function AppTabs({ activeTab }: { activeTab: AppTab }) {
  const tabs = [
    { href: "/?tab=thoughts", id: "thoughts" as const, label: "Thoughts" },
    { href: "/?tab=journal", id: "journal" as const, label: "Journal" },
    { href: "/settings", id: "pet" as const, label: "Furbaby" },
  ];

  return (
    <>
      <nav className="home-tabs" aria-label="Home sections">
        {tabs.map((tab) => (
          <a
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={activeTab === tab.id ? "active-tab" : undefined}
            href={tab.href}
            key={tab.id}
          >
            {tab.label}
          </a>
        ))}
      </nav>
      <nav className="bottom-app-tabs" aria-label="Primary">
        {tabs.map((tab) => (
          <a
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={activeTab === tab.id ? "active-tab" : undefined}
            href={tab.href}
            key={tab.id}
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </>
  );
}
