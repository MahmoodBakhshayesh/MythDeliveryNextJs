import { profileRepository } from "@/features/profile/repositories/profile.repository";
import { appErrorMessage, isAppSuccess } from "@/lib/api-types";
import type { UserProfileResponse } from "@/types/api";

export async function updateProfileUseCase(body: {
  displayName?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
}): Promise<UserProfileResponse> {
  const res = await profileRepository.updateMe(body);
  if (!isAppSuccess(res) || !res.body) throw new Error(appErrorMessage(res));
  return res.body;
}
