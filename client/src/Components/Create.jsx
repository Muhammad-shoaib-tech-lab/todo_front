import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Create({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const initialValues = {
    title: "",
    description: "",
    dueDate: "",
    priority: "",
    category: "",
    location: "",
    reminder: "",
    tag: "",
    assignTo: "", 
  };

  const validationSchema = Yup.object({
    title: Yup.string().required("Title is required").min(3, "Title must be at least 3 characters")
    .max(25, "Title must be at most 25 characters").trim(),
    description: Yup.string().required("Description is required").min(3, "Title must be at least 3 characters")
    .max(35, "Title must be at most 25 characters").trim(),
    dueDate: Yup.date()
      .required("Due date is required")
      .min(new Date(), "Due date cannot be in the past"),
    priority: Yup.string().required("Priority is required"),
    category: Yup.string().required("Category is required"),
    location: Yup.string().required("Location is required"),
    reminder: Yup.string().required("Reminder is required"),
    tag: Yup.string().required("Tag is required"),
    assignTo: Yup.string().required("Assign To is required"), // ✅ still validate
  });

  const handleSubmit = async (values, { resetForm }) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // ✅ add userEmail reference along with form values
      const todoData = { ...values, userEmail: user.email };

      await axios.post("http://localhost:5000/api/todos", todoData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Todo created successfully!");
      resetForm();
      // navigate("/details");
    } catch (e) {
      alert("Failed to create todo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: 20, color: "#007bff" }}>Create Todo</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
            <FormField label="Title" name="title" type="text" />
            <FormField
              label="Description"
              name="description"
              as="textarea"
              rows="3"
            />
            <FormField label="Due Date" name="dueDate" type="date" />
            <FormSelect
              label="Priority"
              name="priority"
              options={["Low", "Normal", "High"]}
            />
            <FormField label="Category" name="category" type="text" />
            <FormField label="Location" name="location" type="text" />
            <FormField label="Reminder" name="reminder" type="text" />
            <FormField label="Tag" name="tag" type="text" />
            <FormField label="Assign To" name="assignTo" type="text" />{" "}
            {/* ✅ still keep assignTo */}

            <button
              type="submit"
              disabled={isSubmitting || loading}
              style={{
                marginTop: 20,
                padding: "10px 20px",
                backgroundColor: loading ? "#6c757d" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: 5,
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating..." : "Create Todo"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

// Helper components for consistent form fields styling:
function FormField({ label, name, type = "text", as = "input", rows }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <label htmlFor={name} style={{ fontWeight: "600" }}>
        {label}
      </label>
      <Field
        name={name}
        type={type}
        as={as}
        rows={rows}
        style={{
          width: "100%",
          padding: "8px 12px",
          marginTop: 6,
          borderRadius: 4,
          border: "1px solid #ccc",
          fontSize: 16,
          boxSizing: "border-box",
          resize: as === "textarea" ? "vertical" : "none",
        }}
      />
      <ErrorMessage
        name={name}
        component="div"
        style={{ color: "red", marginTop: 4, fontSize: 14 }}
      />
    </div>
  );
}

function FormSelect({ label, name, options }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <label htmlFor={name} style={{ fontWeight: "600" }}>
        {label}
      </label>
      <Field
        as="select"
        name={name}
        style={{
          width: "100%",
          padding: "8px 12px",
          marginTop: 6,
          borderRadius: 4,
          border: "1px solid #ccc",
          fontSize: 16,
          boxSizing: "border-box",
          backgroundColor: "white",
        }}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Field>
      <ErrorMessage
        name={name}
        component="div"
        style={{ color: "red", marginTop: 4, fontSize: 14 }}
      />
    </div>
  );
}
