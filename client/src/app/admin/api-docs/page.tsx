"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { spec } from "./spec";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI spec={spec} />
    </div>
  );
}
