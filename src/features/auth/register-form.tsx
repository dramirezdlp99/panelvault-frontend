"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ApiRequestError, errorMessage } from "@/shared/api/http";
import { routes } from "@/shared/config/routes";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import { Spinner } from "@/shared/ui/spinner";

import { login, register } from "./api";
import { PasswordStrengthMeter } from "./password-strength";
import { normalizeEmail, passwordProblems, PASSWORD_MIN_LENGTH, validateDisplayName, validateEmail } from "./validation";

type Errors = Partial<Record<"displayName" | "email" | "password" | "confirm", string | null>>;

/** Traduce los errores del backend a mensajes junto al campo correspondiente. */
function errorsFromBackend(error: ApiRequestError): Errors | null {
  if (error.code === "user.email_taken") return { email: "Ya existe una cuenta con este correo." };
  if (error.code === "user.weak_password") return { password: error.message };
  if (error.code === "user.display_name_invalid") return { displayName: error.message };
  if (error.code === "user.email_invalid") return { email: error.message };
  if (error.fieldErrors.length > 0) {
    const errors: Errors = {};
    for (const { field, message } of error.fieldErrors) {
      if (field === "displayName" || field === "email" || field === "password") errors[field] = message;
    }
    return errors;
  }
  return null;
}

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (name: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));

  function validate(): Errors {
    const problems = passwordProblems(values.password, values.email);
    return {
      displayName: validateDisplayName(values.displayName),
      email: validateEmail(values.email),
      password: problems.length ? problems.join(" ") : null,
      confirm: values.confirm !== values.password ? "Las contraseñas no coinciden." : null,
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setPending(true);
    setFormError(null);
    const email = normalizeEmail(values.email);
    try {
      await register({ email, displayName: values.displayName.trim(), password: values.password });
      // Cuenta creada: se inicia sesión de una vez para no pedir los datos otra vez.
      await login(email, values.password);
      router.replace(routes.library);
      router.refresh();
    } catch (caught) {
      const fieldErrors = caught instanceof ApiRequestError ? errorsFromBackend(caught) : null;
      if (fieldErrors) setErrors(fieldErrors);
      else setFormError(errorMessage(caught));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError ? <Alert tone="error" title="No pudimos crear la cuenta">{formError}</Alert> : null}

      <Field label="Nombre" error={errors.displayName}>
        <Input name="displayName" autoComplete="nickname" value={values.displayName} onChange={set("displayName")} maxLength={40} />
      </Field>

      <Field label="Correo electrónico" error={errors.email}>
        <Input type="email" name="email" autoComplete="email" value={values.email} onChange={set("email")} placeholder="tu@correo.com" />
      </Field>

      <Field label="Contraseña" error={errors.password} hint={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres, con letras y números.`}>
        <PasswordInput name="password" autoComplete="new-password" value={values.password} onChange={set("password")} />
      </Field>
      <PasswordStrengthMeter password={values.password} />

      <Field label="Confirmar contraseña" error={errors.confirm}>
        <PasswordInput name="confirm" autoComplete="new-password" value={values.confirm} onChange={set("confirm")} />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner label="Creando cuenta" /> : <UserPlus aria-hidden className="size-5" />}
        Crear cuenta
      </Button>

      <p className="border-t-2 border-dashed border-line/20 pt-5 text-center text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href={routes.login} className="font-display font-bold uppercase text-accent underline-offset-4 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
