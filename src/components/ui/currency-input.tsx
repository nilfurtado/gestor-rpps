"use client";

import React, { useRef } from "react";
import { Input, type InputProps } from "./input";
import { formatValue } from "@/lib/format-currency";

export function CurrencyInput(props: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não é número
    let digits = e.target.value.replace(/\D/g, "");

    // Formata o valor
    const formatted = formatValue(digits);

    // Salva a posição anterior do cursor
    const cursorPos = e.target.selectionStart || 0;

    // Atualiza o valor
    e.target.value = formatted;

    // Restaura uma posição de cursor aproximada
    // (avança 1 posição se digitou um separador)
    if (formatted.length > digits.length && cursorPos <= formatted.length) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(cursorPos + 1, cursorPos + 1);
        }
      }, 0);
    }

    props.onChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "");

    if (digits === "") {
      e.target.value = "0,00";
    } else if (digits.length === 1) {
      e.target.value = "0,0" + digits;
    } else if (digits.length === 2) {
      e.target.value = "0," + digits;
    } else {
      e.target.value = formatValue(digits);
    }

    props.onBlur?.(e);
  };

  return (
    <Input
      {...props}
      ref={inputRef}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="0,00"
      className="font-mono"
      type="text"
      inputMode="numeric"
    />
  );
}
