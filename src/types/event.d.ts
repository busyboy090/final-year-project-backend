export type EventCategory = 'Academic Conference' | 'Workshop' | 'Cultural Event' | 'Sports Match' | 'Exhibition/Expo' | 'Social Gathering/Party';
export type EventStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type EventAudienceScope = 'all' | 'custom';
export type EventAudienceRole = 'staff' | 'student';
export type EventAudienceGender = 'male' | 'female' | 'other';
export type EventAudienceStaffType = 'academic-staff' | 'non-academic-staff';

export type EventAudienceRule = {
  role: EventAudienceRole;
  staff_type?: EventAudienceStaffType | null;
  level_id?: number | null;
  gender?: EventAudienceGender | null;
};
