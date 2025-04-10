// solidjs/src/types.ts
import type {
  PresenceResponse,
  PresenceOpts as CorePresenceOpts,
} from "@instantdb/core";
import type { Accessor } from "solid-js";

// === Presence Types ===

/**
 * Options for presence hooks (re-exporting core for convenience if needed,
 * or defining custom ones). For now, let's assume CorePresenceOpts is sufficient.
 */
export type PresenceOpts<
  PresenceShape,
  Keys extends keyof PresenceShape,
> = CorePresenceOpts<PresenceShape, Keys>;

/**
 * Helper type including loading state for presence responses.
 */
export type PresenceResponseWithLoading<
  PresenceShape,
  Keys extends keyof PresenceShape,
> = PresenceResponse<PresenceShape, Keys> & { isLoading: boolean; };

/**
 * The return type (handle) for the `createPresence` hook.
 * It includes the reactive presence state and the publish function.
 */
export type PresenceHandle<
  PresenceShape,
  Keys extends keyof PresenceShape,
> = PresenceResponseWithLoading<PresenceShape, Keys> & {
  publishPresence: ( data: Partial<PresenceShape> ) => void;
};

// === Typing Indicator Types ===

/**
 * Options for the `createTypingIndicator` hook.
 */
export type TypingIndicatorOpts = {
  timeout?: number | null;
  stopOnEnter?: boolean;
  writeOnly?: boolean; // Perf opt - `active` will always be an empty array
};

// Helper type for keyboard/focus events if not using JSX namespace directly
type KeyboardEvent = globalThis.KeyboardEvent;
type FocusEvent = globalThis.FocusEvent;

/**
 * The return type (handle) for the `createTypingIndicator` hook.
 * It includes reactive accessors for active peers and input properties,
 * and the function to manually set the typing state.
 */
export type TypingIndicatorHandle<PresenceShape> = {
  active: Accessor<PresenceShape[]>; // Active peers signal
  setActive( active: boolean ): void;
  inputProps: Accessor<{
    // Props need to be accessed reactively
    onKeyDown: ( e: KeyboardEvent ) => void;
    onBlur: ( e: FocusEvent ) => void;
  }>;
};

// === Query Types ===
// If createQuery hook needs specific types exposed, add them here.
// For now, it uses types directly from @instantdb/core like InstaQLLifecycleState
