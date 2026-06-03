import React from "react";
import { Input, type InputProps } from "./input";

export function CurrencyInput(props: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Durante digitação: apenas aceita números, sem formatação
    let value = e.target.value.replace(/\D/g, "");
    e.target.value = value;
    props.onChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ao sair do campo: formata com separadores e decimais
    let value = e.target.value.replace(/\D/g, "");

    if (value === "" || value === "0") {
      e.target.value = "0,00";
    } else if (value.length === 1) {
      e.target.value = "0,0" + value;
    } else if (value.length === 2) {
      e.target.value = "0," + value;
    } else {
      const integer = value.slice(0, -2);
      const decimal = value.slice(-2);
      e.target.value = `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`;
    }
    props.onBlur?.(e);
  };

  return (
    <Input
      {...props}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="0,00"
      className="font-mono"
      type="text"
      inputMode="numeric"
    />
  );
}

export function currencyToNumber(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized) || 0;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
