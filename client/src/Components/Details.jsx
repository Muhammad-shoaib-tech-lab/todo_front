import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Details({ user }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    title: "",
    location: "",
    assignTo: "",
    tag: "",
    category: "",
    priority: "",
    status: "all", 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const todosPerPage = 4;

  const navigate = useNavigate();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); 
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  // Fetch todos from backend with JWT token
  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/todos/${user.email}`, getAuthHeaders());
      setTodos(res.data);
    } catch (e) {
      console.error('Error loading todos:', e.response || e);
      
      if (e.response?.status === 401) {
        alert("Authentication failed. Please login again.Logout to login");
        // Optionally redirect to login page
        // navigate('/login');
      } else if (e.response?.status === 403) {
        alert("Access denied. You don't have permission to view these todos.");
      } else {
        alert(`Error loading todos: ${e.response?.data?.message || e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // Delete a single todo with JWT token
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete?")) return;
    setDeleteLoadingId(id);
    try {
      await axios.delete(`http://localhost:5000/api/todos/${id}`, getAuthHeaders());
      
      // Update todos and selected IDs
      const updatedTodos = todos.filter((t) => t._id !== id);
      setTodos(updatedTodos);
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      
      // Apply filters to get filtered count
      const filteredCount = updatedTodos.filter((todo) => {
        const matchesStatus =
          filters.status === "all" ||
          (filters.status === "complete" && todo.complete) ||
          (filters.status === "pending" && !todo.complete);

        return (
          todo.title.toLowerCase().includes(filters.title.toLowerCase()) &&
          todo.location.toLowerCase().includes(filters.location.toLowerCase()) &&
          todo.assignTo.toLowerCase().includes(filters.assignTo.toLowerCase()) &&
          todo.tag.toLowerCase().includes(filters.tag.toLowerCase()) &&
          todo.category.toLowerCase().includes(filters.category.toLowerCase()) &&
          todo.priority.toLowerCase().includes(filters.priority.toLowerCase()) &&
          matchesStatus
        );
      }).length;
      
      // Calculate new total pages
      const newTotalPages = Math.ceil(filteredCount / todosPerPage);
      
      // If current page is greater than total pages, go to last page
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (newTotalPages === 0) {
        setCurrentPage(1);
      }
    } catch (e) {
      console.error('Delete failed:', e.response || e);
      alert(`Delete failed: ${e.response?.data?.message || e.message}`);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Bulk delete selected todos with JWT token
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert("No todos selected");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} todos?`))
      return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => axios.delete(`http://localhost:5000/api/todos/${id}`, getAuthHeaders())));
      setTodos((prev) => prev.filter((t) => !selectedIds.includes(t._id)));
      setSelectedIds([]);
    } catch (e) {
      console.error('Bulk delete failed:', e.response || e);
      alert(`Bulk delete failed: ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle select/deselect a todo checkbox for multiple delete
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Toggle select/deselect all visible todos
  const toggleSelectAll = () => {
    const currentPageIds = currentTodos.map((t) => t._id);
    const allSelected = currentPageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  // Toggle completion status for a todo with JWT token
  const toggleComplete = async (todo) => {
    try {
      // Optimistic update
      setTodos((prev) =>
        prev.map((t) => (t._id === todo._id ? { ...t, complete: !t.complete } : t))
      );
      await axios.put(`http://localhost:5000/api/todos/${todo._id}`, {
        ...todo,
        complete: !todo.complete,
      }, getAuthHeaders());
    } catch (e) {
      console.error('Failed to update todo status:', e.response || e);
      alert(`Failed to update todo status: ${e.response?.data?.message || e.message}`);
      fetchTodos(); // Revert optimistic update
    }
  };

  // Handle filter input changes
  const handleFilterChange = (e) => {
    setCurrentPage(1); // Reset page
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  // Filter todos based on filters including status
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "complete" && todo.complete) ||
        (filters.status === "pending" && !todo.complete);

      return (
        todo.title.toLowerCase().includes(filters.title.toLowerCase()) &&
        todo.location.toLowerCase().includes(filters.location.toLowerCase()) &&
        todo.assignTo.toLowerCase().includes(filters.assignTo.toLowerCase()) &&
        todo.tag.toLowerCase().includes(filters.tag.toLowerCase()) &&
        todo.category.toLowerCase().includes(filters.category.toLowerCase()) &&
        todo.priority.toLowerCase().includes(filters.priority.toLowerCase()) &&
        matchesStatus
      );
    });
  }, [todos, filters]);

  // Pagination
  const indexOfLastTodo = currentPage * todosPerPage;
  const indexOfFirstTodo = indexOfLastTodo - todosPerPage;
  const currentTodos = filteredTodos.slice(indexOfFirstTodo, indexOfLastTodo);
  const totalPages = Math.ceil(filteredTodos.length / todosPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "2rem auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#333",
        padding: "1rem",
        backgroundColor: "#fafafa",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ marginBottom: 10 }}>
        Hello, <span style={{ color: "#007bff" }}>{user.email}</span>
      </h2>
      <h3
        style={{
          marginBottom: 20,
          borderBottom: "2px solid #007bff",
          paddingBottom: 6,
        }}
      >
        Your Todos
      </h3>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.8rem",
          marginBottom: "1rem",
          backgroundColor: "white",
          padding: "10px",
          borderRadius: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {[
          { name: "title", placeholder: "Filter by Title" },
          { name: "location", placeholder: "Filter by Location" },
          { name: "assignTo", placeholder: "Filter by Assign To" },
          { name: "tag", placeholder: "Filter by Tag" },
          { name: "category", placeholder: "Filter by Category" },
          { name: "priority", placeholder: "Filter by Priority" },
        ].map(({ name, placeholder }) => (
          <input
            key={name}
            type="text"
            name={name}
            value={filters[name]}
            onChange={handleFilterChange}
            placeholder={placeholder}
            style={{
              flex: "1 1 150px",
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              fontSize: 14,
            }}
          />
        ))}

        {/* Status filter dropdown */}
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          style={{
            flex: "1 1 150px",
            padding: "8px 12px",
            borderRadius: 4,
            border: "1px solid #ccc",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="complete">Completed</option>
        </select>
      </div>

      {/* Bulk delete button */}
      <div style={{ marginBottom: "0.5rem" }}>
        <button
          onClick={handleBulkDelete}
          disabled={selectedIds.length === 0 || loading}
          style={{
            backgroundColor: selectedIds.length === 0 ? "#ccc" : "#dc3545",
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: 4,
            fontWeight: "600",
            cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Delete Selected ({selectedIds.length})
        </button>
      </div>

      {/* Scrollable Table */}
      <div
        style={{
          maxHeight: 400,
          overflowY: "auto",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          backgroundColor: "white",
        }}
      >
        {loading ? (
          <p style={{ fontSize: 18, textAlign: "center", padding: "2rem" }}>
            Loading todos...
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 900,
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  textAlign: "left",
                  userSelect: "none",
                }}
              >
                <th
                  style={{
                    padding: "12px 15px",
                    textAlign: "center",
                    width: 35,
                  }}
                >
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={
                      currentTodos.length > 0 &&
                      currentTodos.every((todo) => selectedIds.includes(todo._id))
                    }
                    aria-label="Select all todos on current page"
                  />
                </th>
                <th
                  style={{
                    padding: "12px 15px",
                    textAlign: "center",
                    width: 65,
                  }}
                >
                  Complete
                </th>
                <th style={{ padding: "12px 15px", width: "12%" }}>Title</th>
                <th style={{ padding: "12px 15px", width: "20%" }}>Description</th>
                <th style={{ padding: "12px 15px", width: "10%" }}>Due Date</th>
                <th style={{ padding: "12px 15px", width: "8%" }}>Priority</th>
                <th style={{ padding: "12px 15px", width: "8%" }}>Category</th>
                <th style={{ padding: "12px 15px", width: "10%" }}>Location</th>
                <th style={{ padding: "12px 15px", width: "10%" }}>Reminder</th>
                <th style={{ padding: "12px 15px", width: "8%" }}>Tag</th>
                <th style={{ padding: "12px 15px", width: "10%" }}>Assign To</th>
                <th
                  style={{
                    padding: "12px 15px",
                    textAlign: "center",
                    minWidth: 130,
                    width: "10%",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTodos.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    style={{
                      padding: 20,
                      textAlign: "center",
                      fontStyle: "italic",
                      color: "#555",
                    }}
                  >
                    No todos found.
                  </td>
                </tr>
              ) : (
                currentTodos.map((todo, index) => {
                  const isSelected = selectedIds.includes(todo._id);
                  const isComplete = !!todo.complete;

                  return (
                    <tr
                      key={todo._id}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                        borderBottom: "1px solid #ddd",
                        userSelect: "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 15px",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(todo._id)}
                          aria-label={`Select todo titled ${todo.title}`}
                        />
                      </td>

                      <td
                        style={{
                          padding: "10px 15px",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isComplete}
                          onChange={() => toggleComplete(todo)}
                          aria-label={`Mark todo titled ${todo.title} as complete`}
                        />
                      </td>

                      {/* Fields with line-through if complete */}
                      <td
                        style={{
                          padding: "10px 15px",
                          verticalAlign: "middle",
                          textDecoration: isComplete ? "line-through" : "none",
                          color: isComplete ? "#777" : "inherit",
                          overflowWrap: "break-word",
                        }}
                      >
                        {todo.title}
                      </td>
                      <td
                        style={{
                          padding: "10px 15px",
                          verticalAlign: "middle",
                          textDecoration: isComplete ? "line-through" : "none",
                          color: isComplete ? "#777" : "inherit",
                          overflowWrap: "break-word",
                        }}
                      >
                        {todo.description}
                      </td>
                      <td
                        style={{
                          padding: "10px 15px",
                          verticalAlign: "middle",
                          textDecoration: isComplete ? "line-through" : "none",
                          color: isComplete ? "#777" : "inherit",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : "-"}
                      </td>
                      <td
                        style={{
                          padding: "10px 15px",
                          verticalAlign: "middle",
                          textDecoration: isComplete ? "line-through" : "none",
                          color: isComplete ? "#777" : "inherit",
                          textTransform: "capitalize",
                        }}
                      >
                        {todo.priority}
                      </td>
                      <td
                        style={{
                          padding: "10px 15px",
                          verticalAlign: "middle",
                          textDecoration: isComplete ? "line-through" : "none",
                          color: isComplete ? "#777" : "inherit",
                          textTransform: "capitalize",
                        }}
                      >
                        {todo.category}
                      </td>
                      <td
                        style={{
                          padding: "10px 15px",
                          verticalAlign: "middle",
                          textDecoration: isComplete ? "line-through" : "none",
                          color: isComplete ? "#777" : "inherit",
                          overflowWrap: "break-word",
                        }}
                      >
                        {todo.location}
                      </td>
                      <td
                        style={{
                          padding: "10px 15px",
                          verticalAlign: "middle",
                          textDecoration: isComplete ? "line-through" : "none",
                          color: isComplete ? "#777" : "inherit",
                          overflowWrap: "break-word",
                        }}
                      >
                        {todo.reminder}
                      </td>
                      <td
                        style={{
                          padding: "10px 15px",
                          verticalAlign: "middle",
                          textDecoration: isComplete ? "line-through" : "none",
                          color: isComplete ? "#777" : "inherit",
                          overflowWrap: "break-word",
                        }}
                      >
                        {todo.tag}
                      </td>
                      <td
                        style={{
                          padding: "10px 15px",
                          verticalAlign: "middle",
                          textDecoration: isComplete ? "line-through" : "none",
                          color: isComplete ? "#777" : "inherit",
                          overflowWrap: "break-word",
                        }}
                      >
                        {todo.assignTo}
                      </td>

                      <td
                        style={{
                          padding: "10px 15px",
                          display: "flex",
                          justifyContent: "center",
                          gap: "0.5rem",
                          verticalAlign: "middle",
                        }}
                      >
                        <button
                          onClick={() => navigate(`/update/${todo._id}`)}
                          disabled={isComplete}
                          style={{
                            backgroundColor: isComplete ? "#aaa" : "#28a745",
                            border: "none",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: 4,
                            cursor: isComplete ? "not-allowed" : "pointer",
                            fontWeight: "600",
                            userSelect: "none",
                          }}
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDelete(todo._id)}
                          disabled={deleteLoadingId === todo._id}
                          style={{
                            backgroundColor: "#dc3545",
                            border: "none",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: 4,
                            cursor:
                              deleteLoadingId === todo._id ? "not-allowed" : "pointer",
                            fontWeight: "600",
                            userSelect: "none",
                          }}
                        >
                          {deleteLoadingId === todo._id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              disabled={currentPage === i + 1}
              style={{
                backgroundColor: currentPage === i + 1 ? "#007bff" : "white",
                color: currentPage === i + 1 ? "white" : "#007bff",
                border: "1.5px solid #007bff",
                padding: "6px 12px",
                borderRadius: 4,
                cursor: currentPage === i + 1 ? "default" : "pointer",
                fontWeight: "600",
                userSelect: "none",
              }}
              aria-label={`Go to page ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



















