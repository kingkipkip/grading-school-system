import { describe, it, expect } from 'vitest'
import {
    calculateGrade,
    calculateRegularAssignmentScore,
    calculateSpecialAssignmentScore,
    calculateWeightedScore
} from './gradeCalculations'

describe('Grade Calculations', () => {

    describe('calculateGrade (Grade Cutoffs)', () => {
        it('should return A for score >= 80', () => {
            expect(calculateGrade(80)).toEqual({ grade: 'A', gradePoint: 4.0 })
            expect(calculateGrade(100)).toEqual({ grade: 'A', gradePoint: 4.0 })
        })

        it('should return B+ for score >= 75 and < 80', () => {
            expect(calculateGrade(75)).toEqual({ grade: 'B+', gradePoint: 3.5 })
            expect(calculateGrade(79.9)).toEqual({ grade: 'B+', gradePoint: 3.5 })
        })

        it('should return B for score >= 70 and < 75', () => {
            expect(calculateGrade(70)).toEqual({ grade: 'B', gradePoint: 3.0 })
        })

        it('should return C+ for score >= 65 and < 70', () => {
            expect(calculateGrade(65)).toEqual({ grade: 'C+', gradePoint: 2.5 })
        })

        it('should return C for score >= 60 and < 65', () => {
            expect(calculateGrade(60)).toEqual({ grade: 'C', gradePoint: 2.0 })
        })

        it('should return D+ for score >= 55 and < 60', () => {
            expect(calculateGrade(55)).toEqual({ grade: 'D+', gradePoint: 1.5 })
        })

        it('should return D for score >= 50 and < 55', () => {
            expect(calculateGrade(50)).toEqual({ grade: 'D', gradePoint: 1.0 })
        })

        it('should return F for score < 50', () => {
            expect(calculateGrade(49.9)).toEqual({ grade: 'F', gradePoint: 0 })
            expect(calculateGrade(0)).toEqual({ grade: 'F', gradePoint: 0 })
        })
    })

    describe('calculateRegularAssignmentScore (Core Logic)', () => {
        // Scenario: Total Assignment Score = 50
        // Special Assignments Max Score Sum = 10
        // Regular Pool = 50 - 10 = 40
        // Total Regular Assignments = 4 (Each worth 10 pts)
        const regularPool = 40

        it('should calculate score correctly for mixed submissions', () => {
            const submissions = [
                { submission_status: 'submitted' }, // 10 pts
                { submission_status: 'submitted' }, // 10 pts
                { submission_status: 'late' },      // 8 pts (80%)
                { submission_status: 'missing' }    // 0 pts
            ]

            // Expected: 10 + 10 + 8 + 0 = 28
            const result = calculateRegularAssignmentScore(submissions, regularPool)
            expect(result).toBe(28)
        })

        it('should return 0 if no assignments exist (division by zero protection)', () => {
            const result = calculateRegularAssignmentScore([], regularPool)
            expect(result).toBe(0)
        })

        it('should calculate fully submitted score correctly', () => {
            const submissions = [
                { submission_status: 'submitted' },
                { submission_status: 'submitted' },
                { submission_status: 'submitted' },
                { submission_status: 'submitted' }
            ] // 4 * 10 = 40
            const result = calculateRegularAssignmentScore(submissions, regularPool)
            expect(result).toBe(40)
        })
    })

    describe('calculateSpecialAssignmentScore', () => {
        const specialAssignments = [
            { id: 'sa1', max_score: 5 },
            { id: 'sa2', max_score: 5 }
        ]

        it('should sum raw scores correctly', () => {
            const submissions = [
                { assignment_id: 'sa1', score: 5 },
                { assignment_id: 'sa2', score: 3.5 }
            ]
            // Expected: 5 + 3.5 = 8.5
            const result = calculateSpecialAssignmentScore(specialAssignments, submissions)
            expect(result).toBe(8.5)
        })

        it('should handle missing scores as 0', () => {
            const submissions = [
                { assignment_id: 'sa1', score: 5 }
                // sa2 missing
            ]
            const result = calculateSpecialAssignmentScore(specialAssignments, submissions)
            expect(result).toBe(5)
        })
    })

    describe('calculateWeightedScore (Export Logic)', () => {
        // Scenario: Total Assignment Score = 50. Student got 40.
        // Weight = 20 (Before Midterm)
        it('should calculate weighted score correctly', () => {
            // (40 / 50) * 20 = 0.8 * 20 = 16
            const result = calculateWeightedScore(40, 50, 20)
            expect(result).toBe(16)
        })

        it('should handle decimal results with rounding', () => {
            // (35 / 50) * 20 = 0.7 * 20 = 14
            // (33 / 50) * 20 = 0.66 * 20 = 13.2
            const result = calculateWeightedScore(33, 50, 20)
            expect(result).toBe(13.2)
        })
    })

})
