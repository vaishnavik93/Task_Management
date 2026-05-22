using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class ProjectMember
    {
        public int ProjectId { get; set; }
        
        [JsonIgnore]
        public Project Project { get; set; }

        public int UserId { get; set; }
        
        [JsonIgnore]
        public User User { get; set; }
    }
}
