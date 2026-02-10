import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, CheckCircle, Calendar, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AcademicYearManagement() {
    const navigate = useNavigate()
    const [years, setYears] = useState([])
    const [loading, setLoading] = useState(true)
    const [showYearModal, setShowYearModal] = useState(false)
    const [yearForm, setYearForm] = useState({ year_name: '', start_date: '', end_date: '' })

    // Expanded logic: Manage semseters inside years too
    const [selectedYear, setSelectedYear] = useState(null)
    const [showSemesterModal, setShowSemesterModal] = useState(false)
    const [semesterForm, setSemesterForm] = useState({ semester_type: '1', start_date: '', end_date: '' })

    useEffect(() => {
        fetchYears()
    }, [])

    const fetchYears = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('academic_years')
            .select(`
                *,
                semesters (
                    *
                )
            `)
            .order('year_name', { ascending: false })

        if (data) {
            // Sort semesters within years
            const sorted = data.map(y => ({
                ...y,
                semesters: y.semesters.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
            }))
            setYears(sorted)
        }
        setLoading(false)
    }

    const handleCreateYear = async (e) => {
        e.preventDefault()
        const { error } = await supabase.from('academic_years').insert([yearForm])
        if (error) alert(error.message)
        else {
            setShowYearModal(false)
            setYearForm({ year_name: '', start_date: '', end_date: '' })
            fetchYears()
        }
    }

    const handleCreateSemester = async (e) => {
        e.preventDefault()
        const { error } = await supabase.from('semesters').insert([{
            ...semesterForm,
            academic_year_id: selectedYear.id
        }])
        if (error) alert(error.message)
        else {
            setShowSemesterModal(false)
            setSemesterForm({ semester_type: '1', start_date: '', end_date: '' })
            fetchYears()
        }
    }

    const handleDeleteYear = async (id) => {
        if (!confirm('Delete this academic year?')) return
        await supabase.from('academic_years').delete().eq('id', id)
        fetchYears()
    }

    const handleDeleteSemester = async (id) => {
        if (!confirm('Delete this semester?')) return
        await supabase.from('semesters').delete().eq('id', id)
        fetchYears()
    }

    const toggleActiveSemester = async (id) => {
        // Reset all to false
        await supabase.from('semesters').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
        // Set target to true
        await supabase.from('semesters').update({ is_active: true }).eq('id', id)
        fetchYears()
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการปีการศึกษา</h1>
                    <p className="text-gray-500">กำหนดปีการศึกษาและภาคเรียนสำหรับทั้งโรงเรียน</p>
                </div>
                <button
                    onClick={() => setShowYearModal(true)}
                    className="ios-btn bg-[#007AFF] text-white hover:bg-[#0062cc]"
                >
                    <Plus size={20} /> เพิ่มปีการศึกษา
                </button>
            </div>

            <div className="space-y-6">
                {years.map(year => (
                    <div key={year.id} className="ios-card overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">ปีการศึกษา {year.year_name}</h3>
                                    <p className="text-xs text-gray-500">
                                        {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setSelectedYear(year); setShowSemesterModal(true) }}
                                    className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
                                >
                                    + เพิ่มเทอม
                                </button>
                                <button onClick={() => handleDeleteYear(year.id)} className="text-gray-400 hover:text-red-500 p-1">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="divide-y">
                            {year.semesters.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">ยังไม่มีข้อมูลภาคเรียน</div>
                            ) : (
                                year.semesters.map(sem => (
                                    <div key={sem.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 ${sem.is_active ? 'bg-green-50/50' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-10 rounded-full ${sem.is_active ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                            <div>
                                                <p className="font-medium">
                                                    ภาคเรียนที่ {sem.semester_type === 'summer' ? 'Summer' : sem.semester_type}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(sem.start_date).toLocaleDateString()} - {new Date(sem.end_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {sem.is_active && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Active</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!sem.is_active && (
                                                <button
                                                    onClick={() => toggleActiveSemester(sem.id)}
                                                    className="text-xs border px-2 py-1 rounded hover:bg-gray-100"
                                                >
                                                    Set Active
                                                </button>
                                            )}
                                            <button onClick={() => handleDeleteSemester(sem.id)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Year Modal */}
            {showYearModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">เพิ่มปีการศึกษา</h2>
                        <form onSubmit={handleCreateYear} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">ปี พ.ศ.</label>
                                <input type="text" className="ios-input" placeholder="2567" required
                                    value={yearForm.year_name} onChange={e => setYearForm({ ...yearForm, year_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">เริ่ม</label>
                                    <input type="date" className="ios-input" required
                                        value={yearForm.start_date} onChange={e => setYearForm({ ...yearForm, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">สิ้นสุด</label>
                                    <input type="date" className="ios-input" required
                                        value={yearForm.end_date} onChange={e => setYearForm({ ...yearForm, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowYearModal(false)} className="px-4 py-2 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Semester Modal */}
            {showSemesterModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">เพิ่มภาคเรียน ({selectedYear?.year_name})</h2>
                        <form onSubmit={handleCreateSemester} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">ภาคเรียน</label>
                                <select className="ios-input" required
                                    value={semesterForm.semester_type} onChange={e => setSemesterForm({ ...semesterForm, semester_type: e.target.value })}
                                >
                                    <option value="1">เทอม 1</option>
                                    <option value="2">เทอม 2</option>
                                    <option value="summer">Summer</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">เริ่ม</label>
                                    <input type="date" className="ios-input" required
                                        value={semesterForm.start_date} onChange={e => setSemesterForm({ ...semesterForm, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">สิ้นสุด</label>
                                    <input type="date" className="ios-input" required
                                        value={semesterForm.end_date} onChange={e => setSemesterForm({ ...semesterForm, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowSemesterModal(false)} className="px-4 py-2 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
