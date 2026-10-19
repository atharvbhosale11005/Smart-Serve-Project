import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import {
  getAdminServices,
  createService,
  updateService,
  deleteService,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "../Services/adminService";
import "./ManageServices.css";

function ManageServices() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("SERVICES"); // "SERVICES" or "CATEGORIES"
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    category_id: "",
    service_name: "",
    description: "",
    base_price: "",
    price_unit: "per visit",
    is_active: true
  });

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    category_name: "",
    description: "",
    is_active: true
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const [servicesRes, categoriesRes] = await Promise.all([
        getAdminServices(token),
        getAdminCategories(token)
      ]);

      if (servicesRes.status === "success") {
        setServices(servicesRes.data || []);
      }
      if (categoriesRes.status === "success") {
        setCategories(categoriesRes.data || []);
      }
    } catch (error) {
      console.error("LOAD SERVICES/CATEGORIES ERROR:", error);
      toast.error("Failed to load services data");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SERVICE HANDLERS ================= */
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      category_id: categories[0]?.category_id || "",
      service_name: "",
      description: "",
      base_price: "",
      price_unit: "per visit",
      is_active: true
    });
    setShowServiceModal(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      category_id: service.category_id,
      service_name: service.service_name,
      description: service.description || "",
      base_price: service.base_price,
      price_unit: service.price_unit || "per visit",
      is_active: service.is_active
    });
    setShowServiceModal(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.service_name.trim()) {
      toast.warning("Please enter a service name");
      return;
    }
    if (!serviceForm.category_id) {
      toast.warning("Please select a category");
      return;
    }
    if (!serviceForm.base_price || Number(serviceForm.base_price) <= 0) {
      toast.warning("Please enter a valid base price");
      return;
    }

    try {
      setSaving(true);
      const token = sessionStorage.getItem("token");

      if (editingService) {
        const res = await updateService(editingService.service_id, serviceForm, token);
        if (res.status === "success") {
          toast.success("Service updated successfully");
          setShowServiceModal(false);
          loadAllData();
        } else {
          toast.error(res.data || "Update failed");
        }
      } else {
        const res = await createService(serviceForm, token);
        if (res.status === "success") {
          toast.success("Service created successfully");
          setShowServiceModal(false);
          loadAllData();
        } else {
          toast.error(res.data || "Creation failed");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleServiceStatus = async (service) => {
    const newActive = !service.is_active;
    try {
      const token = sessionStorage.getItem("token");
      const res = await updateService(service.service_id, { ...service, is_active: newActive }, token);
      if (res.status === "success") {
        toast.success(`Service ${newActive ? "activated" : "deactivated"}`);
        setServices(prev =>
          prev.map(s => s.service_id === service.service_id ? { ...s, is_active: newActive } : s)
        );
      } else {
        toast.error(res.data || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  /* ================= CATEGORY HANDLERS ================= */
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      category_name: "",
      description: "",
      is_active: true
    });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      category_name: cat.category_name,
      description: cat.description || "",
      is_active: cat.is_active
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.category_name.trim()) {
      toast.warning("Please enter category name");
      return;
    }

    try {
      setSaving(true);
      const token = sessionStorage.getItem("token");

      if (editingCategory) {
        const res = await updateCategory(editingCategory.category_id, categoryForm, token);
        if (res.status === "success") {
          toast.success("Category updated successfully");
          setShowCategoryModal(false);
          loadAllData();
        } else {
          toast.error(res.data || "Update failed");
        }
      } else {
        const res = await createCategory(categoryForm, token);
        if (res.status === "success") {
          toast.success("Category created successfully");
          setShowCategoryModal(false);
          loadAllData();
        } else {
          toast.error(res.data || "Creation failed");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategoryStatus = async (cat) => {
    const newActive = !cat.is_active;
    try {
      const token = sessionStorage.getItem("token");
      const res = await updateCategory(cat.category_id, { ...cat, is_active: newActive }, token);
      if (res.status === "success") {
        toast.success(`Category ${newActive ? "activated" : "deactivated"}`);
        setCategories(prev =>
          prev.map(c => c.category_id === cat.category_id ? { ...c, is_active: newActive } : c)
        );
      } else {
        toast.error(res.data || "Failed to update category status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch =
      (s.service_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.category_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategoryFilter !== "ALL" && String(s.category_id) !== String(selectedCategoryFilter)) {
      return false;
    }
    return true;
  });

  const filteredCategories = categories.filter(c =>
    (c.category_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-shell">
      <AdminNavbar />

      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* Header */}
          <div className="page-header d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">
                <i className="bi bi-tools text-danger me-2"></i>
                Services & Categories Catalog
              </h2>
              <p className="text-muted mb-0">
                Configure offerings, adjust base pricing, manage price units and organize service categories
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={loadAllData}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
              {activeTab === "SERVICES" ? (
                <button
                  className="btn btn-danger btn-sm px-3 fw-bold"
                  onClick={handleOpenAddService}
                >
                  <i className="bi bi-plus-lg me-1"></i> Add Service
                </button>
              ) : (
                <button
                  className="btn btn-danger btn-sm px-3 fw-bold"
                  onClick={handleOpenAddCategory}
                >
                  <i className="bi bi-folder-plus me-1"></i> Add Category
                </button>
              )}
            </div>
          </div>

          {/* Top Tabs */}
          <ul className="nav nav-tabs services-main-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "SERVICES" ? "active fw-bold" : ""}`}
                onClick={() => setActiveTab("SERVICES")}
              >
                <i className="bi bi-grid-3x3-gap me-2"></i>
                Services List ({services.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "CATEGORIES" ? "active fw-bold" : ""}`}
                onClick={() => setActiveTab("CATEGORIES")}
              >
                <i className="bi bi-tags me-2"></i>
                Service Categories ({categories.length})
              </button>
            </li>
          </ul>

          {/* Tab 1: Services List */}
          {activeTab === "SERVICES" && (
            <div>
              {/* Search & Filter */}
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-3">
                  <div className="row g-2 align-items-center">
                    <div className="col-md-7">
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <i className="bi bi-search text-muted"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control bg-light border-start-0 ps-0"
                          placeholder="Search services by title, category, description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button className="btn btn-light border" onClick={() => setSearchTerm("")}>
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-md-5 d-flex justify-content-md-end">
                      <select
                        className="form-select w-auto"
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      >
                        <option value="ALL">All Categories ({categories.length})</option>
                        {categories.map((cat) => (
                          <option key={cat.category_id} value={cat.category_id}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Table */}
              <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-danger" role="status"></div>
                      <p className="mt-2 text-muted">Loading services...</p>
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-cone-striped fs-1 text-muted d-block mb-2"></i>
                      <h5>No Services Found</h5>
                      <p className="text-muted small">Click "Add Service" to create your first offering.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 services-table">
                        <thead className="table-light">
                          <tr>
                            <th>Service Title</th>
                            <th>Category</th>
                            <th>Base Price</th>
                            <th>Price Unit</th>
                            <th>Bookings</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredServices.map((svc) => (
                            <tr key={svc.service_id}>
                              <td>
                                <div>
                                  <strong className="d-block text-dark">{svc.service_name}</strong>
                                  <small className="text-muted line-clamp-1">{svc.description || "No description"}</small>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                  {svc.category_name || "Uncategorized"}
                                </span>
                              </td>
                              <td>
                                <span className="fw-bold text-dark fs-6">
                                  ₹{svc.base_price?.toFixed(2) || "0.00"}
                                </span>
                              </td>
                              <td>
                                <span className="small text-secondary">{svc.price_unit || "per visit"}</span>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark border">
                                  {svc.total_bookings} total ({svc.completed_bookings} done)
                                </span>
                              </td>
                              <td>
                                {svc.is_active ? (
                                  <span className="badge bg-success">Active</span>
                                ) : (
                                  <span className="badge bg-secondary">Disabled</span>
                                )}
                              </td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => handleOpenEditService(svc)}
                                    title="Edit Service"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    className={`btn ${svc.is_active ? "btn-outline-danger" : "btn-outline-success"}`}
                                    onClick={() => handleToggleServiceStatus(svc)}
                                    title={svc.is_active ? "Disable Service" : "Enable Service"}
                                  >
                                    <i className={`bi ${svc.is_active ? "bi-eye-slash" : "bi-eye"}`}></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Categories List */}
          {activeTab === "CATEGORIES" && (
            <div>
              {/* Categories Cards Grid */}
              <div className="row g-4">
                {filteredCategories.map((cat) => (
                  <div className="col-lg-4 col-md-6" key={cat.category_id}>
                    <div className="card h-100 shadow-sm border-0 category-card">
                      <div className="card-body p-4 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="category-icon-box">
                              <i className="bi bi-tag-fill"></i>
                            </div>
                            {cat.is_active ? (
                              <span className="badge bg-success">Active</span>
                            ) : (
                              <span className="badge bg-secondary">Inactive</span>
                            )}
                          </div>
                          <h5 className="fw-bold mb-2 text-dark">{cat.category_name}</h5>
                          <p className="text-muted small mb-3">
                            {cat.description || "No category description provided."}
                          </p>
                        </div>

                        <div className="border-top pt-3 mt-2">
                          <div className="d-flex justify-content-between small text-secondary mb-3">
                            <span><i className="bi bi-tools me-1"></i> {cat.total_services} Services</span>
                            <span><i className="bi bi-people me-1"></i> {cat.total_workers} Workers</span>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-secondary flex-fill"
                              onClick={() => handleOpenEditCategory(cat)}
                            >
                              <i className="bi bi-pencil me-1"></i> Edit
                            </button>
                            <button
                              className={`btn btn-sm ${cat.is_active ? "btn-outline-danger" : "btn-outline-success"} flex-fill`}
                              onClick={() => handleToggleCategoryStatus(cat)}
                            >
                              {cat.is_active ? "Disable" : "Enable"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Modal */}
          {showServiceModal && (
            <div className="modal-backdrop-custom">
              <div className="modal-card-custom shadow-lg">
                <form onSubmit={handleSaveService}>
                  <div className="modal-header-custom border-bottom p-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">
                      {editingService ? "Edit Service" : "Add New Service"}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowServiceModal(false)}></button>
                  </div>
                  <div className="modal-body-custom p-4">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-bold">Category</label>
                        <select
                          className="form-select"
                          value={serviceForm.category_id}
                          onChange={(e) => setServiceForm({ ...serviceForm, category_id: e.target.value })}
                          required
                        >
                          <option value="">-- Select Category --</option>
                          {categories.map((c) => (
                            <option key={c.category_id} value={c.category_id}>
                              {c.category_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold">Service Title</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. AC Deep Cleaning & Servicing"
                          value={serviceForm.service_name}
                          onChange={(e) => setServiceForm({ ...serviceForm, service_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold">Base Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="499.00"
                          value={serviceForm.base_price}
                          onChange={(e) => setServiceForm({ ...serviceForm, base_price: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold">Price Unit</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="per visit / per hour / per unit"
                          value={serviceForm.price_unit}
                          onChange={(e) => setServiceForm({ ...serviceForm, price_unit: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold">Description</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Detailed description of what the service includes..."
                          value={serviceForm.description}
                          onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                        ></textarea>
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="serviceActiveSwitch"
                            checked={serviceForm.is_active}
                            onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="serviceActiveSwitch">
                            Active & visible to customers for booking
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer-custom mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-danger px-4" disabled={saving}>
                        {saving ? "Saving..." : editingService ? "Update Service" : "Create Service"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Category Modal */}
          {showCategoryModal && (
            <div className="modal-backdrop-custom">
              <div className="modal-card-custom shadow-lg">
                <form onSubmit={handleSaveCategory}>
                  <div className="modal-header-custom border-bottom p-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">
                      {editingCategory ? "Edit Category" : "Add New Category"}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowCategoryModal(false)}></button>
                  </div>
                  <div className="modal-body-custom p-4">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-bold">Category Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Electrician, Plumbing, Carpentry"
                          value={categoryForm.category_name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold">Description</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Short summary of this trade or service vertical..."
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        ></textarea>
                      </div>

                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="catActiveSwitch"
                            checked={categoryForm.is_active}
                            onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="catActiveSwitch">
                            Category is Active
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer-custom mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-danger px-4" disabled={saving}>
                        {saving ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default ManageServices;
