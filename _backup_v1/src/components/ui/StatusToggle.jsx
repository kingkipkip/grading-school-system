import { Check, Clock, X, AlertCircle } from 'lucide-react'

/**
 * ปุ่มเปลี่ยนสถานะการส่งงานแบบ Toggle (วนลูป)
 * missing -> submitted -> late -> missing
 * 
 * @param {string} status - สถานะปัจจุบัน ('submitted', 'late', 'missing' หรือ null)
 * @param {function} onChange - ฟังก์ชันรับค่าสถานะใหม่ (newStatus) => void
 * @param {boolean} disabled - ปิดการใช้งานปุ่ม
 */
export default function StatusToggle({ status, onChange, disabled = false }) {

    // แปลงสถานะ null/undefined เป็น 'missing'
    const currentStatus = status || 'missing'

    const handleClick = () => {
        if (disabled) return

        let newStatus = 'missing'
        if (currentStatus === 'missing') {
            newStatus = 'submitted'
        } else if (currentStatus === 'submitted') {
            newStatus = 'late'
        } else if (currentStatus === 'late') {
            newStatus = 'missing'
        }

        onChange(newStatus)
    }

    // Config สีและไอคอนตามสถานะ
    const config = {
        submitted: {
            color: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200',
            icon: <Check size={18} />,
            label: 'ส่งปกติ'
        },
        late: {
            color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
            icon: <Clock size={18} />,
            label: 'ส่งช้า'
        },
        missing: {
            color: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
            icon: <X size={18} />,
            label: 'ขาดส่ง'
        }
    }

    const { color, icon, label } = config[currentStatus] || config.missing

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            title={`สถานะปัจจุบัน: ${label} (คลิกเพื่อเปลี่ยน)`}
            className={`
        relative flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
        ${color}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
        w-[110px]
      `}
        >
            {icon}
            <span className="font-medium text-sm">{label}</span>

            {/* Tooltip hint (optional, user might want purely click) */}
        </button>
    )
}
