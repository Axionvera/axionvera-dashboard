import React from "react";

export type WalletIconProps = {
  svg: string;
  label: string;
};

/** Inline SVG icon renderer — wallets ship their own SVG strings. */
export function WalletIcon({ svg, label }: WalletIconProps) {
  return (
    <span
      className="h-5 w-5 shrink-0 [&>svg]:h-full [&>svg]:w-full"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
      title={label}
    />
  );
}

export default WalletIcon;
