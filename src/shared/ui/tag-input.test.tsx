import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { TagInput } from "./tag-input";

function Harness({ max = 3 }: { max?: number }) {
  const [tags, setTags] = useState<string[]>([]);
  return <TagInput aria-describedby="x" value={tags} onChange={setTags} normalize={(t) => t.trim().toLowerCase() || null} max={max} />;
}

describe("TagInput", () => {
  it("agrega con Enter o coma y evita duplicados", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("textbox");
    await user.type(input, "Humor{Enter}drama,humor{Enter}");
    expect(screen.getByText("humor")).toBeInTheDocument();
    expect(screen.getByText("drama")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /quitar etiqueta/i })).toHaveLength(2);
  });

  it("quita con la X o con Retroceso", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("textbox");
    await user.type(input, "a{Enter}b{Enter}");
    await user.click(screen.getByRole("button", { name: "Quitar etiqueta a" }));
    expect(screen.queryByText("a")).not.toBeInTheDocument();
    await user.type(input, "{Backspace}");
    expect(screen.queryByText("b")).not.toBeInTheDocument();
  });

  it("se bloquea al llegar al maximo", async () => {
    const user = userEvent.setup();
    render(<Harness max={1} />);
    await user.type(screen.getByRole("textbox"), "uno{Enter}");
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
