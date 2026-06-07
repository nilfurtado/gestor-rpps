export function currencyToNumber(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized) || 0;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatValue(digits: string): string {
  if (digits === "") {
    return "";
  } else if (digits.length === 1) {
    return digits;
  } else if (digits.length === 2) {
    return digits;
  } else {
    const integer = digits.slice(0, -2);
    const decimal = digits.slice(-2);
    return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`;
  }
}
