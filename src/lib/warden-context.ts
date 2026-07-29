import { HOSTELS, ROLE_CONFIG, type RoleSlug } from "@/lib/constants";
import type { HostelName } from "@/lib/types";

type WardenSearchParams = {
  hostel?: string | string[];
};

const hostelMap: Record<string, HostelName> = {
  "mkg-boys": "MKG Boys Hostel",
  "mkg-girls": "MKG Girls Hostel",
  "nri-boys": "NRI Boys Hostel",
  "nri-girls": "NRI Girls Hostel",
};

const roleByHostel: Record<HostelName, RoleSlug> = Object.fromEntries(
  Object.values(ROLE_CONFIG)
    .filter((role) => role.hostel)
    .map((role) => [role.hostel, role.slug]),
) as Record<HostelName, RoleSlug>;

export function getWardenHostelFromSearchParams(params: WardenSearchParams) {
  const hostelParam = Array.isArray(params.hostel) ? params.hostel[0] : params.hostel;

  return hostelMap[hostelParam ?? "mkg-boys"] ?? HOSTELS[0];
}

export function getResolvedWardenRole(
  profileRole: RoleSlug | null | undefined,
  hostel: HostelName,
) {
  return profileRole?.endsWith("warden")
    ? profileRole
    : roleByHostel[hostel] ?? "mkg-boys-warden";
}
