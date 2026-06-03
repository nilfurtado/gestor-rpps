import React from "react";
import { Input, type InputProps } from "./input";

export function CepInput(props: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 8);

    if (value.length > 5) {
      value = value.slice(0, 5) + "-" + value.slice(5);
    }

    e.target.value = value;
    props.onChange?.(e);
  };

  return (
    <Input
      {...props}
      onChange={handleChange}
      placeholder="00000-000"
      maxLength={9}
    />
  );
}
