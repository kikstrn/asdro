type GenerateSlotsOptions = {
  opensAt: string;
  closesAt: string;
  durationMinutes: number;
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time
    .slice(0, 5)
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
}

export function generateSlots({
  opensAt,
  closesAt,
  durationMinutes,
}: GenerateSlotsOptions) {
  const opening = timeToMinutes(opensAt);
  const closing = timeToMinutes(closesAt);

  const slots: {
    start: string;
    end: string;
  }[] = [];

  for (
    let current = opening;
    current + durationMinutes <= closing;
    current += durationMinutes
  ) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(
        current + durationMinutes
      ),
    });
  }

  return slots;
}