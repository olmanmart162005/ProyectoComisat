/// <reference types="vite/client" />

declare module "*.svg?react" {
  import * as React from "react";

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;

  const component: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default component;
}
