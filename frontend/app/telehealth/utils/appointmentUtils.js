export const getStatusBadgeClass = (status) => {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "CONFIRMED":
    case "UPCOMING":
    case "SCHEDULED":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "REQUESTED":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "CANCELLED_PATIENT":
    case "CANCELLED_DOCTOR":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-gray-100 text-secondary/80 border border-gray-200";
  }
};

export const formatAppointmentDate = (dateString) => {
  const date = new Date(dateString);
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "long",
    })
    .replace(/,/g, "");
};

export const formatAppointmentTime = (dateString) => {
  const date = new Date(dateString);
  return date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
};
