"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { spec } from "./spec";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-gray-500">Loading API docs...</div>,
});
import "swagger-ui-react/swagger-ui.css";

function AuthInfo() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(data.authenticated);
        setToken(data.token || "");
      })
      .catch(() => setAuthenticated(false));
  }, []);

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyCurl = () => {
    const example = `curl -H "Cookie: admin_session=${token}" ${window.location.origin}/api/admin/products`;
    navigator.clipboard.writeText(example);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authenticated === null) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="font-bold text-gray-800 mb-2">Authentication</h3>
      <p className="text-sm text-gray-600 mb-3">
        All admin API routes require a JWT cookie (<code className="bg-gray-200 px-1 rounded text-xs">admin_session</code>).
        &quot;Try it out&quot; works automatically since the browser sends the cookie. Copy the token below for external tools like Postman or curl.
      </p>
      {authenticated ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-green-700">Authenticated</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">JWT Token</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border rounded px-3 py-2 truncate text-gray-500 select-all block overflow-hidden">
                {token}
              </code>
              <button
                onClick={copyToken}
                className="px-3 py-2 bg-teal text-white text-xs font-medium rounded hover:bg-teal/90 transition-colors whitespace-nowrap"
              >
                {copied ? "Copied!" : "Copy Token"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Example curl</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border rounded px-3 py-2 text-gray-500 select-all block overflow-x-auto whitespace-nowrap">
                curl -H &quot;Cookie: admin_session={token?.slice(0, 20)}...&quot; /api/admin/products
              </code>
              <button
                onClick={copyCurl}
                className="px-3 py-2 bg-gray-700 text-white text-xs font-medium rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
              >
                Copy curl
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-sm font-medium text-red-700">
            Not authenticated &mdash; <a href="/admin/login" className="underline">log in</a> first
          </span>
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white p-6">
      <AuthInfo />
      <SwaggerUI spec={spec} />
    </div>
  );
}
