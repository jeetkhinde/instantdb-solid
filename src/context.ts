// src/context.ts
import { createContext, useContext } from "solid-js";

import type { IDatabase as InstantDB } from "@instantdb/core"; // Adjust as needed

export type DBContextType = InstantDB | undefined;

export const InstantDBContext = createContext<DBContextType>(undefined);

export function useDb(): InstantDB {
  const context = useContext(InstantDBContext);
  if (!context) {
    throw new Error("useDb must be used within an InstantDBContext.Provider");
  }
  return context;
}

// Optional: Export Provider directly if you don't need a custom init component
export const InstantDBProvider = InstantDBContext.Provider;
