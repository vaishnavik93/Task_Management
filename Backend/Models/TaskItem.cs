using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class TaskItem
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; }

        public string Description { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Todo"; // "Todo", "In Progress", "Completed"

        public DateTime DueDate { get; set; }

        public int ProjectId { get; set; }
        
        [JsonIgnore]
        public Project Project { get; set; }

        public int? AssignedToUserId { get; set; }
        
        [JsonIgnore]
        public User AssignedToUser { get; set; }

        public bool IsCompleted => Status == "Completed";
    }
}
