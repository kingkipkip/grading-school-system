import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getGradeDistribution, calculateStatistics } from '../../utils/gradeAnalytics'

export default function GradeAnalytics({ students }) {
    if (!students || students.length === 0) return null

    // Process data for charts
    const distributionData = useMemo(() => {
        return getGradeDistribution(students)
    }, [students])

    // Calculate generic stats
    const stats = useMemo(() => {
        const scores = students.map(s => parseFloat(s.grand_total || s.total_score || 0))
        return calculateStatistics(scores)
    }, [students])

    // Custom colors for grades
    const getBarColor = (grade) => {
        if (grade === 'A' || grade === 'B+') return '#22c55e' // Green
        if (grade === 'B' || grade === 'C+') return '#3b82f6' // Blue
        if (grade === 'C' || grade === 'D+') return '#f59e0b' // Orange
        return '#ef4444' // Red
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">คะแนนเฉลี่ย (Mean)</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.mean}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">มัธยฐาน (Median)</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.median}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">สูงสุด (Max)</p>
                    <p className="text-2xl font-bold text-green-600">{stats.max}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">ต่ำสุด (Min)</p>
                    <p className="text-2xl font-bold text-red-600">{stats.min}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">การกระจายเกรด</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distributionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {distributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
