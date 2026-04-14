using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public class TaskService : ITaskService
    {
        private readonly ITaskRepository _repository;

        public TaskService(ITaskRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<TaskItem>> GetAllTasksAsync()
        {
            return await _repository.GetAllTasksAsync();
        }

        public async Task<TaskItem?> GetTaskByIdAsync(int id)
        {
            return await _repository.GetTaskByIdAsync(id);
        }

        public async Task<TaskItem> CreateTaskAsync(TaskItem task)
        {
            return await _repository.AddTaskAsync(task);
        }

        public async Task UpdateTaskAsync(TaskItem task)
        {
            await _repository.UpdateTaskAsync(task);
        }

        public async Task DeleteTaskAsync(int id)
        {
            await _repository.DeleteTaskAsync(id);
        }

        public async Task<bool> TaskExistsAsync(int id)
        {
            return await _repository.TaskExistsAsync(id);
        }
    }
}
