type AppTab = "family" | "thoughts";

type TabItem = {
  href: string;
  id: AppTab;
  label: string;
};

export function AppTabs({
  activeTab,
  familyHref,
}: {
  activeTab: AppTab;
  familyHref?: string;
}) {
  const tabs: TabItem[] = [
    { href: "/?tab=thoughts", id: "thoughts", label: "Musings" },
    familyHref
      ? { href: familyHref, id: "family", label: "Family" }
      : null,
  ].filter((tab): tab is TabItem => Boolean(tab));
  const gridStyle = {
    gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
  };

  return (
    <>
      <div className="home-tabs-cluster">
        <nav className="home-tabs" style={gridStyle} aria-label="Home sections">
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
      </div>
      <div className="bottom-app-tabs-cluster">
        <nav className="bottom-app-tabs" style={gridStyle} aria-label="Primary">
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
      </div>
    </>
  );
}
