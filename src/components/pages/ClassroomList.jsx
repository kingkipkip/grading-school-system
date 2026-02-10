import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Users, Trash2, Edit2, Search } from 'lucide-react'

export default function ClassroomList() {
    const [classrooms, setClassrooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', academic_year: '' })
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        fetchClassrooms()
    }, [])

    const fetchClassrooms = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('classrooms')
            .select('*')
            .order('name', { ascending: true })
        if (data) setClassrooms(data)
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (editingId) {
            const { error } = await supabase.from('classrooms').update(formData).eq('id', editingId)
            if (error) alert(error.message)
        } else {
            const { error } = await supabase.from('classrooms').insert([formData])
            if (error) alert(error.message)
        }

        setShowModal(false)
        setFormData({ name: '', academic_year: '' })
        setEditingId(null)
        fetchClassrooms()
    }

    const handleDelete = async (id) => {
        if (!confirm('ยืนยันลบห้องเรียนนี้? ข้อมูลนักเรียนในห้องจะถูก reset')) return
        await supabase.from('classrooms').delete().eq('id', id)
        fetchClassrooms()
    }

    const openEdit = (cls) => {
        setFormData({ name: cls.name, academic_year: cls.academic_year })
        setEditingId(cls.id)
        setShowModal(true)
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการห้องเรียน</h1>
                    <p className="text-gray-500">รายชื่อห้องเรียนทั้งหมดในระบบ</p>
                </div>
                <button
                    onClick={() => { setFormData({ name: '', academic_year: '' }); setEditingId(null); setShowModal(true) }}
                    className="ios-btn bg-[#007AFF] text-white hover:bg-[#0062cc]"
                >
                    <Plus size={20} /> เพิ่มห้องเรียน
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classrooms.map(cls => (
                    <div key={cls.id} className="ios-card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900">{cls.name}</h3>
                                    <p className="text-sm text-gray-500">ปีการศึกษา {cls.academic_year}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                            <button
                                onClick={() => openEdit(cls)}
                                className="text-gray-500 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(cls.id)}
                                className="text-gray-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {classrooms.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed rounded-xl">
                        ยังไม่มีข้อมูลห้องเรียน
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-in shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียนใหม่'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">ชื่อห้องเรียน (เช่น ม.1/1)</label>
                                <input
                                    type="text"
                                    className="ios-input"
                                    placeholder="ม.1/1"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">ปีการศึกษา (ตัวอย่าง 2567)</label>
                                <input
                                    type="text"
                                    className="ios-input"
                                    placeholder="2567"
                                    required
                                    value={formData.academic_year}
                                    onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#007AFF] text-white rounded-lg font-medium hover:bg-[#0062cc] shadow-sm"
                                >
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
