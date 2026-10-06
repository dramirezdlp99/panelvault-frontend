import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SlowNotice } from "./slow-notice";

describe("SlowNotice", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("no aparece si la accion termina rapido", () => {
    const { rerender } = render(<SlowNotice active afterMs={5000} />);
    act(() => vi.advanceTimersByTime(3000));
    rerender(<SlowNotice active={false} afterMs={5000} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("explica la espera cuando la accion se demora", () => {
    render(<SlowNotice active afterMs={5000} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole("status")).toHaveTextContent(/se está despertando/);
  });

  it("se oculta al terminar la accion", () => {
    const { rerender } = render(<SlowNotice active afterMs={1000} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<SlowNotice active={false} afterMs={1000} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("en un segundo intento vuelve a esperar antes de mostrarse", () => {
    const { rerender } = render(<SlowNotice active afterMs={1000} />);
    act(() => vi.advanceTimersByTime(1000));
    rerender(<SlowNotice active={false} afterMs={1000} />);
    rerender(<SlowNotice active afterMs={1000} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
