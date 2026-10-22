/**
 * Team-based filtering utility
 * Filters employees/data based on reporting manager relationship
 */
import { HR_ROLES } from '../config/navigation'

/**
 * HR, admin, super admin, CEO and manager see the whole organisation (the backend already lets them
 * act on anyone's requests). Only a plain employee who happens to be someone's reporting manager is
 * limited to their own team.
 */
export const hasFullAccess = (currentUser) => HR_ROLES.includes(currentUser?.role)

/**
 * Get team members for a reporting manager
 * @param {Array} allEmployees - All employees from API
 * @param {Object} currentUser - Current logged-in user
 * @returns {Array} - Filtered team members or all employees if admin/HR
 */
export const getTeamMembers = (allEmployees, currentUser) => {
  const employeesList = Array.isArray(allEmployees)
    ? allEmployees
    : Array.isArray(allEmployees?.data)
    ? allEmployees.data
    : Array.isArray(allEmployees?.employees)
    ? allEmployees.employees
    : []

  if (!currentUser || !employeesList.length) return []
  
  const isReportingManager = currentUser.is_reporting_manager === 1

  // HR / admin / super admin / CEO / manager see all employees
  if (hasFullAccess(currentUser)) {
    return employeesList
  }
  
  // Reporting managers see only their team members
  if (isReportingManager) {
    return employeesList.filter(emp => 
      emp.reporting_manager_id === currentUser.emp_id
    )
  }
  
  // Regular employees see only themselves
  return employeesList.filter(emp => emp.emp_id === currentUser.emp_id)
}

/**
 * Get team member IDs for filtering API requests
 * @param {Array} allEmployees - All employees from API
 * @param {Object} currentUser - Current logged-in user
 * @returns {Array} - Array of employee IDs
 */
export const getTeamMemberIds = (allEmployees, currentUser) => {
  const teamMembers = getTeamMembers(allEmployees, currentUser)
  return teamMembers.map(emp => emp.emp_id)
}

/**
 * Check if user can manage team data (approve/reject requests, etc.)
 * @param {Object} currentUser - Current logged-in user
 * @returns {Boolean}
 */
export const canManageTeam = (currentUser) => {
  if (!currentUser) return false
  return hasFullAccess(currentUser) || currentUser.is_reporting_manager === 1
}

/**
 * Filter requests/records by team members
 * @param {Array} records - Records to filter (leave requests, WFH, attendance, etc.)
 * @param {Array} teamMemberIds - Team member employee IDs
 * @returns {Array} - Filtered records
 */
export const filterByTeam = (records, teamMemberIds) => {
  const recordList = Array.isArray(records) ? records : Array.isArray(records?.data) ? records.data : []
  if (!recordList.length || !Array.isArray(teamMemberIds)) return []
  return recordList.filter(record => teamMemberIds.includes(record.employee_id))
}
