export type WorkPlanShiftDto = {
  ordinal: number;
  /** HH:mm or HH:mm:ss (local wall-clock for the service day) */
  localStart: string;
  localEnd: string;
};

export type WorkPlanResponseDto = {
  id: string;
  organizationId: string;
  name: string;
  shifts: WorkPlanShiftDto[];
};
