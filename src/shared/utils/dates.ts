export function startOfDay(date?: Date): Date | undefined {
  if (!date) return undefined
  const dateStr = date.toISOString().split('T')[0]
  return new Date(`${dateStr}T00:00:00`)
}

export function endOfDay(date?: Date): Date | undefined {
  if (!date) return undefined
  const dateStr = date.toISOString().split('T')[0]
  return new Date(`${dateStr}T23:59:59.999`)
}

export function prismaDateRange(
  startDate?: Date,
  endDate?: Date,
): { gte?: Date; lte?: Date } | undefined {
  if (!startDate || !endDate) return undefined

  return {
    gte: startOfDay(startDate),
    lte: endOfDay(endDate),
  }
}
