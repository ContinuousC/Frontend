/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import * as React from "react";

export default function ChartHoneycomb<T>({
  items,
  size,
  columns,
  className,
  gap = 4,
  renderItem,
}: HoneycombProps<T>) {
  const rowSize = getRowSize(size);
  const columnSize = getColumnSize(size);

  return (
    <HoneycombContext.Provider value={{ gap }}>
      <ul
        className={className}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns * 4}, ${columnSize}px)`,
          justifyContent: "center",
          gridAutoRows: `${rowSize}px`,
          padding: `0 ${columnSize}px`,
          listStyle: "none",
        }}
      >
        {items.map((item, index) => {
          const row = 1 + Math.floor(index / columns) * 3;
          const column = 1 + (index % columns) * 4;
          const renderedItem = renderItem(item, index);

          return (
            <HoneycombCell key={index} row={row} column={column}>
              {renderedItem}
            </HoneycombCell>
          );
        })}
      </ul>
    </HoneycombContext.Provider>
  );
}

function HoneycombCell({
  children,
  row,
  column,
}: HoneycombCellProps & { children: React.ReactNode }) {
  const transform = row % 2 ? `translateX(25%)` : `translateX(-25%)`;
  return (
    <li
      style={{
        gridRow: `${row} / span 4`,
        gridColumn: `${column} / span 4`,
        pointerEvents: "none",
        transform,
      }}
    >
      {children}
    </li>
  );
}

export function Hexagon({
  children,
  className,
  style = {},
}: HexagonProps & { children?: React.ReactNode }) {
  const { gap } = React.useContext(HoneycombContext);
  const clipPath = `polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`;
  return (
    <div
      className={className}
      style={{
        ...style,
        position: "absolute",
        top: gap / 2,
        left: gap / 2,
        right: gap / 2,
        bottom: gap / 2,
        clipPath,
        pointerEvents: "auto",
      }}
    >
      {children}
    </div>
  );
}

export const HoneycombContext = React.createContext({ gap: 0 });

export function getGridColumnsCount(
  hexagonSide: number,
  containerWidth: number
): number {
  const hexagonWidth = Math.sqrt(3) * hexagonSide;
  const columns = Math.floor(containerWidth / hexagonWidth);
  return columns;
}

export function getRowSize(hexagonSide: number): number {
  return hexagonSide / 2;
}

export function getColumnSize(hexagonSide: number): number {
  return (Math.sqrt(3) * hexagonSide) / 4;
}

export interface CommonHoneycombProps<T> {
  size: number;
  items: Array<T>;
  renderItem(item: T, index: number): React.ReactElement;
  className?: string;
  gap?: number;
}

export interface HoneycombProps<T> extends CommonHoneycombProps<T> {
  columns: number;
}

export interface HoneycombCellProps {
  row: number;
  column: number;
}

export interface HexagonProps {
  className?: string;
  style?: React.CSSProperties;
}
