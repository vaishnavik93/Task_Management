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
    public class ProjectsController : ControllerBase
    {
        private readonly TaskContext _context;

        public ProjectsController(TaskContext context)
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
        public async Task<IActionResult> GetProjects()
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            IQueryable<Project> query = _context.Projects
                .Include(p => p.CreatedByUser);

            if (role != "Admin")
            {
                // Members only see projects where they are added as a member or which they created
                query = query.Where(p => 
                    p.CreatedByUserId == userId || 
                    _context.ProjectMembers.Any(pm => pm.ProjectId == p.Id && pm.UserId == userId)
                );
            }

            var projects = await query.ToListAsync();
            return Ok(projects);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            var project = await _context.Projects
                .Include(p => p.CreatedByUser)
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound();

            if (role != "Admin")
            {
                var isMember = await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == id && pm.UserId == userId);
                if (project.CreatedByUserId != userId && !isMember)
                {
                    return Forbid();
                }
            }

            return Ok(project);
        }

        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] ProjectDto dto)
        {
            var role = GetCurrentUserRole();
            if (role != "Admin")
                return Forbid();

            var project = new Project
            {
                Name = dto.Name,
                Description = dto.Description,
                CreatedByUserId = GetCurrentUserId()
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Auto add the creator as a member of the project
            var pm = new ProjectMember
            {
                ProjectId = project.Id,
                UserId = project.CreatedByUserId
            };
            _context.ProjectMembers.Add(pm);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var role = GetCurrentUserRole();
            if (role != "Admin")
                return Forbid();

            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return NotFound();

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/members")]
        public async Task<IActionResult> GetProjectMembers(int id)
        {
            var projectExists = await _context.Projects.AnyAsync(p => p.Id == id);
            if (!projectExists)
                return NotFound();

            var members = await _context.ProjectMembers
                .Where(pm => pm.ProjectId == id)
                .Include(pm => pm.User)
                .Select(pm => new
                {
                    pm.UserId,
                    pm.User.Username,
                    pm.User.Email,
                    pm.User.Role
                })
                .ToListAsync();

            return Ok(members);
        }

        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddProjectMember(int id, [FromBody] AddMemberDto dto)
        {
            var role = GetCurrentUserRole();
            if (role != "Admin")
                return Forbid();

            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return NotFound();

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return BadRequest(new { message = "User not found." });

            var exists = await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == id && pm.UserId == dto.UserId);
            if (exists)
                return BadRequest(new { message = "User is already a member of this project." });

            var projectMember = new ProjectMember
            {
                ProjectId = id,
                UserId = dto.UserId
            };

            _context.ProjectMembers.Add(projectMember);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Member added successfully." });
        }

        [HttpDelete("{id}/members/{userId}")]
        public async Task<IActionResult> RemoveProjectMember(int id, int userId)
        {
            var role = GetCurrentUserRole();
            if (role != "Admin")
                return Forbid();

            var member = await _context.ProjectMembers.FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId);
            if (member == null)
                return NotFound();

            _context.ProjectMembers.Remove(member);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class ProjectDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class AddMemberDto
    {
        public int UserId { get; set; }
    }
}
