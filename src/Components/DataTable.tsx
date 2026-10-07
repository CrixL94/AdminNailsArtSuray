import React from "react";
import { DataTable as PrimeDataTable } from "primereact/datatable";
import type { DataTableProps as PrimeProps } from "primereact/datatable";
import { Column as PrimeColumn } from "primereact/column";

interface Column {
  header: string;
  field?: string;
  sortable?: boolean;
  body?: (rowData: any, options?: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  striped?: boolean;
  hover?: boolean;
  paginator?: boolean;
  rows?: number;
  emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  striped = true,
  hover = true,
  paginator = false,
  rows = 10,
  emptyMessage = "No hay registros.",
}) => {
  const dtProps: PrimeProps<Record<string, any>[]> = {
    value: data,
    stripedRows: striped,
    rowHover: hover,
    // La paginación se activa sola cuando hay más filas que "rows"
    paginator: paginator || data.length > rows,
    rows,
    emptyMessage,
  };

  return (
    <div className="overflow-hidden">
      <PrimeDataTable {...dtProps} className="p-datatable-sm">
        {columns.map((col, index) => (
          <PrimeColumn
            key={col.field ?? `col-${index}`}
            {...(col.field ? { field: col.field } : {})}
            header={col.header}
            sortable={col.sortable}
            body={col.body}
          />
        ))}
      </PrimeDataTable>
    </div>
  );
};

export default DataTable;
