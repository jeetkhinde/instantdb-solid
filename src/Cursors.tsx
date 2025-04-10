/** @format */

import {
  type Component,
  type JSX,
  createMemo,
  onCleanup,
  For,
  Show,
} from "solid-js";
import { Dynamic } from "solid-js/web";

import type { RoomSchemaShape } from "@instantdb/core";

import { createPresence, type PresenceHandle } from "./hooks/index.js";

// --- Type Definitions ---

// Adjust InstantReactRoom to a hypothetical InstantSolidRoom or core type
type InstantRoomForSolid<
  Schema extends RoomSchemaShape,
  Type extends keyof Schema,
> = {
  id: string;
  type: Type;
  // Assuming createPresence is a method or we pass `room` to a top-level function
  // presence: (options: { keys: string[] }) => PresenceHandle<Schema[Type]['presence']>;
  // Assuming direct access or a helper for full presence
  _core: {
    _reactor: {
      getPresence: (
        type: Type,
        id: string
      ) => { peers: Record<string, Schema[Type]["presence"]> }; // Simplified type
    };
  };
};

interface CursorsProps<
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
> {
  spaceId?: string;
  room: InstantRoomForSolid<RoomSchema, RoomType>;
  style?: JSX.CSSProperties;
  userCursorColor?: string;
  as?: keyof JSX.IntrinsicElements | Component<any>; // Allow intrinsic elements or components
  className?: string;
  children?: JSX.Element;
  renderCursor?: (props: {
    color: string;
    presence: RoomSchema[RoomType]["presence"];
  }) => JSX.Element;
  propagate?: boolean;
  zIndex?: number;
}

// --- Component Implementation ---

export function Cursors<
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
>(props: CursorsProps<RoomSchema, RoomType>): JSX.Element {
  const asElement = () => props.as || "div";
  const zIndex = () => (props.zIndex !== undefined ? props.zIndex : defaultZ);

  // Derive spaceId - createMemo ensures it recalculates if props.spaceId or props.room changes
  const spaceId = createMemo(
    () =>
      props.spaceId ||
      `cursors-space-default--${String(props.room.type)}-${props.room.id}`
  );

  const cursorsPresence = createPresence(props.room, () => ({
    keys: [spaceId()], // Pass the derived spaceId reactively
  }));
  // -------------------------------------------------------

  const fullPresence = createMemo(() =>
    props.room._core._reactor.getPresence(props.room.type, props.room.id)
  );

  function publishCursorPosition(
    rect: DOMRect,
    clientCoords: { clientX: number; clientY: number }
  ) {
    const x = clientCoords.clientX;
    const y = clientCoords.clientY;
    const xPercent = ((x - rect.left) / rect.width) * 100;
    const yPercent = ((y - rect.top) / rect.height) * 100;

    // Call the publish function from the hypothetical createPresence hook
    cursorsPresence.publishPresence({
      [spaceId()]: {
        // Use the reactive spaceId value
        x,
        y,
        xPercent,
        yPercent,
        color: props.userCursorColor,
      },
    } as RoomSchema[RoomType]["presence"]);
  }

  function clearCursorPosition() {
    // Call the publish function from the hypothetical createPresence hook
    cursorsPresence.publishPresence({
      [spaceId()]: undefined, // Use the reactive spaceId value
    } as RoomSchema[RoomType]["presence"]);
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!props.propagate) {
      e.stopPropagation();
    }
    // Ensure currentTarget is an Element before getting bounding rect
    if (e.currentTarget instanceof Element) {
      const rect = e.currentTarget.getBoundingClientRect();
      publishCursorPosition(rect, e);
    }
  };

  const onMouseOut = (e: MouseEvent) => {
    // Clear presence when mouse leaves the tracked area
    clearCursorPosition();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      return; // Handle only single touch for cursor
    }

    const touch = e.touches[0];

    if (touch.target instanceof Element) {
      if (!props.propagate) {
        e.stopPropagation();
      }
      const rect = touch.target.getBoundingClientRect(); // Get rect of the element touched
      publishCursorPosition(rect, touch);
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    // Clear presence when touch ends
    clearCursorPosition();
  };

  // Use createMemo to get peers reactively from the presence state
  const peerEntries = createMemo(
    () => Object.entries(cursorsPresence.state()?.peers ?? {}) // Access reactive state
  );

  return (
    <Dynamic
      component={asElement()}
      onMouseMove={onMouseMove}
      onMouseOut={onMouseOut}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={props.className}
      style={{
        position: "relative",
        ...(props.style || {}), // Merge styles
      }}
    >
      {/* Render children */}
      {props.children}

      {/* Cursors Container */}
      <div
        style={{
          ...absStyles,
          ...inertStyles,
          "z-index": zIndex(), // Use function access for reactivity
        }}
      >
        <For each={peerEntries()}>
          {([id, presence]) => {
            // Access the specific cursor data for this spaceId reactively
            const cursor = createMemo(
              () =>
                (presence as Record<string, RoomSchema[RoomType]["presence"]>)[
                  spaceId()
                ]
            );

            return (
              <Show when={cursor()}>
                {(
                  cursorData // cursorData is the non-null cursor object
                ) => (
                  <div
                    style={{
                      ...absStyles,
                      transform: `translate(${cursorData().xPercent}%, ${cursorData().yPercent}%)`,
                      "transform-origin": "0 0",
                      transition: "transform 100ms", // Consider making duration configurable
                    }}
                  >
                    <Show
                      when={props.renderCursor}
                      fallback={<Cursor color={cursorData().color} />}
                    >
                      {(renderFn) => {
                        // Get the full presence for the current peer reactively
                        const peerFullPresence = createMemo(
                          () => fullPresence().peers[id]
                        );
                        return renderFn()({
                          // Call the render prop function
                          color: cursorData().color,
                          presence: peerFullPresence(),
                        });
                      }}
                    </Show>
                  </div>
                )}
              </Show>
            );
          }}
        </For>
      </div>
    </Dynamic>
  );
}

// --- Default Cursor Component ---

function Cursor(props: { color: string }): JSX.Element {
  const size = 35;
  // Use a function for fill to make it potentially reactive if props.color could change
  const fill = () => props.color || "black";

  // SVG attributes in Solid JSX are generally camelCased or kebab-cased strings
  return (
    <svg
      style={{ height: `${size}px`, width: `${size}px` }} // Use template literals for clarity
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Use fill directly on <g> if possible, otherwise check SVG specifics */}
      <g fill="rgba(0,0,0,.2)" transform="translate(-12 -8.4)">
        <path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
        <path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
      </g>
      <g fill="white" transform="translate(-12 -8.4)">
        <path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
        <path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
      </g>
      <g fill={fill()} transform="translate(-12 -8.4)">
        <path d="m19.751 24.4155-1.844.774-3.1-7.374 1.841-.775z" />
        <path d="m13 10.814v11.188l2.969-2.866.428-.139h4.768z" />
      </g>
    </svg>
  );
}

// --- Style Constants ---

const absStyles: JSX.CSSProperties = {
  position: "absolute",
  top: "0", // Use strings for pixel values often
  left: "0",
  bottom: "0",
  right: "0",
};

const inertStyles: JSX.CSSProperties = {
  overflow: "hidden",
  "pointer-events": "none", // Kebab-case is standard for CSS properties
  "user-select": "none", // Kebab-case
};

const defaultZ = 99999;
