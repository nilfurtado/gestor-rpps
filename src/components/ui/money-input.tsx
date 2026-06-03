import { InputHTMLAttributes } from "react";

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
}

export function MoneyInput({ value, onChange, ...props }: MoneyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, "");

    if (input === "") {
      onChange({ target: { value: "" } });
      return;
    }

    // Se tem menos de 3 dígitos, mostrar sem separadores
    if (input.length <= 2) {
      onChange({ target: { value: input } });
      return;
    }

    // Separar inteira e decimal (últimos 2 dígitos são decimal)
    const inteira = input.slice(0, -2);
    const decimal = input.slice(-2);

    // Formatar inteira com pontos de milhar
    const inteirFormatada = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Montar formato final
    const formatted = `${inteirFormatada},${decimal}`;

    onChange({ target: { value: formatted } });
  };

  return (
    <input
      {...props}
      type="text"
      value={value}
      onChange={handleChange}
      inputMode="decimal"
      placeholder="0,00"
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 tabular-nums"
    />
  );
}
