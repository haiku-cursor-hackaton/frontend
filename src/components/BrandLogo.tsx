import logoDark from "@/assets/logo_genko_dark.svg";
import logoLight from "@/assets/logo_genko.svg";
import { cx } from "@/components/ui";

type BrandLogoVariant = "auto" | "inverse" | "light" | "dark";

type BrandLogoProps = {
  className?: string;
  variant?: BrandLogoVariant;
};

const DEFAULT_SIZE = "h-[26px]";

export default function BrandLogo({
  className = DEFAULT_SIZE,
  variant = "auto",
}: BrandLogoProps) {
  if (variant === "light" || variant === "dark") {
    return (
      <img
        src={variant === "dark" ? logoDark : logoLight}
        width={154}
        height={49}
        alt="Genko"
        className={cx("block w-auto max-w-none shrink-0 object-contain", className)}
      />
    );
  }

  return (
    <span
      className={cx(
        "genko-logo relative inline-block shrink-0 overflow-hidden leading-none",
        variant === "inverse" ? "genko-logo--inverse" : "genko-logo--auto",
        className,
      )}
      aria-label="Genko"
      role="img"
    >
      <img
        src={logoLight}
        width={154}
        height={49}
        alt=""
        aria-hidden
        className="genko-logo__light block h-full w-auto max-w-none object-contain object-left"
      />
      <img
        src={logoDark}
        width={154}
        height={49}
        alt=""
        aria-hidden
        className="genko-logo__dark absolute inset-y-0 left-0 block h-full w-auto max-w-none object-contain object-left"
      />
    </span>
  );
}
