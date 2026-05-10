import { profileRepository } from "@/features/profile/repositories/profile.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";
import type { UserProfileResponse } from "@/types/api";

export async function clearAvatarUseCase(): Promise<UserProfileResponse> {
  const res = await profileRepository.clearAvatar();
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
