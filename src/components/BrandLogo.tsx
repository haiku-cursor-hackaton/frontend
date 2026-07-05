import logoDark from "@/assets/logo_genko_dark.svg";
import logoLight from "@/assets/logo_genko.svg";
import { cx } from "@/components/ui";

type BrandLogoVariant = "auto" | "inverse" | "light" | "dark";

type BrandLogoProps = {
  className?: string;
  variant?: BrandLogoVariant;
};

export default function BrandLogo({
  className,
  variant = "auto",
}: BrandLogoProps) {
  if (variant === "light" || variant === "dark") {
    return (
      <img
        src={variant === "dark" ? logoDark : logoLight}
        width="154"
        height="49"
        alt="Genko"
        className={cx("block h-auto w-auto shrink-0", className)}
      />
    );
  }

  return (
    <span
      className={cx(
        "genko-logo inline-grid shrink-0",
        variant === "inverse" ? "genko-logo--inverse" : "genko-logo--auto",
        className,
      )}
      aria-label="Genko"
      role="img"
    >
      <img
        src={logoLight}
        width="154"
        height="49"
        alt=""
        className="genko-logo__light h-full w-auto"
      />
      <img
        src={logoDark}
        width="154"
        height="49"
        alt=""
        className="genko-logo__dark h-full w-auto"
      />
    </span>
  );
}
