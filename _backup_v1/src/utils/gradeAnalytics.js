import { calculateGrade } from './gradeCalculations'

/**
 * Process student grades for distribution charts
 * @param {Array} studentGrades - Array of student grade objects
 * @returns {Array} Data for Recharts [{ name: 'A', count: 5 }, ...]
 */
export function getGradeDistribution(studentGrades) {
    const distribution = {
        'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
    }

    studentGrades.forEach(student => {
        // Assuming student object has a total_score or similar property
        // If we only possess raw scores, we might need to sum them first
        // Since we usually have a view or calculated field, let's assume we have the total score
        const totalScore = parseFloat(student.grand_total || student.total_score || 0)
        const { grade } = calculateGrade(totalScore)
        if (Object.prototype.hasOwnProperty.call(distribution, grade)) {
            distribution[grade]++
        }
    })

    // Convert to array format for Recharts
    return Object.keys(distribution).map(grade => ({
        name: grade,
        count: distribution[grade]
    }))
}

/**
 * Calculate basic statistics (Mean, Median, Max, Min)
 * @param {Array} scores - Array of numbers
 * @returns {Object} { mean, median, max, min, sd }
 */
export function calculateStatistics(scores) {
    if (!scores || scores.length === 0) return { mean: 0, median: 0, max: 0, min: 0 }

    const sorted = [...scores].sort((a, b) => a - b)
    const n = sorted.length
    const sum = sorted.reduce((a, b) => a + b, 0)

    // Mean
    const mean = sum / n

    // Median
    const median = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)]

    // Standard Deviation
    const variance = sorted.reduce((t, n) => t + Math.pow(n - mean, 2), 0) / n
    const sd = Math.sqrt(variance)

    return {
        mean: parseFloat(mean.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        max: sorted[n - 1],
        min: sorted[0],
        sd: parseFloat(sd.toFixed(2)),
        count: n
    }
}
