using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class Project
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(500)]
        public string Description { get; set; }

        public int CreatedByUserId { get; set; }
        
        [JsonIgnore]
        public User CreatedByUser { get; set; }

        [JsonIgnore]
        public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();

        [JsonIgnore]
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}
