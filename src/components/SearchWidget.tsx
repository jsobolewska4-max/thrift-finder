"use client";

import { useEffect } from "react";
import Script from "next/script";

export default function SearchWidget() {
  useEffect(() => {
    // Declare the custom element for TypeScript/React
    // The widget script registers <gen-search-widget> as a web component
  }, []);

  return (
    <>
      <Script
        src="https://cloud.google.com/ai/gen-app-builder/client?hl=en_US"
        strategy="afterInteractive"
      />
      {/* @ts-expect-error -- gen-search-widget is a web component registered by the Google script */}
      <gen-search-widget
        configId="3a8edaa0-fd1d-41d0-86f9-67d0f2f8cb31"
        triggerId="searchWidgetTrigger"
      />
      <div className="w-full max-w-xl">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            readOnly
            placeholder='Search for an item, e.g. "Nicole Salda&#241;a Fabiana Mary Jane"'
            id="searchWidgetTrigger"
            className="h-14 w-full cursor-pointer rounded-2xl border border-neutral-200 bg-white pl-12 pr-4 text-base shadow-sm transition-all hover:border-neutral-400 hover:shadow-md focus:border-neutral-400 focus:shadow-md focus:outline-none"
          />
        </div>
      </div>
    </>
  );
}
