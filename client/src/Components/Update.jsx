import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

export default function Update({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // ✅ Get token from localStorage
  const token = localStorage.getItem("token");

  const validationSchema = Yup.object({
    title: Yup.string().required("Title is required"),
    description: Yup.string().required("Description is required"),
    dueDate: Yup.date()
      .required("Due date is required")
      .min(new Date(), "Due date cannot be in the past"),
    priority: Yup.string().required("Priority is required"),
    category: Yup.string().required("Category is required"),
    location: Yup.string().required("Location is required"),
    reminder: Yup.string().required("Reminder is required"),
    tag: Yup.string().required("Tag is required"),
    assignTo: Yup.string().required("Assign To is required"),
  });

  useEffect(() => {
    const fetchTodo = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/todos/${user.email}`,
          {
            headers: { Authorization: `Bearer ${token}` }, // ✅ Add token
          }
        );

        const todo = res.data.find((t) => t._id === id);
        if (!todo) {
          alert("Todo not found");
          navigate("/details");
          return;
        }
        setInitialValues({
          title: todo.title,
          description: todo.description,
          dueDate: todo.dueDate ? todo.dueDate.slice(0, 10) : "",
          priority: todo.priority,
          category: todo.category,
          location: todo.location,
          reminder: todo.reminder,
          tag: todo.tag,
          assignTo: todo.assignTo,
        });
      } catch (e) {
        alert("Failed to load todo");
        navigate("/details");
      } finally {
        setLoading(false);
      }
    };

    fetchTodo();
  }, [id, navigate, user.email, token]);

 
  const handleSubmit = async (values) => {
  console.log("Submitting values:", values); 
  setSubmitLoading(true);
  try {
    const res = await axios.put(
      `http://localhost:5000/api/todos/${id}`,
      values,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Response:", res.data); // 👈 see response
    alert("Todo updated successfully!");
    navigate("/details");
  } catch (e) {
    console.error("Update error:", e); // 👈 log full error
    alert("Failed to update todo");
  } finally {
    setSubmitLoading(false);
  }
};


  if (loading)
    return <p style={{ textAlign: "center", marginTop: 40 }}>Loading todo data...</p>;

  const containerStyle = {
    maxWidth: 600,
    margin: "2rem auto",
    padding: 24,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  const formGroup = {
    marginBottom: 18,
    display: "flex",
    flexDirection: "column",
  };

  const labelStyle = {
    marginBottom: 6,
    fontWeight: 600,
    color: "#333",
  };

  const inputStyle = {
    padding: "10px 12px",
    fontSize: 16,
    borderRadius: 5,
    border: "1.5px solid #ccc",
    outline: "none",
    transition: "border-color 0.3s",
  };

  const errorStyle = {
    color: "crimson",
    fontSize: 14,
    marginTop: 4,
  };

  const buttonStyle = {
    padding: "12px 20px",
    fontSize: 16,
    borderRadius: 6,
    border: "none",
    backgroundColor: submitLoading ? "#999" : "#007bff",
    color: "#fff",
    fontWeight: 600,
    cursor: submitLoading ? "not-allowed" : "pointer",
    width: "100%",
    marginTop: 20,
    boxShadow: "0 2px 8px rgba(0,123,255,0.3)",
    transition: "background-color 0.3s ease",
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", marginBottom: 24, color: "#007bff" }}>Update Todo</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
            <div style={formGroup}>
              <label htmlFor="title" style={labelStyle}>Title</label>
              <Field id="title" name="title" type="text" style={inputStyle} />
              <ErrorMessage name="title" component="div" style={errorStyle} />
            </div>

            <div style={formGroup}>
              <label htmlFor="description" style={labelStyle}>Description</label>
              <Field
                id="description"
                name="description"
                as="textarea"
                rows="4"
                style={{ ...inputStyle, resize: "vertical" }}
              />
              <ErrorMessage name="description" component="div" style={errorStyle} />
            </div>

            <div style={formGroup}>
              <label htmlFor="dueDate" style={labelStyle}>Due Date</label>
              <Field id="dueDate" name="dueDate" type="date" style={inputStyle} />
              <ErrorMessage name="dueDate" component="div" style={errorStyle} />
            </div>

            <div style={formGroup}>
              <label htmlFor="priority" style={labelStyle}>Priority</label>
              <Field id="priority" name="priority" as="select" style={inputStyle}>
                <option value="">Select priority</option>
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </Field>
              <ErrorMessage name="priority" component="div" style={errorStyle} />
            </div>

            <div style={formGroup}>
              <label htmlFor="category" style={labelStyle}>Category</label>
              <Field id="category" name="category" type="text" style={inputStyle} />
              <ErrorMessage name="category" component="div" style={errorStyle} />
            </div>

            <div style={formGroup}>
              <label htmlFor="location" style={labelStyle}>Location</label>
              <Field id="location" name="location" type="text" style={inputStyle} />
              <ErrorMessage name="location" component="div" style={errorStyle} />
            </div>

            <div style={formGroup}>
              <label htmlFor="reminder" style={labelStyle}>Reminder</label>
              <Field id="reminder" name="reminder" type="text" style={inputStyle} />
              <ErrorMessage name="reminder" component="div" style={errorStyle} />
            </div>

            <div style={formGroup}>
              <label htmlFor="tag" style={labelStyle}>Tag</label>
              <Field id="tag" name="tag" type="text" style={inputStyle} />
              <ErrorMessage name="tag" component="div" style={errorStyle} />
            </div>

            <div style={formGroup}>
              <label htmlFor="assignTo" style={labelStyle}>Assign To</label>
              <Field id="assignTo" name="assignTo" type="text" style={inputStyle} />
              <ErrorMessage name="assignTo" component="div" style={errorStyle} />
            </div>

            <button type="submit" disabled={isSubmitting || submitLoading} style={buttonStyle}>
              {submitLoading ? "Updating..." : "Update Todo"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
