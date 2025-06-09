import type { SVGProps } from "react";

export function SakuraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2.4c-.9.4-1.8.8-2.8 1.1-2.8.9-5.2 3.1-5.2 6.1 0 1.9.8 3.6 2.1 4.8" />
      <path d="M12 2.4c.9.4 1.8.8 2.8 1.1 2.8.9 5.2 3.1 5.2 6.1 0 1.9-.8 3.6-2.1 4.8" />
      <path d="M14.1 14.4c1.3 1.2 2.1 2.9 2.1 4.8 0 3-2.4 5.3-5.2 6.1-.9.3-1.9.7-2.8 1.1" />
      <path d="M9.9 14.4c-1.3 1.2-2.1 2.9-2.1 4.8 0 3 2.4 5.3 5.2 6.1.9.3 1.9.7 2.8 1.1" />
      <path d="M12 2.4V7M12 17v4.6" />
      <path d="m12 12-4-2M12 12l4-2M12 12l-2 4M12 12l2 4" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}
