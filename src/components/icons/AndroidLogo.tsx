
import React from "react";

const AndroidLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M17.42,8.2l1-1a.51.51,0,0,0,0-.72.52.52,0,0,0-.71,0l-1,1a.5.5,0,0,0,0,.71A.51.51,0,0,0,17.42,8.2Z" />
    <path d="M7.3,7.49l-1-1a.5.5,0,1,0-.71.71l1,1a.5.5,0,0,0,.35.14.49.49,0,0,0,.36-.15A.51.51,0,0,0,7.3,7.49Z" />
    <rect x="8.5" y="11" width="7" height="5.5" rx="1" />
    <path d="M15.5,6h-7A2.5,2.5,0,0,0,6,8.5v6A2.5,2.5,0,0,0,8.5,17h7A2.5,2.5,0,0,0,18,14.5v-6A2.5,2.5,0,0,0,15.5,6Zm1.5,8.5A1.5,1.5,0,0,1,15.5,16h-7A1.5,1.5,0,0,1,7,14.5v-6A1.5,1.5,0,0,1,8.5,7h7A1.5,1.5,0,0,1,17,8.5Z" />
  </svg>
);

export default AndroidLogo;
