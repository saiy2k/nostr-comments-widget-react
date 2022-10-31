
import React from "react";

export interface ButtonProps {
  label: string;
}

const Button = (props: ButtonProps) => {
  return <button style={{ padding: "8px" }}>Hi, {props.label}</button>;
};

export default Button;
