import { profileRepository } from "@/features/profile/repositories/profile.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";
import type { UserProfileResponse } from "@/types/api";

export async function uploadAvatarUseCase(
  file: File,
): Promise<UserProfileResponse> {
  const res = await profileRepository.uploadAvatar(file);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
