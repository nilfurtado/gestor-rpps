import React from "react";
import { Input, type InputProps } from "./input";

export function CnpjInput(props: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 14);

    if (value.length > 8) {
      value = value.slice(0, 8) + "/" + value.slice(8);
    }
    if (value.length > 5) {
      value = value.slice(0, 5) + "." + value.slice(5);
    }
    if (value.length > 2) {
      value = value.slice(0, 2) + "." + value.slice(2);
    }

    e.target.value = value;
    props.onChange?.(e);
  };

  return (
    <Input
      {...props}
      onChange={handleChange}
      placeholder="00.000.000/0000-00"
      maxLength={18}
    />
  );
}
