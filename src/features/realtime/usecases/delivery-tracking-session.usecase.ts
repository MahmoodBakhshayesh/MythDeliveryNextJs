import type { PackageStatusPayload } from "@/features/realtime/domain/package-status.types";
import { deliveryTrackingRepository } from "@/features/realtime/repositories/delivery-tracking.repository";

const EVENT = "packageStatus";

/**
 * Starts hub session, subscribes to org group, returns teardown.
 * Controller wires React state to `onPackageStatus`.
 */
export async function openDeliveryTrackingSessionUseCase(
  accessToken: string,
  organizationId: string,
  onPackageStatus: (payload: PackageStatusPayload) => void,
  onConnectionClosed?: (error?: Error) => void,
): Promise<() => Promise<void>> {
  const conn = deliveryTrackingRepository.createConnection(() => accessToken);

  conn.on(EVENT, onPackageStatus);
  conn.onclose((err) => {
    if (err) onConnectionClosed?.(err);
  });

  await deliveryTrackingRepository.start(conn);
  await deliveryTrackingRepository.subscribeOrganization(conn, organizationId);

  return async () => {
    await deliveryTrackingRepository.unsubscribeOrganization(conn, organizationId);
    await deliveryTrackingRepository.stop(conn);
  };
}
