import { ExtensionHost, type DashboardExtension } from "@/sdk";
import { dashboardExtensionHost } from "@/core/extensions";
import { sampleProtocolExtension } from "@/extensions";
import { selectExtensionWidgets } from "@/widgets/extensionWidgets";
import { widgetRegistry } from "@/widgets/registry";

describe("ExtensionHost", () => {
  afterEach(async () => {
    await dashboardExtensionHost.deactivate("axionvera.sample-protocol");
  });

  it("automatically activates registered extensions and exposes contributions", async () => {
    const host = new ExtensionHost({ logger: silentLogger });

    const result = await host.register(sampleProtocolExtension);

    expect(result).toEqual({ extensionId: "axionvera.sample-protocol", status: "loaded" });
    expect(host.getExtensions()).toHaveLength(1);
    expect(host.getContributions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "sample-protocol-health", type: "widget" }),
        expect.objectContaining({ id: "sample-protocol-panel", type: "panel" }),
      ]),
    );
  });

  it("loads dynamic extension modules and factory defaults", async () => {
    const host = new ExtensionHost({ logger: silentLogger });
    const extensionFactory = () => createExtension("third-party.analytics", "Analytics Pack");

    const result = await host.load({ default: extensionFactory });

    expect(result.status).toBe("loaded");
    expect(host.getContributions("module")).toHaveLength(1);
  });

  it("rejects invalid extensions safely", async () => {
    const host = new ExtensionHost({ logger: silentLogger });

    const result = await host.load({ manifest: { id: "Bad ID" }, activate: jest.fn() } as never);

    expect(result.status).toBe("rejected");
    expect(host.getExtensions()).toHaveLength(0);
  });

  it("rolls back extensions that register invalid contributions", async () => {
    const host = new ExtensionHost({ logger: silentLogger });
    const invalidContributionExtension: DashboardExtension = {
      manifest: { id: "third-party.invalid-contribution", name: "Invalid", version: "1.0.0" },
      activate(context) {
        context.registerContribution({ id: "bad contribution", type: "widget", title: "Bad" });
      },
    };

    const result = await host.register(invalidContributionExtension);

    expect(result.status).toBe("rejected");
    expect(host.getExtensions()).toHaveLength(0);
  });

  it("runs deactivate hooks and removes contributions", async () => {
    const host = new ExtensionHost({ logger: silentLogger });
    await host.register(sampleProtocolExtension);

    const deactivated = await host.deactivate("axionvera.sample-protocol");

    expect(deactivated).toBe(true);
    expect(host.getContributions()).toHaveLength(0);
  });

  it("registers extension widgets in the shared widget registry", async () => {
    expect(widgetRegistry.getWidget("sample-protocol-health")).toBeUndefined();

    const result = await dashboardExtensionHost.register(sampleProtocolExtension);
    expect(result.status).toBe("loaded");

    const registeredWidget = widgetRegistry.getWidget("sample-protocol-health");
    expect(registeredWidget).toBeDefined();
    expect(registeredWidget?.metadata?.title).toBe("Protocol Health Widget");
    expect(registeredWidget?.metadata?.description).toContain("Shows how an extension contributes a dashboard widget.");

    const deactivated = await dashboardExtensionHost.deactivate("axionvera.sample-protocol");
    expect(deactivated).toBe(true);
    expect(widgetRegistry.getWidget("sample-protocol-health")).toBeUndefined();
  });

  it("selects extension widgets for dashboard rendering", () => {
    expect(
      selectExtensionWidgets([
        { id: "alpha-widget", type: "widget", title: "Alpha" },
        { id: "alpha-panel", type: "panel", title: "Panel" },
      ]),
    ).toEqual([{ id: "alpha-widget", type: "widget", title: "Alpha" }]);
  });
});

const silentLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

function createExtension(id: string, name: string): DashboardExtension {
  return {
    manifest: { id, name, version: "1.0.0" },
    activate(context) {
      context.registerContribution({ id: `${id}.module`, type: "module", title: name });
    },
  };
}
