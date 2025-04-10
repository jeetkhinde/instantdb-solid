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
import { InstantSolidRoom } from "./InstantSolidRoom";
  
 
// --- Component Implementation ---

export function Cursors<
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
>({
  as = 'div',
  spaceId: _spaceId,
  room,
  className,
  style,
  userCursorColor,
  children,
  renderCursor,
  propagate,
  zIndex,
}: {
  spaceId?: string;
  room: InstantSolidRoom;
  style?: JSX.CSSProperties;
  userCursorColor?: string;
  as?: any;
  className?: string;
  children?: JSX.Element;
  renderCursor?: (props: {
    color: string;
    presence: RoomSchema[RoomType]['presence'];
  }) => JSX.Element;
  propagate?: boolean;
  zIndex?: number;
}) {
   
  const spaceId = _spaceId ||
      `cursors-space-default--${String(room.type)}-${room.id}`;

  const cursorsPresence = room.createPresence({ keys: [spaceId] });
  const fullPresence = room._core._reactor.getPresence(room.type, room.id);

  function publishCursor(
    rect: DOMRect,
    touch: { clientX: number; clientY: number },
  ) {
    const x = touch.clientX;
    const y = touch.clientY;
    const xPercent = ((x - rect.left) / rect.width) * 100;
    const yPercent = ((y - rect.top) / rect.height) * 100;
    cursorsPresence.publishPresence({
      [spaceId]: {
        x,
        y,
        xPercent,
        yPercent,
        color: userCursorColor,
      },
    } as RoomSchema[RoomType]['presence']);
  }

 const onMouseMove = (e: MouseEvent) => {
    if (!propagate) {
      e.stopPropagation();
    }
    // Ensure currentTarget is an Element before getting bounding rect
    if (e.currentTarget instanceof Element) {
      const rect = e.currentTarget.getBoundingClientRect();
      publishCursor(rect, e);
    }
  };

  function clearCursor() {
    cursorsPresence.publishPresence({
      [spaceId]: undefined,
    } as RoomSchema[RoomType]['presence']);
  }

  const onMouseOut = (e: MouseEvent) => {
    clearCursor();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      return;
    }

    const touch = e.touches[0];
    if (touch.target instanceof Element) {
      if (!propagate) {
        e.stopPropagation();
      }
      const rect = touch.target.getBoundingClientRect();
      publishCursor(rect, touch);
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    clearCursor();
  };

  // Use createMemo to get peers reactively from the presence state
  const peerEntries = createMemo(
    () => Object.entries(cursorsPresence.state()?.peers ?? {}) // Access reactive state
  );

  return (
    <Dynamic
      component={as}
      onMouseMove={onMouseMove}
      onMouseOut={onMouseOut}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={className}
      style={{
        position: "relative",
        ...(style || {}),
      }}
    >
      {children}
      <div
      key={spaceId}
        style={{
          ...absStyles,
          ...inertStyles,
          "z-index": zIndex !== undefined ? zIndex : defaultZ,
        }}
      >

        {Object.entries(cursorsPresence.peers).map(([id, presence]) => {
          const cursor = presence[spaceId];
          if (!cursor) return null;
          return (
            <div
              key={id}
              style={{
                ...absStyles,
                transform: `translate(${cursor?.xPercent ?? 0}%, ${cursor?.yPercent ?? 0}%)`,
                "transform-origin": "0 0",
                transition: "transform 100ms",
              }}
            >
              <Show
                when={renderCursor}
                fallback={<Cursor color={cursor?.color} />}
                children={(renderFn: any) => {
                  const peerFullPresence = fullPresence.peers[id];
                  return renderFn({
                    color: cursor?.color ?? "",
                    presence: peerFullPresence ?? {},
                  });
                }}
              />
            </div>
          );
        })}
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
