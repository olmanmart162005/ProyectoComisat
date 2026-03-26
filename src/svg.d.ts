declare module "*.svg?react" {
  import * as React from "react";

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;

  const src: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default src;
}
