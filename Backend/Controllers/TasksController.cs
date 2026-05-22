using System.Security.Claims;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly TaskContext _context;

        public TasksController(TaskContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : 0;
        }

        private string GetCurrentUserRole()
        {
            var claim = User.FindFirst(ClaimTypes.Role);
            return claim != null ? claim.Value : "Member";
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks([FromQuery] int? projectId)
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            IQueryable<TaskItem> query = _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.AssignedToUser);

            if (role != "Admin")
            {
                // Members see tasks assigned to them, or tasks in projects they belong to
                var userProjectIds = await _context.ProjectMembers
                    .Where(pm => pm.UserId == userId)
                    .Select(pm => pm.ProjectId)
                    .ToListAsync();

                query = query.Where(t => t.AssignedToUserId == userId || userProjectIds.Contains(t.ProjectId));
            }

            if (projectId.HasValue)
            {
                query = query.Where(t => t.ProjectId == projectId.Value);
            }

            var tasks = await query.ToListAsync();
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskItem>> GetTask(int id)
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            var task = await _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.AssignedToUser)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
            {
                return NotFound();
            }

            if (role != "Admin")
            {
                var isMemberOfProject = await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == task.ProjectId && pm.UserId == userId);
                if (task.AssignedToUserId != userId && !isMemberOfProject)
                {
                    return Forbid();
                }
            }

            return Ok(task);
        }

        [HttpPost]
        public async Task<ActionResult<TaskItem>> PostTask([FromBody] TaskCreateDto dto)
        {
            var role = GetCurrentUserRole();
            if (role != "Admin")
            {
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Verify project exists
            var projectExists = await _context.Projects.AnyAsync(p => p.Id == dto.ProjectId);
            if (!projectExists)
            {
                return BadRequest(new { message = "Project not found." });
            }

            // Verify assigned user is a member of the project (if specified)
            if (dto.AssignedToUserId.HasValue)
            {
                var userExists = await _context.Users.AnyAsync(u => u.Id == dto.AssignedToUserId.Value);
                if (!userExists)
                {
                    return BadRequest(new { message = "Assigned user not found." });
                }

                var isMember = await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == dto.ProjectId && pm.UserId == dto.AssignedToUserId.Value);
                if (!isMember)
                {
                    // Auto-assign member to project if they are assigned a task in it
                    var projectMember = new ProjectMember
                    {
                        ProjectId = dto.ProjectId,
                        UserId = dto.AssignedToUserId.Value
                    };
                    _context.ProjectMembers.Add(projectMember);
                    await _context.SaveChangesAsync();
                }
            }

            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                Status = dto.Status ?? "Todo",
                DueDate = dto.DueDate,
                ProjectId = dto.ProjectId,
                AssignedToUserId = dto.AssignedToUserId
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // Load relations for return
            var createdTask = await _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.AssignedToUser)
                .FirstAsync(t => t.Id == task.Id);

            return CreatedAtAction(nameof(GetTask), new { id = createdTask.Id }, createdTask);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTask(int id, [FromBody] TaskUpdateDto dto)
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            var existingTask = await _context.Tasks.FindAsync(id);
            if (existingTask == null)
            {
                return NotFound();
            }

            if (role == "Admin")
            {
                // Admin can update everything
                existingTask.Title = dto.Title ?? existingTask.Title;
                existingTask.Description = dto.Description ?? existingTask.Description;
                existingTask.Status = dto.Status ?? existingTask.Status;
                existingTask.DueDate = dto.DueDate ?? existingTask.DueDate;
                
                if (dto.ProjectId.HasValue)
                {
                    var projectExists = await _context.Projects.AnyAsync(p => p.Id == dto.ProjectId.Value);
                    if (!projectExists)
                    {
                        return BadRequest(new { message = "Project not found." });
                    }
                    existingTask.ProjectId = dto.ProjectId.Value;
                }

                if (dto.AssignedToUserId.HasValue)
                {
                    var userExists = await _context.Users.AnyAsync(u => u.Id == dto.AssignedToUserId.Value);
                    if (!userExists)
                    {
                        return BadRequest(new { message = "Assigned user not found." });
                    }
                    existingTask.AssignedToUserId = dto.AssignedToUserId.Value;

                    // Ensure assigned user is a member of the project
                    var isMember = await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == existingTask.ProjectId && pm.UserId == dto.AssignedToUserId.Value);
                    if (!isMember)
                    {
                        var projectMember = new ProjectMember
                        {
                            ProjectId = existingTask.ProjectId,
                            UserId = dto.AssignedToUserId.Value
                        };
                        _context.ProjectMembers.Add(projectMember);
                    }
                }
                else if (dto.AssignedToUserId == null && dto.ClearAssignment == true)
                {
                    existingTask.AssignedToUserId = null;
                }
            }
            else
            {
                // Member can only update the Status field of their assigned tasks or tasks in their projects
                var isMemberOfProject = await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == existingTask.ProjectId && pm.UserId == userId);
                if (existingTask.AssignedToUserId != userId && !isMemberOfProject)
                {
                    return Forbid();
                }

                // Verify status is valid
                if (dto.Status != "Todo" && dto.Status != "In Progress" && dto.Status != "Completed")
                {
                    return BadRequest(new { message = "Invalid status value. Must be 'Todo', 'In Progress', or 'Completed'." });
                }

                existingTask.Status = dto.Status;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await TaskExistsAsync(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var role = GetCurrentUserRole();
            if (role != "Admin")
            {
                return Forbid();
            }

            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound();
            }

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> TaskExistsAsync(int id)
        {
            return await _context.Tasks.AnyAsync(e => e.Id == id);
        }
    }

    public class TaskCreateDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Status { get; set; } // "Todo", "In Progress", "Completed"
        public DateTime DueDate { get; set; }
        public int ProjectId { get; set; }
        public int? AssignedToUserId { get; set; }
    }

    public class TaskUpdateDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public DateTime? DueDate { get; set; }
        public int? ProjectId { get; set; }
        public int? AssignedToUserId { get; set; }
        public bool? ClearAssignment { get; set; }
    }
}
