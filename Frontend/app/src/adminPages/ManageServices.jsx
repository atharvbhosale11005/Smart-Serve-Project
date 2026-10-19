import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import {
  getAdminServices,
  createService,
  updateService,
  getAdminCategories,
  createCategory,
  updateCategory
} from "../Services/adminService";
import "./ManageServices.css";

/* ===== Embedded Crisp SVG Icons ===== */
const Icons = {
  Pencil: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Tag: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
};

function ManageServices() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("SERVICES");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const formatPrice = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
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
          toast.error(res.error || (typeof res.data === "string" ? res.data : "Update failed"));
        }
      } else {
        const res = await createService(serviceForm, token);
        if (res.status === "success") {
          toast.success("Service created successfully");
          setShowServiceModal(false);
          loadAllData();
        } else {
          toast.error(res.error || (typeof res.data === "string" ? res.data : "Creation failed"));
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
      const res = await updateService(service.service_id, { is_active: newActive }, token);
      if (res.status === "success") {
        toast.success(`Service ${newActive ? "activated" : "deactivated"}`);
        setServices((prev) =>
          prev.map((s) => (s.service_id === service.service_id ? { ...s, is_active: newActive } : s))
        );
      } else {
        toast.error(res.error || (typeof res.data === "string" ? res.data : "Failed to update status"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  /* ================= CATEGORY HANDLERS ================= */
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ category_name: "", description: "", is_active: true });
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
          toast.error(res.error || (typeof res.data === "string" ? res.data : "Update failed"));
        }
      } else {
        const res = await createCategory(categoryForm, token);
        if (res.status === "success") {
          toast.success("Category created successfully");
          setShowCategoryModal(false);
          loadAllData();
        } else {
          toast.error(res.error || (typeof res.data === "string" ? res.data : "Creation failed"));
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
      const res = await updateCategory(cat.category_id, { is_active: newActive }, token);
      if (res.status === "success") {
        toast.success(`Category ${newActive ? "activated" : "deactivated"}`);
        setCategories((prev) =>
          prev.map((c) => (c.category_id === cat.category_id ? { ...c, is_active: newActive } : c))
        );
      } else {
        toast.error(res.error || (typeof res.data === "string" ? res.data : "Failed to update category status"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const filteredServices = services.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (s.service_name || "").toLowerCase().includes(q) ||
      (s.category_name || "").toLowerCase().includes(q) ||
      (s.description || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (selectedCategoryFilter !== "ALL" && String(s.category_id) !== String(selectedCategoryFilter)) {
      return false;
    }
    return true;
  });

  const filteredCategories = categories.filter(
    (c) =>
      (c.category_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-shell">
      <AdminNavbar />

      <main className="dashboard-main">
        <div className="dashboard-content">
          
          {/* Header - Wrap Enabled for Mobile */}
          <div className="page-header d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">Services & Categories Catalog</h2>
              <p className="text-muted mb-0">
                Configure offerings, adjust base pricing, manage price units and organize service categories
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn-modern-refresh" onClick={loadAllData}>
                <Icons.Refresh />
                <span>Refresh</span>
              </button>
              {activeTab === "SERVICES" ? (
                <button className="btn-modern-primary" onClick={handleOpenAddService}>
                  <Icons.Plus />
                  <span>Add Service</span>
                </button>
              ) : (
                <button className="btn-modern-primary" onClick={handleOpenAddCategory}>
                  <Icons.Plus />
                  <span>Add Category</span>
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
                Services List ({services.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "CATEGORIES" ? "active fw-bold" : ""}`}
                onClick={() => setActiveTab("CATEGORIES")}
              >
                Service Categories ({categories.length})
              </button>
            </li>
          </ul>

          {/* Tab 1: Services List */}
          {activeTab === "SERVICES" && (
            <div>
              <div className="card shadow-sm border-0 mb-4 modern-filter-card">
                <div className="card-body p-3">
                  <div className="row g-3 align-items-center">
                    <div className="col-md-7">
                      <div className="modern-search-box">
                        <span className="search-icon"><Icons.Search /></span>
                        <input
                          type="text"
                          className="form-control border-0 bg-transparent"
                          placeholder="Search services by title, category, description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button className="search-clear-btn" onClick={() => setSearchTerm("")}>✕</button>
                        )}
                      </div>
                    </div>
                    <div className="col-md-5 d-flex justify-content-md-end">
                      <select
                        className="form-select w-auto modern-select"
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

              <div className="card shadow-sm border-0 table-card-elevated">
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-danger" role="status"></div>
                      <p className="mt-2 text-muted">Loading services...</p>
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="empty-state-icon">🛠️</div>
                      <h5 className="mt-3">No Services Found</h5>
                      <p className="text-muted small">Click "Add Service" to create your first offering.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 services-table">
                        <thead>
                          <tr>
                            <th>Service Title</th>
                            <th>Category</th>
                            <th>Base Price</th>
                            <th>Price Unit</th>
                            <th>Bookings</th>
                            <th>Status</th>
                            <th className="text-end" style={{ minWidth: "220px" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredServices.map((svc) => (
                            <tr key={svc.service_id}>
                              <td>
                                <div>
                                  <strong className="d-block text-dark service-title-label">{svc.service_name}</strong>
                                  <small className="text-muted line-clamp-1">{svc.description || "No description"}</small>
                                </div>
                              </td>
                              <td>
                                <span className="category-pill">{svc.category_name || "Uncategorized"}</span>
                              </td>
                              <td>
                                <span className="price-tag">₹{formatPrice(svc.base_price)}</span>
                              </td>
                              <td>
                                <span className="small text-secondary">{svc.price_unit || "per visit"}</span>
                              </td>
                              <td>
                                <span className="bookings-pill">
                                  {svc.total_bookings ?? 0} total ({svc.completed_bookings ?? 0} done)
                                </span>
                              </td>
                              <td>
                                {svc.is_active ? (
                                  <span className="custom-badge badge-approved">Active</span>
                                ) : (
                                  <span className="custom-badge badge-neutral">Disabled</span>
                                )}
                              </td>
                              <td className="text-end">
                                
                                {/* Wrapped Action Buttons Container */}
                                <div className="action-buttons-cell">
                                  <button
                                    className="action-btn-mid btn-mid-edit"
                                    onClick={() => handleOpenEditService(svc)}
                                    title="Edit Service"
                                  >
                                    <Icons.Pencil />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    className={`action-btn-mid ${svc.is_active ? "btn-mid-deactivate" : "btn-mid-activate"}`}
                                    onClick={() => handleToggleServiceStatus(svc)}
                                    title={svc.is_active ? "Disable Service" : "Enable Service"}
                                  >
                                    {svc.is_active ? <Icons.EyeOff /> : <Icons.Eye />}
                                    <span>{svc.is_active ? "Disable" : "Enable"}</span>
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
              <div className="row g-4">
                {filteredCategories.map((cat) => (
                  <div className="col-lg-4 col-md-6" key={cat.category_id}>
                    <div className="card h-100 shadow-sm border-0 category-card-modern">
                      <div className="card-body p-4 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="category-icon-box">
                              <Icons.Tag />
                            </div>
                            {cat.is_active ? (
                              <span className="custom-badge badge-approved">Active</span>
                            ) : (
                              <span className="custom-badge badge-neutral">Inactive</span>
                            )}
                          </div>
                          <h5 className="fw-bold mb-2 text-dark">{cat.category_name}</h5>
                          <p className="text-muted small mb-3">
                            {cat.description || "No category description provided."}
                          </p>
                        </div>

                        <div className="border-top pt-3 mt-2">
                          <div className="d-flex justify-content-between small text-secondary mb-3">
                            <span>{cat.total_services ?? 0} Services</span>
                            <span>{cat.total_workers ?? 0} Workers</span>
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              className="action-btn-mid btn-mid-edit flex-fill"
                              onClick={() => handleOpenEditCategory(cat)}
                            >
                              <Icons.Pencil />
                              <span>Edit</span>
                            </button>
                            <button
                              className={`action-btn-mid ${cat.is_active ? "btn-mid-deactivate" : "btn-mid-activate"} flex-fill`}
                              onClick={() => handleToggleCategoryStatus(cat)}
                            >
                              <span>{cat.is_active ? "Disable" : "Enable"}</span>
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
                    <h5 className="mb-0 fw-bold">{editingService ? "Edit Service" : "Add New Service"}</h5>
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
                            <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
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

                    <div className="modal-footer-custom mt-4 pt-3 border-top d-flex justify-content-end flex-wrap gap-2">
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
                    <h5 className="mb-0 fw-bold">{editingCategory ? "Edit Category" : "Add New Category"}</h5>
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

                    <div className="modal-footer-custom mt-4 pt-3 border-top d-flex justify-content-end flex-wrap gap-2">
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