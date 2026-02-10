import { useIsMobile } from '../../hooks/useMediaQuery'

/**
 * ResponsiveTable - แสดงตารางแบบ responsive
 * บน desktop: แสดงเป็นตารางปกติ
 * บน mobile: แสดงเป็น cards
 */
export default function ResponsiveTable({ 
  columns, 
  data, 
  keyExtractor,
  emptyMessage = 'ไม่มีข้อมูล',
  onRowClick 
}) {
  const isMobile = useIsMobile()

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  // Desktop Table View
  if (!isMobile) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((row, rowIndex) => (
              <tr
                key={keyExtractor ? keyExtractor(row) : rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Mobile Card View
  return (
    <div className="space-y-3">
      {data.map((row, rowIndex) => (
        <div
          key={keyExtractor ? keyExtractor(row) : rowIndex}
          onClick={() => onRowClick && onRowClick(row)}
          className={`bg-white border border-gray-200 rounded-lg p-4 ${
            onRowClick ? 'active:bg-gray-50' : ''
          }`}
        >
          {columns.map((column, colIndex) => {
            // Skip if column has hideOnMobile flag
            if (column.hideOnMobile) return null
            
            return (
              <div key={colIndex} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-500 flex-shrink-0 w-1/3">
                  {column.header}
                </span>
                <span className="text-sm text-gray-900 flex-1 text-right">
                  {column.render ? column.render(row) : row[column.key]}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/**
 * ตัวอย่างการใช้งาน:
 * 
 * const columns = [
 *   { 
 *     key: 'student_id', 
 *     header: 'รหัส',
 *     hideOnMobile: true // ซ่อนใน mobile
 *   },
 *   { 
 *     key: 'name', 
 *     header: 'ชื่อ',
 *     render: (row) => `${row.first_name} ${row.last_name}` 
 *   },
 *   { 
 *     key: 'score', 
 *     header: 'คะแนน' 
 *   }
 * ]
 * 
 * <ResponsiveTable
 *   columns={columns}
 *   data={students}
 *   keyExtractor={(row) => row.id}
 *   onRowClick={(row) => handleRowClick(row)}
 * />
 */
