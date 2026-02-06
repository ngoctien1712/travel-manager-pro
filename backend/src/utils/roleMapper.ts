// Map DB role codes to frontend role names
export const ROLE_CODE_TO_FRONTEND: Record<string, string> = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  AREA_OWNER: 'owner',
};

export const FRONTEND_TO_ROLE_CODE: Record<string, string> = {
  admin: 'ADMIN',
  customer: 'CUSTOMER',
  owner: 'AREA_OWNER',
};
