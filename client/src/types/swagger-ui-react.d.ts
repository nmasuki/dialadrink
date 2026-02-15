declare module "swagger-ui-react" {
  import { ComponentType } from "react";
  const SwaggerUI: ComponentType<{ spec?: object; url?: string }>;
  export default SwaggerUI;
}

declare module "swagger-ui-react/swagger-ui.css";
