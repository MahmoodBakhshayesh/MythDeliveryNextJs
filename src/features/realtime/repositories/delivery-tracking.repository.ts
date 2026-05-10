/**
 * SignalR hub — transport only (no React).
 */
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { getWsBaseUrl } from "@/lib/env";

export const deliveryTrackingRepository = {
  createConnection(accessTokenFactory: () => string): HubConnection {
    return new HubConnectionBuilder()
      .withUrl(`${getWsBaseUrl()}/hubs/delivery-tracking`, {
        accessTokenFactory,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
  },

  async start(connection: HubConnection): Promise<void> {
    await connection.start();
  },

  async subscribeOrganization(
    connection: HubConnection,
    organizationId: string,
  ): Promise<void> {
    await connection.invoke("SubscribeOrganization", organizationId);
  },

  async unsubscribeOrganization(
    connection: HubConnection,
    organizationId: string,
  ): Promise<void> {
    if (connection.state === HubConnectionState.Connected) {
      await connection.invoke("UnsubscribeOrganization", organizationId);
    }
  },

  async stop(connection: HubConnection): Promise<void> {
    await connection.stop();
  },
};
