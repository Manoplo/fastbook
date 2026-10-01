import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import { FastbookLogo } from "@components/fastbook-logo/fastbook-logo";
import { ProgressSpinnerIcon } from "@components/icons/progress-spinner-icon";
import { VisibilityIcon } from "@components/icons/visibility-icon";
import { VisibilityOffIcon } from "@components/icons/visibility-off-icon";
import { useAuthSession } from "@src/hooks/use-auth-session";
import { completeBusinessSetup } from "@src/lib/complete-business-setup";
import { ensureOwnedTenant } from "@src/lib/ensure-owned-tenant";
import { signInTenant } from "@src/lib/sign-in-tenant";
import { signUpTenant } from "@src/lib/sign-up-tenant";
import {
  PASSWORD_REQUIREMENTS_MESSAGE,
  TenantAuthError,
  getPasswordStrength,
  isValidPassword,
  passwordStrengthLabel,
} from "@src/lib/tenant-auth.utils";
import type { EnterpriseAuthMode, EnterpriseLoginFormValues } from "./enterprise-login.types";
import "./enterprise-login.css";

export function EnterpriseLoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, isLoading: isSessionLoading } = useAuthSession();
  const [mode, setMode] = useState<EnterpriseAuthMode>("login");
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const userId = session?.user?.id;
  const ownedTenantQuery = useQuery({
    queryKey: ["owned-tenant", userId],
    queryFn: async () => {
      const user = session?.user;
      if (!user) {
        return null;
      }
      try {
        return await ensureOwnedTenant({ user });
      } catch (error) {
        if (error instanceof TenantAuthError && error.code === "needs_business_setup") {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(userId),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<EnterpriseLoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      slug: "",
    },
  });

  const needsBusinessSetup =
    Boolean(userId) && ownedTenantQuery.isFetched && !ownedTenantQuery.data && !ownedTenantQuery.isError;

  const activeMode: EnterpriseAuthMode = needsBusinessSetup ? "complete" : mode;

  const passwordStrength = getPasswordStrength(passwordValue);
  const strengthLabel = passwordStrengthLabel(passwordStrength);
  const { onChange: onPasswordChange, ...passwordField } = register("password", {
    required: activeMode === "complete" ? false : "Obligatorio",
    validate: (value) => (activeMode === "signup" ? isValidPassword(value) || PASSWORD_REQUIREMENTS_MESSAGE : true),
  });

  const ownedSlug = ownedTenantQuery.data?.slug;
  if (!isSessionLoading && ownedSlug) {
    return <Navigate to={`/enterprise/${ownedSlug}`} replace />;
  }

  async function onSubmit(values: EnterpriseLoginFormValues) {
    setFormError(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    try {
      if (activeMode === "complete") {
        const tenant = await completeBusinessSetup({
          name: values.name,
          slug: values.slug,
        });
        await queryClient.invalidateQueries({
          queryKey: ["owned-tenant", userId],
        });
        navigate(`/enterprise/${tenant.slug}`, { replace: true });
        return;
      }

      if (activeMode === "login") {
        const { tenant } = await signInTenant({
          email: values.email,
          password: values.password,
        });
        navigate(`/enterprise/${tenant.slug}`, { replace: true });
        return;
      }

      const result = await signUpTenant({
        email: values.email,
        password: values.password,
        name: values.name,
        slug: values.slug,
      });

      if (result.needsEmailConfirmation) {
        setInfoMessage(
          "Te hemos enviado un email de confirmación. Cuando lo confirmes, inicia sesión para acceder a tu panel.",
        );
        setMode("login");
        return;
      }

      navigate(`/enterprise/${result.tenant.slug}`, { replace: true });
    } catch (error) {
      if (error instanceof TenantAuthError && error.code === "needs_business_setup") {
        setMode("complete");
        setInfoMessage(error.message);
        return;
      }

      if (error instanceof TenantAuthError) {
        setFormError(error.message);
      } else {
        setFormError("No se pudo completar la operación. Inténtalo de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const showBusinessFields = activeMode === "signup" || activeMode === "complete";
  const showCredentials = activeMode !== "complete";
  const completeHint =
    activeMode === "complete"
      ? "Tu cuenta está verificada. Indica el nombre y el slug de tu negocio para terminar el alta."
      : null;

  const submitLabel = activeMode === "login" ? "Entrar" : activeMode === "complete" ? "Crear negocio" : "Crear cuenta";
  const submittingLabel =
    activeMode === "login" ? "Entrando…" : activeMode === "complete" ? "Creando negocio…" : "Creando cuenta…";

  return (
    <div className="enterprise-login">
      <section className="enterprise-login__form-panel">
        <div className="enterprise-login__form-inner">
          <Link to="/" className="enterprise-login__brand" aria-label="Inicio">
            <FastbookLogo />
          </Link>

          <header className="enterprise-login__header">
            <h1 className="enterprise-login__title">
              {activeMode === "login"
                ? "Inicia sesión en tu espacio de negocio"
                : activeMode === "complete"
                ? "Completa tu negocio"
                : "Da de alta tu negocio"}
            </h1>
            <p className="enterprise-login__subtitle">
              {activeMode === "login"
                ? "Gestiona tu agenda de citas y servicios con fastbook."
                : activeMode === "complete"
                ? "Falta asociar un negocio a tu cuenta para entrar al panel."
                : "Crea tu cuenta y tu página pública de reservas en un solo paso."}
            </p>
          </header>

          {activeMode !== "complete" ? (
            <div className="enterprise-login__mode-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === "login"}
                className={classNames("enterprise-login__mode-btn", {
                  "enterprise-login__mode-btn--active": activeMode === "login",
                })}
                onClick={() => {
                  setMode("login");
                  setFormError(null);
                  setInfoMessage(null);
                }}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === "signup"}
                className={classNames("enterprise-login__mode-btn", {
                  "enterprise-login__mode-btn--active": activeMode === "signup",
                })}
                onClick={() => {
                  setMode("signup");
                  setFormError(null);
                  setInfoMessage(null);
                }}
              >
                Darse de alta
              </button>
            </div>
          ) : null}

          <form className="enterprise-login__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {showBusinessFields ? (
              <>
                <label className="enterprise-login__label" htmlFor="business-name">
                  Nombre del negocio
                </label>
                <input
                  id="business-name"
                  className={classNames("enterprise-login__input", {
                    "enterprise-login__input--error": errors.name,
                  })}
                  type="text"
                  autoComplete="organization"
                  {...register("name", {
                    required: showBusinessFields ? "Obligatorio" : false,
                  })}
                />
                {errors.name ? <p className="enterprise-login__field-error">{errors.name.message}</p> : null}

                <label className="enterprise-login__label" htmlFor="business-slug">
                  Slug público
                </label>
                <div className="enterprise-login__slug-wrap">
                  <span className="enterprise-login__slug-prefix">booked.es/</span>
                  <input
                    id="business-slug"
                    className={classNames("enterprise-login__input", "enterprise-login__input--slug", {
                      "enterprise-login__input--error": errors.slug,
                    })}
                    type="text"
                    autoComplete="off"
                    placeholder="mi-negocio"
                    {...register("slug", {
                      required: showBusinessFields ? "Obligatorio" : false,
                    })}
                  />
                </div>
                {errors.slug ? <p className="enterprise-login__field-error">{errors.slug.message}</p> : null}
              </>
            ) : null}

            {showCredentials ? (
              <>
                <label className="enterprise-login__label" htmlFor="enterprise-email">
                  Email
                </label>
                <input
                  id="enterprise-email"
                  className={classNames("enterprise-login__input", {
                    "enterprise-login__input--error": errors.email,
                  })}
                  type="email"
                  autoComplete="email"
                  {...register("email", {
                    required: showCredentials ? "Obligatorio" : false,
                  })}
                />
                {errors.email ? <p className="enterprise-login__field-error">{errors.email.message}</p> : null}

                <label className="enterprise-login__label" htmlFor="enterprise-password">
                  Contraseña
                </label>
                <div
                  className={classNames("enterprise-login__password-wrap", {
                    "enterprise-login__password-wrap--error": errors.password,
                  })}
                >
                  <input
                    id="enterprise-password"
                    className="enterprise-login__input enterprise-login__input--password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={activeMode === "login" ? "current-password" : "new-password"}
                    {...passwordField}
                    onChange={(event) => {
                      void onPasswordChange(event);
                      setPasswordValue(event.target.value);
                    }}
                  />
                  <button
                    type="button"
                    className="enterprise-login__visibility"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => {
                      setShowPassword((current) => !current);
                    }}
                  >
                    {showPassword ? (
                      <VisibilityOffIcon className="enterprise-login__visibility-icon" />
                    ) : (
                      <VisibilityIcon className="enterprise-login__visibility-icon" />
                    )}
                  </button>
                </div>
                {errors.password ? <p className="enterprise-login__field-error">{errors.password.message}</p> : null}

                {activeMode === "signup" && passwordStrength !== "empty" ? (
                  <div className="enterprise-login__strength" aria-live="polite">
                    <div
                      className={[
                        "enterprise-login__strength-bar",
                        `enterprise-login__strength-bar--${passwordStrength}`,
                      ].join(" ")}
                    />
                    <p
                      className={[
                        "enterprise-login__strength-label",
                        `enterprise-login__strength-label--${passwordStrength}`,
                      ].join(" ")}
                    >
                      Contraseña {strengthLabel.toLowerCase()}
                    </p>
                  </div>
                ) : null}

                {activeMode === "signup" ? (
                  <>
                    <label className="enterprise-login__label" htmlFor="enterprise-confirm-password">
                      Confirmar contraseña
                    </label>
                    <div
                      className={classNames("enterprise-login__password-wrap", {
                        "enterprise-login__password-wrap--error": errors.confirmPassword,
                      })}
                    >
                      <input
                        id="enterprise-confirm-password"
                        className="enterprise-login__input enterprise-login__input--password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        {...register("confirmPassword", {
                          required: activeMode === "signup" ? "Confirma tu contraseña" : false,
                          validate: (value) =>
                            activeMode === "signup"
                              ? value === getValues("password") || "Las contraseñas no coinciden"
                              : true,
                        })}
                      />
                      <button
                        type="button"
                        className="enterprise-login__visibility"
                        aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
                        onClick={() => {
                          setShowConfirmPassword((current) => !current);
                        }}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOffIcon className="enterprise-login__visibility-icon" />
                        ) : (
                          <VisibilityIcon className="enterprise-login__visibility-icon" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword ? (
                      <p className="enterprise-login__field-error">{errors.confirmPassword.message}</p>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}

            {formError ? (
              <p className="enterprise-login__alert" role="alert">
                {formError}
              </p>
            ) : null}
            {completeHint || infoMessage ? (
              <p className="enterprise-login__info" role="status">
                {infoMessage ?? completeHint}
              </p>
            ) : null}

            <button
              type="submit"
              className={classNames("enterprise-login__submit", {
                "enterprise-login__submit--loading": isSubmitting,
              })}
              disabled={isSubmitting || isSessionLoading}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? <ProgressSpinnerIcon className="enterprise-login__submit-spinner" /> : null}
              <span>{isSubmitting ? submittingLabel : submitLabel}</span>
            </button>
          </form>
        </div>
      </section>

      <aside className="enterprise-login__showcase" aria-hidden="true">
        <div className="enterprise-login__showcase-card">
          <p className="enterprise-login__showcase-kicker">Panel empresa</p>
          <p className="enterprise-login__showcase-title">Agenda en vivo, servicios y reservas en un solo sitio.</p>
          <ul className="enterprise-login__showcase-list">
            <li>Página pública de reservas con tu slug</li>
            <li>Control de citas confirmadas</li>
            <li>Configuración de servicios (próximamente)</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
