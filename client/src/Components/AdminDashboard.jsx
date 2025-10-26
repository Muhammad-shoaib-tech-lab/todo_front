import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token] = useState(localStorage.getItem("token"));
  const [selectedCard, setSelectedCard] = useState("");
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [currentPageTodos, setCurrentPageTodos] = useState(1);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingTodoId, setEditingTodoId] = useState(null);

  const [userFilter, setUserFilter] = useState("");
  const [todoFilter, setTodoFilter] = useState({
    title: "",
    location: "",
    assignTo: "",
    userEmail: "",
  });

  const usersPerPage = 4;
  const todosPerPage = 4;

 


  const fetchUsers = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      alert("Authentication failed. Please login again. Logout to login");
      // Optionally redirect
      // navigate("/login");
      return;
    }

    if (!res.ok) {
      throw new Error("Failed to fetch users");
    }

    const data = await res.json();
    setUsers(data);
  } catch (err) {
    console.error(err);
  }
};

const fetchTodos = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/todos", {
      headers: { Authorization: `Bearer ${token}` },
    });

  

    if (!res.ok) {
      throw new Error("Failed to fetch todos");
    }

    const data = await res.json();
    setTodos(data);
  } catch (err) {
    console.error(err);
  }
};

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      await fetchTodos();
      setLoading(false);
    };
    loadData();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user and all their todos?")) return;
    try {
      // Find the user to get their email
      const userToDelete = users.find(u => u._id === id);
      if (!userToDelete) {
        alert("User not found!");
        return;
      }

      // Find all todos associated with this user
      const userTodos = todos.filter(todo => 
        todo.userEmail?.toLowerCase().trim() === userToDelete.email.toLowerCase().trim() ||
        todo.assignTo?.toLowerCase().trim() === userToDelete.email.toLowerCase().trim()
      );

      // Delete all user's todos first
      for (const todo of userTodos) {
        await fetch(`http://localhost:5000/api/todos/${todo._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Then delete the user
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || "Failed to delete user");
        return;
      }

      // Update local state
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setTodos((prev) => prev.filter(todo => 
        !(todo.userEmail?.toLowerCase().trim() === userToDelete.email.toLowerCase().trim() ||
          todo.assignTo?.toLowerCase().trim() === userToDelete.email.toLowerCase().trim())
      ));

      alert(`User and ${userTodos.length} associated todos deleted successfully!`);
    } catch (err) {
      console.error(err);
      alert("Error deleting user. Please try again.");
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm("Are you sure you want to delete this todo?")) return;
    try {
      await fetch(`http://localhost:5000/api/todos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Helper function to get todo count for a user by their email
  const getTodoCountByUserEmail = (userEmail) => {
    if (!userEmail || !todos) return 0;
    return todos.filter((todo) => {
      const todoUserEmail = todo.userEmail?.trim().toLowerCase();
      const todoAssignTo = todo.assignTo?.trim().toLowerCase();
      const userEmailLower = userEmail.trim().toLowerCase();
      
      return todoUserEmail === userEmailLower || 
             (!todo.userEmail && todoAssignTo === userEmailLower);
    }).length;
  };

  // Update todos when user email changes
  const updateTodosForEmailChange = async (oldEmail, newEmail) => {
    try {
      const todosToUpdate = todos.filter(
        (todo) => 
          todo.userEmail?.toLowerCase().trim() === oldEmail.toLowerCase().trim() ||
          todo.assignTo?.toLowerCase().trim() === oldEmail.toLowerCase().trim()
      );
      
      for (const todo of todosToUpdate) {
        const updatedTodo = { ...todo };
        if (todo.userEmail?.toLowerCase().trim() === oldEmail.toLowerCase().trim()) {
          updatedTodo.userEmail = newEmail;
        }
        if (todo.assignTo?.toLowerCase().trim() === oldEmail.toLowerCase().trim()) {
          updatedTodo.assignTo = newEmail;
        }

        await fetch(`http://localhost:5000/api/todos/${todo._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedTodo),
        });
      }
      
      // Refresh todos after updating
      await fetchTodos();
    } catch (err) {
      console.error("Error updating todos:", err);
    }
  };

  // Check if email already exists (excluding current user)
  const isEmailAlreadyRegistered = (email, currentUserId) => {
    return users.some(user => 
      user.email.toLowerCase().trim() === email.toLowerCase().trim() && 
      user._id !== currentUserId
    );
  };

  const userFormik = useFormik({
    enableReinitialize: true,
    initialValues: editingUserId
      ? users.find((u) => u._id === editingUserId) || { email: "", role: "user" }
      : { email: "", role: "user" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      role: Yup.string().oneOf(["user", "admin"]).required("Role is required"),
    }),
    onSubmit: async (values) => {
      try {
        // Check if email is already registered by another user
        if (isEmailAlreadyRegistered(values.email, editingUserId)) {
          alert("This email is already registered!");
          return;
        }

        const oldUser = users.find((u) => u._id === editingUserId);
        const oldEmail = oldUser?.email;
        const newEmail = values.email;

        // Update user
        const response = await fetch(`http://localhost:5000/api/users/${editingUserId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.message || "Failed to update user");
          return;
        }

        // If email changed, update related todos
        if (oldEmail && newEmail && oldEmail.toLowerCase().trim() !== newEmail.toLowerCase().trim()) {
          await updateTodosForEmailChange(oldEmail, newEmail);
        }

        setEditingUserId(null);
        await fetchUsers(); // Refresh users
        alert("User updated successfully!");
      } catch (err) {
        console.error(err);
        alert("Error updating user. Please try again.");
      }
    },
  });

  const todoFormik = useFormik({
    enableReinitialize: true,
    initialValues: editingTodoId
      ? todos.find((t) => t._id === editingTodoId) || {
          title: "",
          description: "",
          dueDate: "",
          location: "",
          assignTo: "",
          userEmail: "",
          tags: "",
          category: "",
          priority: "",
        }
      : {
          title: "",
          description: "",
          dueDate: "",
          location: "",
          assignTo: "",
          userEmail: "",
          tags: "",
          category: "",
          priority: "",
        },
    validationSchema: Yup.object({
      title: Yup.string().required("Title is required"),
      description: Yup.string().required("Description is required"),
      dueDate: Yup.date()
        .required("Due date is required")
        .min(new Date(), "Due date cannot be in the past"),
      location: Yup.string().required("Location is required"),
      assignTo: Yup.string().required("AssignTo is required"),
      userEmail: Yup.string().email("Invalid email").required("User email is required"), // Fixed: changed from 'email' to 'userEmail'
      category: Yup.string().required("Category is required"),
      priority: Yup.string().required("Priority is required"),
    }),
    onSubmit: async (values) => {
      try {
        const response = await fetch(`http://localhost:5000/api/todos/${editingTodoId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.message || "Failed to update todo");
          return;
        }

        setEditingTodoId(null);
        fetchTodos();
        alert("Todo updated successfully!");
      } catch (err) {
        console.error(err);
        alert("Error updating todo. Please try again.");
      }
    },
  });

  if (loading) return <p>Loading...</p>;

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(userFilter.toLowerCase())
  );
  
  const filteredTodos = todos.filter((t) => {
    const titleMatch = t.title.toLowerCase().includes(todoFilter.title.toLowerCase());
    const locationMatch = t.location.toLowerCase().includes(todoFilter.location.toLowerCase());
    const assignToMatch = t.assignTo.toLowerCase().includes(todoFilter.assignTo.toLowerCase());
    const userEmailMatch = t.userEmail?.toLowerCase().includes(todoFilter.userEmail.toLowerCase()) ?? true;
    
    return titleMatch && locationMatch && assignToMatch && userEmailMatch;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPageUsers - 1) * usersPerPage,
    currentPageUsers * usersPerPage
  );
  const paginatedTodos = filteredTodos.slice(
    (currentPageTodos - 1) * todosPerPage,
    currentPageTodos * todosPerPage
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 ml-130">Admin Dashboard</h1>
      <div className="flex gap-4 mb-6">
        <div
          onClick={() => setSelectedCard("users")}
          className="cursor-pointer bg-blue-500 text-white p-4 rounded shadow w-1/4 text-center ml-70"
        >
          <h2 className="text-xl font-bold">Total Users</h2>
          <p className="text-2xl">{filteredUsers.length}</p>
        </div>
        <div
          onClick={() => setSelectedCard("todos")}
          className="cursor-pointer bg-green-500 text-white p-4 rounded shadow w-1/4 text-center ml-20"
        >
          <h2 className="text-xl font-bold">Total Todos</h2>
          <p className="text-2xl">{filteredTodos.length}</p>
        </div>
      </div>

      {selectedCard === "users" && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <input
            type="text"
            placeholder="Filter by Email"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border p-2 mb-4 w-1/3 rounded"
          />

          {filteredUsers.length === 0 ? (
            <p className="text-red-500 font-semibold">No users found</p>
          ) : (
            <>
              <table className="w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Role</th>
                    <th className="border p-2">Total Todos</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="border p-2">
                        {editingUserId === user._id ? (
                          <>
                            <input
                              type="email"
                              name="email"
                              value={userFormik.values.email}
                              onChange={userFormik.handleChange}
                              className="border p-1 rounded w-full"
                            />
                            {userFormik.errors.email && (
                              <p className="text-red-500 text-sm">{userFormik.errors.email}</p>
                            )}
                          </>
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="border p-2">
                        {editingUserId === user._id ? (
                          <>
                            <select
                              name="role"
                              value={userFormik.values.role}
                              onChange={userFormik.handleChange}
                              className="border p-1 rounded"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            {userFormik.errors.role && (
                              <p className="text-red-500 text-sm">{userFormik.errors.role}</p>
                            )}
                          </>
                        ) : (
                          user.role
                        )}
                      </td>
                      <td className="border p-2">
                        <span className="font-semibold text-blue-600">
                          {getTodoCountByUserEmail(user.email)}
                        </span>
                      </td>
                      <td className="border p-2 space-x-2">
                        {editingUserId === user._id ? (
                          <>
                            <button
                              className="bg-green-500 text-white px-2 py-1 rounded"
                              onClick={userFormik.handleSubmit}
                            >
                              Save
                            </button>
                            <button
                              className="bg-gray-500 text-white px-2 py-1 rounded"
                              onClick={() => setEditingUserId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="bg-blue-500 text-white px-2 py-1 rounded"
                              onClick={() => setEditingUserId(user._id)}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-red-500 text-white px-2 py-1 rounded"
                              onClick={() => deleteUser(user._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(filteredUsers.length / usersPerPage) }).map(
                  (_, idx) => (
                    <button
                      key={idx}
                      className={`px-2 py-1 border rounded  ${
                        currentPageUsers === idx + 1 ? "bg-blue-500 text-white" : ""
                      }`}
                      onClick={() => setCurrentPageUsers(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* Todos Table */}
      {selectedCard === "todos" && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Todos</h2>

          {/* Todo Filters */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Filter by Title"
              value={todoFilter.title}
              onChange={(e) => setTodoFilter({ ...todoFilter, title: e.target.value })}
              className="border p-2 rounded w-1/5"
            />
            <input
              type="text"
              placeholder="Filter by Location"
              value={todoFilter.location}
              onChange={(e) => setTodoFilter({ ...todoFilter, location: e.target.value })}
              className="border p-2 rounded w-1/5"
            />
            <input
              type="text"
              placeholder="Filter by Assign To"
              value={todoFilter.assignTo}
              onChange={(e) => setTodoFilter({ ...todoFilter, assignTo: e.target.value })}
              className="border p-2 rounded w-1/5"
            />
            <input
              type="text"
              placeholder="Filter by User Email"
              value={todoFilter.userEmail}
              onChange={(e) => setTodoFilter({ ...todoFilter, userEmail: e.target.value })}
              className="border p-2 rounded w-1/5"
            />
          </div>

          {filteredTodos.length === 0 ? (
            <p className="text-red-500 font-semibold">No todos found</p>
          ) : (
            <>
              <table className="w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Title</th>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Due Date</th>
                    <th className="border p-2">Location</th>
                    <th className="border p-2">Assign To</th>
                    <th className="border p-2">User Email</th>
                    <th className="border p-2">Category</th>
                    <th className="border p-2">Priority</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTodos.map((todo) => (
                    <tr key={todo._id}>
                      <td className="border p-2">
                        {editingTodoId === todo._id ? (
                          <>
                            <input
                              name="title"
                              value={todoFormik.values.title}
                              onChange={todoFormik.handleChange}
                              className="border p-1 rounded w-full"
                            />
                            {todoFormik.errors.title && (
                              <p className="text-red-500 text-sm">{todoFormik.errors.title}</p>
                            )}
                          </>
                        ) : (
                          todo.title
                        )}
                      </td>
                      <td className="border p-2">
                        {editingTodoId === todo._id ? (
                          <>
                            <input
                              name="description"
                              value={todoFormik.values.description}
                              onChange={todoFormik.handleChange}
                              className="border p-1 rounded w-full"
                            />
                            {todoFormik.errors.description && (
                              <p className="text-red-500 text-sm">{todoFormik.errors.description}</p>
                            )}
                          </>
                        ) : (
                          todo.description
                        )}
                      </td>
                      <td className="border p-2">
                        {editingTodoId === todo._id ? (
                          <>
                            <input
                              type="date"
                              name="dueDate"
                              value={todoFormik.values.dueDate?.slice(0, 10)}
                              onChange={todoFormik.handleChange}
                              className="border p-1 rounded w-full"
                            />
                            {todoFormik.errors.dueDate && (
                              <p className="text-red-500 text-sm">{todoFormik.errors.dueDate}</p>
                            )}
                          </>
                        ) : (
                          new Date(todo.dueDate).toLocaleDateString()
                        )}
                      </td>
                      <td className="border p-2">
                        {editingTodoId === todo._id ? (
                          <>
                            <input
                              name="location"
                              value={todoFormik.values.location}
                              onChange={todoFormik.handleChange}
                              className="border p-1 rounded w-full"
                            />
                            {todoFormik.errors.location && (
                              <p className="text-red-500 text-sm">{todoFormik.errors.location}</p>
                            )}
                          </>
                        ) : (
                          todo.location
                        )}
                      </td>
                      <td className="border p-2">
                        {editingTodoId === todo._id ? (
                          <>
                            <input
                              name="assignTo"
                              value={todoFormik.values.assignTo}
                              onChange={todoFormik.handleChange}
                              className="border p-1 rounded w-full"
                            />
                            {todoFormik.errors.assignTo && (
                              <p className="text-red-500 text-sm">{todoFormik.errors.assignTo}</p>
                            )}
                          </>
                        ) : (
                          todo.assignTo
                        )}
                      </td>
                      {/* User Email column */}
                      <td className="border p-2">
                        {editingTodoId === todo._id ? (
                          <>
                            <input
                              type="email"
                              name="userEmail"
                              value={todoFormik.values.userEmail}
                              onChange={todoFormik.handleChange}
                              className="border p-1 rounded w-full"
                              placeholder="Enter user email"
                            />
                            {todoFormik.errors.userEmail && (
                              <p className="text-red-500 text-sm">{todoFormik.errors.userEmail}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-blue-600 font-medium">
                            {todo.userEmail || todo.assignTo || 'No email set'}
                          </span>
                        )}
                      </td>
                      <td className="border p-2">
                        {editingTodoId === todo._id ? (
                          <>
                            <input
                              name="category"
                              value={todoFormik.values.category}
                              onChange={todoFormik.handleChange}
                              className="border p-1 rounded w-full"
                            />
                            {todoFormik.errors.category && (
                              <p className="text-red-500 text-sm">{todoFormik.errors.category}</p>
                            )}
                          </>
                        ) : (
                          todo.category
                        )}
                      </td>
                      <td className="border p-2">
                        {editingTodoId === todo._id ? (
                          <>
                            <input
                              name="priority"
                              value={todoFormik.values.priority}
                              onChange={todoFormik.handleChange}
                              className="border p-1 rounded w-full"
                            />
                            {todoFormik.errors.priority && (
                              <p className="text-red-500 text-sm">{todoFormik.errors.priority}</p>
                            )}
                          </>
                        ) : (
                          todo.priority
                        )}
                      </td>
                      <td className="border p-2 space-x-2">
                        {editingTodoId === todo._id ? (
                          <>
                            <button
                              className="bg-green-500 text-white px-2 py-1 rounded"
                              onClick={todoFormik.handleSubmit}
                            >
                              Save
                            </button>
                            <button
                              className="bg-gray-500 text-white px-2 py-1 rounded"
                              onClick={() => setEditingTodoId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                        <div className="flex gap-3">
  <button
    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105"
    onClick={() => setEditingTodoId(todo._id)}
  >
    Edit
  </button>
  <button
    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105"
    onClick={() => deleteTodo(todo._id)}
  >
  Delete
  </button>
</div>

                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(filteredTodos.length / todosPerPage) }).map(
                  (_, idx) => (
                    <button
                      key={idx}
                      className={`px-2 py-1 border rounded ${
                        currentPageTodos === idx + 1 ? "bg-green-500 text-white" : ""
                      }`}
                      onClick={() => setCurrentPageTodos(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;







