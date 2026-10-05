import { describe, expect, it } from "vitest";

import { normalizeEmail, passwordProblems, passwordStrength, validateDisplayName, validateEmail } from "./validation";

describe("validateEmail", () => {
  it("acepta correos validos sin importar mayusculas ni espacios", () => {
    expect(validateEmail("  Ana@Example.COM ")).toBeNull();
    expect(normalizeEmail("  Ana@Example.COM ")).toBe("ana@example.com");
  });

  it.each(["", "ana", "ana@", "ana@dominio", "ana @x.com"])("rechaza %j", (email) => {
    expect(validateEmail(email)).not.toBeNull();
  });
});

describe("validateDisplayName", () => {
  it("exige entre 2 y 40 caracteres", () => {
    expect(validateDisplayName("A")).not.toBeNull();
    expect(validateDisplayName("Ana")).toBeNull();
    expect(validateDisplayName("x".repeat(41))).not.toBeNull();
  });
});

describe("passwordProblems (igual que PasswordPolicy del backend)", () => {
  it("acepta una contrasena larga con letras y numeros", () => {
    expect(passwordProblems("clave segura 2026", "ana@example.com")).toEqual([]);
  });

  it("exige minimo 10 caracteres, una letra y un numero", () => {
    expect(passwordProblems("abc1")).toContain("Mínimo 10 caracteres.");
    expect(passwordProblems("1234567890")).toContain("Incluye al menos una letra.");
    expect(passwordProblems("solamenteletras")).toContain("Incluye al menos un número.");
  });

  it("no permite contener el usuario del correo (de 4 letras o mas)", () => {
    expect(passwordProblems("mariana2026x", "mariana@x.com")).toContain("No uses tu usuario de correo dentro de la contraseña.");
    expect(passwordProblems("ana12345678", "ana@x.com")).toEqual([]);
  });

  it("cuenta bytes UTF-8 para el limite de BCrypt", () => {
    expect(passwordProblems("ñ".repeat(37) + "1")).toContain("Es demasiado larga.");
  });

  it("pide escribir algo si esta vacia", () => {
    expect(passwordProblems("   ")).toEqual(["Escribe una contraseña."]);
  });
});

describe("passwordStrength", () => {
  it("sube con la longitud y la variedad", () => {
    expect(passwordStrength("").score).toBe(0);
    expect(passwordStrength("abc").score).toBeLessThanOrEqual(1);
    expect(passwordStrength("clavesegura1").score).toBe(2);
    expect(passwordStrength("Clave-Segura-2026").score).toBe(4);
  });
});
