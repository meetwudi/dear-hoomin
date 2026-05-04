import { productCopy } from "../../lib/product-copy";

type AppTab = "family" | "journal" | "musings";

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
    {
      href: "/?tab=musings",
      id: "musings",
      label: productCopy.navigation.tabs.musings,
    },
  ];

  if (familyHref) {
    tabs.push({
      href: familyHref,
      id: "family",
      label: productCopy.navigation.tabs.family,
    });
  }
  const gridStyle = {
    gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
  };

  return (
    <>
      <div className="home-tabs-cluster">
        <nav
          className="home-tabs"
          style={gridStyle}
          aria-label={productCopy.navigation.homeSections}
        >
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
        <nav
          className="bottom-app-tabs"
          style={gridStyle}
          aria-label={productCopy.navigation.primary}
        >
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
