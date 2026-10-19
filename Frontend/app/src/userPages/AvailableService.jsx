import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { getAvailableServices } from "../Services/userService";

import "./AvailableService.css";

function AvailableServices() {

    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            const response = await getAvailableServices();
            if (response.status === "success") {
                setServices(response.data);
            } else {
                toast.error(response.data || "Unable to load services");
            }
        } catch (error) {
            console.log("Services Error:", error);
            toast.error("Unable to load available services");
        } finally {
            setLoading(false);
        }
    };

    const handleTakeService = (service) => {
        navigate(`/user/payment?serviceId=${service.service_id}`);
    };

    // Get random gradient for each card
    const getGradient = (index) => {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
            'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
        ];
        return gradients[index % gradients.length];
    };

    // Get icon based on service name
    const getServiceIcon = (name) => {
        const icons = {
            'Plumbing': 'bi-wrench',
            'Electrical': 'bi-lightning',
            'Cleaning': 'bi-brush',
            'Carpentry': 'bi-hammer',
            'Painting': 'bi-paint-bucket',
            'AC Repair': 'bi-snow',
            'Appliance Repair': 'bi-tools',
            'Pest Control': 'bi-bug',
            'Water Tank Cleaning': 'bi-droplet',
            'Home Maintenance': 'bi-house-gear',
            'Electrical Repair': 'bi-lightning'
        };
        return icons[name] || 'bi-tools';
    };

    // Filter services based on search
    const filteredServices = services.filter(service =>
        service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="available-services-page">
                <div className="container py-5 text-center">
                    <div className="loading-container">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-3">Loading available services...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="available-services-page">
            {/* Background decoration */}
            <div className="bg-decoration">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
                <div className="circle circle-3"></div>
            </div>

            <div className="container py-5">
                {/* Header with Back Button */}
                <div className="header-with-back">
                    <button
                        className="back-button"
                        onClick={() => navigate("/user/dashboard")}
                    >
                        <i className="bi bi-arrow-left"></i>
                        Dashboard
                    </button>
                </div>

                {/* Main Header */}
                <div className="text-center mb-4">
                    <div className="header-badge">
                        <i className="bi bi-stars"></i>
                        Premium Services
                    </div>
                    <h1 className="fw-bold display-4">
                        Available <span className="gradient-text">Services</span>
                    </h1>
                    <p className="text-muted fs-5">
                        Choose the perfect service for your needs
                    </p>
                    <div className="header-line"></div>
                </div>

                {/* Search Bar */}
                <div className="search-container">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm("")}>
                                <i className="bi bi-x-circle"></i>
                            </button>
                        )}
                    </div>
                </div>

                {filteredServices.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="empty-state">
                            {services.length === 0 ? (
                                <>
                                    <i className="bi bi-tools display-1 text-muted"></i>
                                    <h3 className="mt-3">No Services Available</h3>
                                    <p className="text-muted">Please check back later for new services.</p>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-search display-1 text-muted"></i>
                                    <h3 className="mt-3">No Results Found</h3>
                                    <p className="text-muted">Try adjusting your search terms.</p>
                                    <button className="btn btn-outline-primary mt-3" onClick={() => setSearchTerm("")}>
                                        Clear Search
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="row g-4">
                        {filteredServices.map((service, index) => {
                            const gradient = getGradient(index);
                            const icon = getServiceIcon(service.service_name);
                            const isHovered = hoveredCard === service.service_id;

                            return (
                                <div
                                    className="col-md-6 col-lg-4"
                                    key={service.service_id}
                                    onMouseEnter={() => setHoveredCard(service.service_id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    <div className={`service-card-3d ${isHovered ? 'hovered' : ''}`}>
                                        {/* Card Glow Effect */}
                                        <div className="card-glow" style={{ background: gradient }}></div>

                                        <div className="service-card-body">
                                            {/* Icon with gradient background */}
                                            <div className="service-icon-wrapper" style={{ background: gradient }}>
                                                <i className={`bi ${icon}`}></i>
                                            </div>

                                            <h4 className="service-name">
                                                {service.service_name}
                                            </h4>

                                            <p className="service-description">
                                                {service.description || `Professional ${service.service_name} services`}
                                            </p>

                                            {/* Rating */}
                                            <div className="service-rating">
                                                <div className="stars">
                                                    <i className="bi bi-star-fill"></i>
                                                    <i className="bi bi-star-fill"></i>
                                                    <i className="bi bi-star-fill"></i>
                                                    <i className="bi bi-star-fill"></i>
                                                    <i className="bi bi-star-half"></i>
                                                </div>
                                                <span className="rating-text">(4.5)</span>
                                            </div>

                                            {/* Price */}
                                            <div className="service-price">
                                                <span className="price-amount">₹{service.base_price}</span>
                                                <span className="price-unit">/ {service.price_unit || 'visit'}</span>
                                            </div>

                                            {/* Features */}
                                            <div className="service-features">
                                                <span><i className="bi bi-check-circle-fill"></i> Professional</span>
                                                <span><i className="bi bi-check-circle-fill"></i> Verified</span>
                                            </div>

                                            <button
                                                type="button"
                                                className="btn-take-service"
                                                onClick={() => handleTakeService(service)}
                                            >
                                                <span>Book Now</span>
                                                <i className="bi bi-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AvailableServices;