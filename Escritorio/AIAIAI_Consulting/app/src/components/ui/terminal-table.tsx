import { ReactNode } from 'react';

interface Column {
  key: string;
  header: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface TerminalTableProps {
  title?: string;
  columns: Column[];
  data: Record<string, unknown>[];
  borderColor?: 'cyan' | 'green' | 'yellow' | 'purple' | 'red';
  onRowClick?: (row: Record<string, unknown>) => void;
}

const borderColorMap = {
  cyan: 'border-cyan-400',
  green: 'border-green-400',
  yellow: 'border-yellow-400',
  purple: 'border-purple-400',
  red: 'border-red-400',
};

const textColorMap = {
  cyan: 'text-cyan-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
};

export function TerminalTable({
  title,
  columns,
  data,
  borderColor = 'cyan',
  onRowClick
}: TerminalTableProps) {
  const borderClass = borderColorMap[borderColor];
  const textClass = textColorMap[borderColor];

  return (
    <div className={`border-2 ${borderClass} bg-black overflow-hidden relative`}>
      {title && (
        <div className={`absolute -top-3 left-4 bg-black px-2 ${textClass} text-xs tracking-widest`}>
          ▐ {title.toUpperCase()} ▌
        </div>
      )}
      <table className="w-full">
        <thead className="border-b-2 border-gray-800">
          <tr className="text-xs text-gray-400 uppercase tracking-widest">
            {columns.map((column) => (
              <th key={column.key} className="text-left p-3 font-[family-name:var(--font-jetbrains)]">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono text-sm">
          {data.map((row, index) => (
            <tr
              key={index}
              className={`
                border-b border-gray-900
                hover:bg-zinc-950
                transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td key={column.key} className="p-3">
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center p-8 text-gray-400 uppercase tracking-wide text-xs">
          NO DATA AVAILABLE
        </div>
      )}
    </div>
  );
}
