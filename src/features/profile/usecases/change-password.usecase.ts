import { profileRepository } from "@/features/profile/repositories/profile.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";

export async function changePasswordUseCase(body: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<void> {
  const res = await profileRepository.changePassword(body);
  if (!isAppSuccess(res)) throw new Error(appErrorMessage(res));
}
