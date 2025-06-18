import React from 'react';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import type { DataTableProps as PrimeProps } from 'primereact/datatable';
import { Column as PrimeColumn } from 'primereact/column';

interface Column {
  header: string;
  field: string;
  sortable?: boolean;
  body?: (rowData: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  striped?: boolean;
  hover?: boolean;
  paginator?: boolean;
  rows?: number;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  striped = true,
  hover = true,
  paginator = false,
  rows = 10
}) => {
  // Use generic type argument for PrimeProps
  const dtProps: PrimeProps<Record<string, any>[]> = {
    value: data,
    stripedRows: striped,
    rowHover: hover,
    paginator,
    rows
  };

  return (
    <div className="p-datatable-responsive-demo">
      <PrimeDataTable {...dtProps} className="p-datatable-sm">
        {columns.map((col) => (
          <PrimeColumn
            key={col.field}
            field={col.field}
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
