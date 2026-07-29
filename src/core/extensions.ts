import { ExtensionHost, type DashboardExtension, type ExtensionModule, type ExtensionLoadResult } from "@/sdk";
import { sampleProtocolExtension } from "@/extensions";
import { widgetRegistry } from "@/widgets/registry";

function ExtensionWidgetPlaceholder() {
  return null;
}

class DashboardExtensionHost extends ExtensionHost {
  async register(extension: DashboardExtension): Promise<ExtensionLoadResult> {
    const result = await super.register(extension);
    if (result.status === "loaded") {
      this.syncWidgets();
    }
    return result;
  }

  async load(module: ExtensionModule): Promise<ExtensionLoadResult> {
    const result = await super.load(module);
    if (result.status === "loaded") {
      this.syncWidgets();
    }
    return result;
  }

  async deactivate(extensionId: string): Promise<boolean> {
    const contributions = this.getExtensions()
      .find((extension) => extension.manifest.id === extensionId)
      ?.contributions.filter((contribution) => contribution.type === "widget") ?? [];
    const deactivated = await super.deactivate(extensionId);
    if (deactivated) {
      contributions.forEach((contribution) => widgetRegistry.unregisterWidget(contribution.id));
    }
    return deactivated;
  }

  private syncWidgets(): void {
    this.getContributions("widget").forEach((contribution) => {
      widgetRegistry.registerWidget({
        id: contribution.id,
        name: contribution.title,
        dependencies: [],
        component: contribution.component ?? ExtensionWidgetPlaceholder,
        metadata: {
          title: contribution.title,
          description: contribution.description,
        },
        config: contribution.metadata,
      });
    });
  }
}

export const dashboardExtensionHost = new DashboardExtensionHost();

export const bundledExtensions: ExtensionModule[] = [sampleProtocolExtension];

export async function loadBundledExtensions(): Promise<ExtensionLoadResult[]> {
  return dashboardExtensionHost.loadAll(bundledExtensions);
}
