export const formatDateField = <T extends { date: string }>(item: T) => {
  const d = new Date(item.date)
  const formattedDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  return { ...item, formattedDate }
}
