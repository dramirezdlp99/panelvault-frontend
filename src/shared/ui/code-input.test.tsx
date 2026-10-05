import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { CodeInput } from "./code-input";

function Harness({ onComplete }: { onComplete: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <>
      <CodeInput value={value} onChange={setValue} onComplete={onComplete} />
      <output data-testid="value">{value}</output>
    </>
  );
}

describe("CodeInput", () => {
  it("muestra 6 casillas accesibles", () => {
    render(<Harness onComplete={() => {}} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    expect(screen.getByLabelText("Dígito 1 de 6")).toHaveAttribute("inputmode", "numeric");
  });

  it("avanza al escribir y avisa al completar", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<Harness onComplete={onComplete} />);
    await user.click(screen.getByLabelText("Dígito 1 de 6"));
    await user.keyboard("123456");
    expect(screen.getByTestId("value")).toHaveTextContent("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("ignora letras", async () => {
    const user = userEvent.setup();
    render(<Harness onComplete={() => {}} />);
    await user.click(screen.getByLabelText("Dígito 1 de 6"));
    await user.keyboard("1a2b");
    expect(screen.getByTestId("value")).toHaveTextContent(/^12$/);
  });

  it("borra el ultimo digito con Retroceso", async () => {
    const user = userEvent.setup();
    render(<Harness onComplete={() => {}} />);
    await user.click(screen.getByLabelText("Dígito 1 de 6"));
    await user.keyboard("123{Backspace}");
    expect(screen.getByTestId("value")).toHaveTextContent(/^12$/);
    expect(screen.getByLabelText("Dígito 3 de 6")).toHaveFocus();
  });

  it("acepta pegar el codigo completo", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<Harness onComplete={onComplete} />);
    await user.click(screen.getByLabelText("Dígito 1 de 6"));
    await user.paste("98 76 54");
    expect(onComplete).toHaveBeenCalledWith("987654");
  });
});
