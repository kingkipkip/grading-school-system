import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAcademicStore } from '../../stores/academicStore'
import { Plus, Calendar, Trash2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AcademicYearManagement() {
    const navigate = useNavigate()
    const { academicYears, loading, fetchAcademicYears } = useAcademicStore()
    const [showYearModal, setShowYearModal] = useState(false)
    const [showSemesterModal, setShowSemesterModal] = useState(false)
    const [selectedYearId, setSelectedYearId] = useState(null)

    // Forms
    const [yearForm, setYearForm] = useState({ year_name: '', start_date: '', end_date: '' })
    const [semesterForm, setSemesterForm] = useState({ semester_type: '1', start_date: '', end_date: '' })

    useEffect(() => {
        fetchAcademicYears()
    }, [])

    const handleCreateYear = async (e) => {
        e.preventDefault()
        const { error } = await supabase.from('academic_years').insert([yearForm])
        if (error) {
            alert('Error creating year: ' + error.message)
        } else {
            setShowYearModal(false)
            setYearForm({ year_name: '', start_date: '', end_date: '' })
            fetchAcademicYears()
        }
    }

    const handleCreateSemester = async (e) => {
        e.preventDefault()
        if (!selectedYearId) return

        const { error } = await supabase.from('semesters').insert([{
            academic_year_id: selectedYearId,
            ...semesterForm
        }])

        if (error) {
            alert('Error creating semester: ' + error.message)
        } else {
            setShowSemesterModal(false)
            setSemesterForm({ semester_type: '1', start_date: '', end_date: '' })
            fetchAcademicYears()
        }
    }

    const handleDeleteYear = async (id) => {
        if (!confirm('ยืนยันลบปีการศึกษานี้? ข้อมูลภาคเรียนที่เกี่ยวข้องจะถูกลบด้วย')) return
        const { error } = await supabase.from('academic_years').delete().eq('id', id)
        if (error) alert('Error: ' + error.message)
        else fetchAcademicYears()
    }

    const handleDeleteSemester = async (id) => {
        if (!confirm('ยืนยันลบภาคเรียนนี้?')) return
        const { error } = await supabase.from('semesters').delete().eq('id', id)
        if (error) alert('Error: ' + error.message)
        else fetchAcademicYears()
    }

    const handleToggleActive = async (semesterId) => {
        // 1. Set all to false
        await supabase.from('semesters').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000') // Safety filter
        // 2. Set target to true
        const { error } = await supabase.from('semesters').update({ is_active: true }).eq('id', semesterId)

        if (error) alert('Error: ' + error.message)
        else fetchAcademicYears()
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft size={20} />
                        กลับสู่แดชบอร์ด
                    </button>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">จัดการปีการศึกษา</h1>
                            <p className="text-gray-600 mt-1">กำหนดปีการศึกษาและภาคเรียนสำหรับระบบ</p>
                        </div>
                        <button
                            onClick={() => setShowYearModal(true)}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
                        >
                            <Plus size={20} />
                            เพิ่มปีการศึกษา
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-12">Checking data...</div>
                ) : (
                    <div className="space-y-6">
                        {academicYears.map(year => (
                            <div key={year.id} className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <Calendar className="text-blue-600" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">ปีการศึกษา {year.year_name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(year.start_date).toLocaleDateString('th-TH')} - {new Date(year.end_date).toLocaleDateString('th-TH')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setSelectedYearId(year.id)
                                                setShowSemesterModal(true)
                                            }}
                                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            + เพิ่มภาคเรียน
                                        </button>
                                        <button
                                            onClick={() => handleDeleteYear(year.id)}
                                            className="text-gray-400 hover:text-red-600 ml-2"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {year.semesters && year.semesters.length > 0 ? (
                                        year.semesters.map(sem => (
                                            <div key={sem.id} className={`p-4 flex justify-between items-center hover:bg-gray-50 ${sem.is_active ? 'bg-green-50/50' : ''}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-12 rounded-full ${sem.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            ภาคเรียนที่ {sem.semester_type === 'summer' ? 'Summer' : sem.semester_type}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(sem.start_date).toLocaleDateString('th-TH')} - {new Date(sem.end_date).toLocaleDateString('th-TH')}
                                                        </p>
                                                    </div>
                                                    {sem.is_active && (
                                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                                            <CheckCircle size={12} /> Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {!sem.is_active && (
                                                        <button
                                                            onClick={() => handleToggleActive(sem.id)}
                                                            className="text-sm text-gray-500 hover:text-green-600 border border-gray-200 px-3 py-1 rounded hover:border-green-300 transition-colors"
                                                        >
                                                            ตั้งเป็นปัจจุบัน
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteSemester(sem.id)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-400">ยังไม่มีภาคเรียนในระบบ</div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {academicYears.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                                <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-500">เริ่มต้นด้วยการเพิ่มปีการศึกษาแรก</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal: Create Year */}
            {showYearModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">เพิ่มปีการศึกษาใหม่</h2>
                        <form onSubmit={handleCreateYear} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ปีการศึกษา (พ.ศ.)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="2568"
                                    className="w-full border rounded-lg p-2"
                                    value={yearForm.year_name}
                                    onChange={e => setYearForm({ ...yearForm, year_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่ม</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border rounded-lg p-2"
                                        value={yearForm.start_date}
                                        onChange={e => setYearForm({ ...yearForm, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border rounded-lg p-2"
                                        value={yearForm.end_date}
                                        onChange={e => setYearForm({ ...yearForm, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowYearModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Create Semester */}
            {showSemesterModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">เพิ่มภาคเรียน</h2>
                        <form onSubmit={handleCreateSemester} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ภาคเรียนที่</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={semesterForm.semester_type}
                                    onChange={e => setSemesterForm({ ...semesterForm, semester_type: e.target.value })}
                                >
                                    <option value="1">เทอม 1</option>
                                    <option value="2">เทอม 2</option>
                                    <option value="summer">Summer (ภาคฤดูร้อน)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่ม</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border rounded-lg p-2"
                                        value={semesterForm.start_date}
                                        onChange={e => setSemesterForm({ ...semesterForm, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border rounded-lg p-2"
                                        value={semesterForm.end_date}
                                        onChange={e => setSemesterForm({ ...semesterForm, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowSemesterModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
