
import React from "react";

const GooglePlayLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    {...props}
  >
    <path d="M11.6 0C8.4.1 5.4 1.5 3.3 3.9 1.2 6.3 0 9.4 0 12.7v486.6C0 505.8 5.8 512 12.7 512c3.3 0 6.5-1.3 8.9-3.7L256 273.7 11.6 0z" fill="#00e676"/>
    <path d="M508.4 246.3c2.4-2.5 3.8-5.7 3.6-9.1s-2-6.5-4.3-8.6L400.2 121 256 273.7l158.4 92.4 94-59.8z" fill="#f44336"/>
    <path d="M256 273.7L11.6 512c2.4 2.4 5.5 3.7 8.9 3.7 2.1 0 4.2-.6 6.1-1.8l224-129.5-1.6-92.7z" fill="#ffc107"/>
    <path d="M256 0L29.7 256l226.3 1.7L499.7 121 256 0z" fill="#2196f3"/>
  </svg>
);

export default GooglePlayLogo;
