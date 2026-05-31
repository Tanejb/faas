export function canOrganize(role) {
  return role === "organizer" || role === "admin";
}

export function isStudent(role) {
  return role === "student";
}

export function isAdmin(role) {
  return role === "admin";
}

export function canRegisterForEvents(role) {
  return role === "student" || role === "admin";
}
