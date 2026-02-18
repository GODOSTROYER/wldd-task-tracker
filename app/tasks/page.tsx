"use client";

import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/contexts/AuthContext";
import { api, getToken, type Task } from "@/lib/api";
import {
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Grid3x3,
  List,
  Loader2,
  Pencil,
  Plus,
  Rocket,
  Search,
  Trash2,
  Trello,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export default function TasksPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const token = getToken();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: "all" as "all" | "pending" | "completed",
    dateRange: {
      start: null as string | null,
      end: null as string | null,
    },
  });

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api<Task[]>("/api/tasks", { token });
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTasks();
  }, [token, router, fetchTasks]);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.description.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus =
      filters.status === "all" || task.status === filters.status;

    const matchesDateRange =
      (!filters.dateRange.start ||
        new Date(task.createdAt) >= new Date(filters.dateRange.start)) &&
      (!filters.dateRange.end ||
        new Date(task.createdAt) <= new Date(filters.dateRange.end));

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  // Create task
  const handleCreate = async () => {
    if (!token || !newTitle.trim()) return;

    const tempTask: Task = {
      _id: `temp-${Date.now()}`,
      title: newTitle,
      description: newDescription,
      status: "pending",
      dueDate: newDueDate || null,
      owner: "",
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [tempTask, ...prev]);
    setShowCreateDialog(false);
    setNewTitle("");
    setNewDescription("");
    setNewDueDate("");

    try {
      const created = await api<Task>("/api/tasks", {
        method: "POST",
        token,
        body: {
          title: tempTask.title,
          description: tempTask.description,
          dueDate: tempTask.dueDate,
        },
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === tempTask._id ? created : t))
      );
    } catch {
      setTasks((prev) => prev.filter((t) => t._id !== tempTask._id));
    }
  };

  // Toggle status
  const handleToggleStatus = async (task: Task) => {
    if (!token) return;
    const newStatus = task.status === "pending" ? "completed" : "pending";

    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
    );

    try {
      await api(`/api/tasks/${task._id}`, {
        method: "PUT",
        token,
        body: { status: newStatus },
      });
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, status: task.status } : t
        )
      );
    }
  };

  // Delete task
  const handleDelete = async (taskId: string) => {
    if (!token) return;
    const original = tasks.find((t) => t._id === taskId);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));

    try {
      await api(`/api/tasks/${taskId}`, { method: "DELETE", token });
    } catch {
      if (original) setTasks((prev) => [...prev, original]);
    }
  };

  // Start editing
  const startEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
  };

  // Submit edit
  const handleEdit = async () => {
    if (!token || !editingTask) return;

    const updates = {
      title: editTitle,
      description: editDescription,
      dueDate: editDueDate || null,
    };

    setTasks((prev) =>
      prev.map((t) => (t._id === editingTask._id ? { ...t, ...updates } : t))
    );
    setEditingTask(null);

    try {
      const updated = await api<Task>(`/api/tasks/${editingTask._id}`, {
        method: "PUT",
        token,
        body: updates,
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t._id === editingTask._id ? editingTask : t))
      );
    }
  };

  function clearFilters() {
    setFilters({
      search: "",
      status: "all",
      dateRange: { start: null, end: null },
    });
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Error loading tasks</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back,{" "}
            {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}! 👋
          </h1>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your tasks today.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Tasks
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {tasks.length}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trello className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Pending
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-600">
                    {pendingTasks.length}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Completed
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {completedTasks.length}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Due Soon
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">
                    {
                      tasks.filter((t) => {
                        if (!t.dueDate || t.status === "completed") return false;
                        const due = new Date(t.dueDate);
                        const threeDays = new Date();
                        threeDays.setDate(threeDays.getDate() + 3);
                        return due <= threeDays;
                      }).length
                    }
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  📊
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Your Tasks
              </h2>
              <p className="text-gray-600">Manage your tasks and track progress</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 rounded bg-white border p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
              >
                <Filter />
                Filter
              </Button>

              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus />
                Create Task
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search tasks..."
              className="pl-10"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading your tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                <Plus className="h-10 w-10 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No tasks yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first task to get started
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2" />
                  Create Task
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredTasks.map((task) => (
                <Card
                  key={task._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className="flex items-center"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors" />
                        )}
                      </button>
                      <Badge
                        className="text-xs"
                        variant={
                          task.status === "completed" ? "default" : "secondary"
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <CardTitle
                      className={`text-base sm:text-lg mb-2 group-hover:text-blue-600 transition-colors ${
                        task.status === "completed"
                          ? "line-through text-gray-400"
                          : ""
                      }`}
                    >
                      {task.title}
                    </CardTitle>
                    <CardDescription className="text-sm mb-4 line-clamp-2">
                      {task.description || "No description"}
                    </CardDescription>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
                      <span>
                        Created {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                      {task.dueDate && (
                        <span className="text-amber-600">
                          📅 Due{" "}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(task)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(task._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card
                className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer group"
                onClick={() => setShowCreateDialog(true)}
              >
                <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                  <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                  <p className="text-sm sm:text-base text-gray-600 group-hover:text-blue-600 font-medium">
                    Create new task
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card
                  key={task._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleToggleStatus(task)}>
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 hover:text-blue-500 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3
                            className={`font-semibold truncate ${
                              task.status === "completed"
                                ? "line-through text-gray-400"
                                : "text-gray-900"
                            }`}
                          >
                            {task.title}
                          </h3>
                          <Badge
                            className="text-xs flex-shrink-0"
                            variant={
                              task.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {task.description || "No description"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                        {task.dueDate && (
                          <span className="text-amber-600">
                            📅 {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span>
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(task)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(task._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <p className="text-sm text-gray-600">
              Add a new task to your list.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Task title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Task description..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newTitle.trim()}>
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      >
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <p className="text-sm text-gray-600">Update your task details.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Filter Tasks</DialogTitle>
            <p className="text-sm text-gray-600">
              Filter tasks by status, date, or search term.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search task titles..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                {(["all", "pending", "completed"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={filters.status === s ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, status: s }))
                    }
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          start: e.target.value || null,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          end: e.target.value || null,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between pt-4 space-y-2 sm:space-y-0 sm:space-x-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={() => setIsFilterOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
