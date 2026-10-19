import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import UserNavbar from "../components/UserNavbar";

import {
    getProfile,
    updateProfile,
    addAddress,
    updateAddress,
    changePassword
} from "../Services/userService";

import "./UserProfile.css";

function UserProfile() {

    const token = sessionStorage.getItem("token");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [profile, setProfile] = useState({
        user_id: "",
        full_name: "",
        email: "",
        phone: "",
        created_at: ""
    });

    const [address, setAddress] = useState({
        address_id: "",
        label: "Home",
        address_line1: "",
        address_line2: "",
        city: "",
        area: "",
        pincode: "",
        landmark: "",
        latitude: "",
        longitude: "",
        is_default: 1
    });

    const [password, setPassword] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            setLoading(true);
            const response = await getProfile(token);

            if (response.status !== "success") {
                toast.error(response.error);
                return;
            }

            const data = response.data;

            setProfile({
                user_id: data.user_id,
                full_name: data.full_name,
                email: data.email,
                phone: data.phone,
                created_at: data.created_at
            });

            setAddress({
                address_id: data.address_id || "",
                label: data.label || "Home",
                address_line1: data.address_line1 || "",
                address_line2: data.address_line2 || "",
                city: data.city || "",
                area: data.area || "",
                pincode: data.pincode || "",
                landmark: data.landmark || "",
                latitude: data.latitude || "",
                longitude: data.longitude || "",
                is_default: data.is_default || 1
            });

        } catch (err) {
            console.log(err);
            toast.error("Unable to load profile");
        } finally {
            setLoading(false);
        }
    }

    function handleProfileChange(e) {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    }

    function handleAddressChange(e) {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        });
    }

    function handlePasswordChange(e) {
        setPassword({
            ...password,
            [e.target.name]: e.target.value
        });
    }

    async function saveProfile() {
        try {
            setSaving(true);
            const response = await updateProfile(
                token,
                {
                    full_name: profile.full_name,
                    phone: profile.phone
                }
            );

            if (response.status === "success") {
                toast.success("Profile Updated Successfully");
                sessionStorage.setItem(
                    "user",
                    JSON.stringify({
                        ...JSON.parse(sessionStorage.getItem("user")),
                        full_name: profile.full_name
                    })
                );
            } else {
                toast.error(response.error);
            }
        } catch {
            toast.error("Unable to update profile");
        } finally {
            setSaving(false);
        }
    }

    function getCurrentLocation() {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setFetchingLocation(true);
        toast.info("Fetching your location...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    setAddress(prev => ({
                        ...prev,
                        latitude: latitude.toString(),
                        longitude: longitude.toString()
                    }));

                    const locationData = await getLocationDetails(latitude, longitude);

                    if (locationData) {
                        setAddress(prev => ({
                            ...prev,
                            city: locationData.city || prev.city,
                            area: locationData.area || prev.area,
                            pincode: locationData.pincode || prev.pincode,
                            address_line1: locationData.address_line1 || prev.address_line1,
                            latitude: latitude.toString(),
                            longitude: longitude.toString()
                        }));

                        toast.success(`Location detected: ${locationData.city || 'City'}, ${locationData.area || 'Area'}`);
                    } else {
                        toast.success("Location captured successfully!");
                    }

                } catch (error) {
                    console.error("Reverse geocoding error:", error);
                    toast.warning("Location captured but unable to fetch city/area details. Please fill manually.");
                } finally {
                    setFetchingLocation(false);
                }
            },
            (error) => {
                console.error("Geolocation Error:", error);
                let errorMessage = "Unable to fetch location. Please check your permissions.";
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location permission denied. Please allow location access in your browser settings.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable. Please try again.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out. Please try again.";
                        break;
                }
                
                toast.error(errorMessage);
                setFetchingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    }

    async function getLocationDetails(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'SmartServe-App/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Reverse geocoding failed');
            }

            const data = await response.json();

            if (data && data.address) {
                const address = data.address;

                const city = address.city || 
                            address.town || 
                            address.village || 
                            address.municipality || 
                            address.county || 
                            '';

                const area = address.suburb || 
                            address.neighbourhood || 
                            address.district || 
                            address.ward || 
                            '';

                const pincode = address.postcode || '';
                const road = address.road || '';
                const houseNumber = address.house_number || '';
                const addressLine1 = houseNumber ? `${houseNumber}, ${road}` : road;

                return {
                    city: city,
                    area: area,
                    pincode: pincode,
                    address_line1: addressLine1
                };
            }

            return null;
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            return null;
        }
    }

    async function saveAddress() {
        try {
            setSaving(true);

            if (!address.address_line1 || !address.city || !address.area || !address.pincode) {
                toast.warning("Please fill all required address fields (Address Line 1, City, Area, Pincode).");
                setSaving(false);
                return;
            }

            let response;

            if (address.address_id) {
                response = await updateAddress(token, address);
            } else {
                response = await addAddress(token, address);
            }

            if (response.status === "success") {
                toast.success("Address Saved Successfully");
                loadProfile();
            } else {
                toast.error(response.error);
            }

        } catch {
            toast.error("Unable to save address.");
        } finally {
            setSaving(false);
        }
    }

    async function updatePassword() {
        if (
            password.currentPassword === "" ||
            password.newPassword === "" ||
            password.confirmPassword === ""
        ) {
            toast.warning("Fill all password fields.");
            return;
        }

        if (password.newPassword !== password.confirmPassword) {
            toast.warning("Passwords do not match.");
            return;
        }

        if (password.newPassword.length < 6) {
            toast.warning("New password must be at least 6 characters long.");
            return;
        }

        try {
            setChangingPassword(true);

            const response = await changePassword(
                token,
                password.currentPassword,
                password.newPassword,
                password.confirmPassword
            );

            if (response.status === "success") {
                toast.success("Password Updated Successfully");
                setPassword({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
            } else {
                toast.error(response.error);
            }

        } catch {
            toast.error("Unable to change password.");
        } finally {
            setChangingPassword(false);
        }
    }

    if (loading) {
        return (
            <div className="dashboard-shell">
                <UserNavbar />
                <main className="dashboard-main">
                    <div className="container-fluid p-4">
                        <div className="text-center mt-5">
                            <div className="spinner-border text-primary"></div>
                            <p className="mt-2 text-muted">Loading profile...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="dashboard-shell">
                <UserNavbar />
                <main className="dashboard-main">
                    <div className="container-fluid p-4">
                        <h2 className="profile-page-title">
                            <i className="bi bi-person-circle me-2"></i>
                            My Profile
                        </h2>

                        {/* =====================================
                            PERSONAL INFORMATION
                        ===================================== */}
                        <div className="profile-card">
                            <div className="profile-card-header profile-card-header-blue">
                                <h5>
                                    <i className="bi bi-person-circle me-2"></i>
                                    Personal Information
                                </h5>
                            </div>
                            <div className="profile-card-body">
                                <div className="profile-row">
                                    <div className="profile-col-6">
                                        <label className="profile-label">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control profile-input"
                                            name="full_name"
                                            value={profile.full_name}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div className="profile-col-6">
                                        <label className="profile-label">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            className="form-control profile-input profile-input-readonly"
                                            value={profile.email}
                                            disabled
                                            readOnly
                                        />
                                        <small className="profile-text-muted">Email cannot be changed</small>
                                    </div>
                                </div>

                                <div className="profile-row">
                                    <div className="profile-col-6">
                                        <label className="profile-label">
                                            Mobile Number
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control profile-input"
                                            name="phone"
                                            value={profile.phone}
                                            onChange={handleProfileChange}
                                            placeholder="Enter your mobile number"
                                        />
                                    </div>
                                    <div className="profile-col-6">
                                        <label className="profile-label">
                                            Member Since
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control profile-input profile-input-readonly"
                                            value={
                                                profile.created_at
                                                    ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })
                                                    : ""
                                            }
                                            disabled
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="profile-button-row">
                                    <button
                                        className="btn profile-btn-primary"
                                        onClick={saveProfile}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-save me-2"></i>
                                                Update Profile
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* =====================================
                            ADDRESS INFORMATION
                        ===================================== */}
                        <div className="profile-card">
                            <div className="profile-card-header profile-card-header-green">
                                <h5>
                                    <i className="bi bi-geo-alt-fill me-2"></i>
                                    Address Information
                                </h5>
                            </div>
                            <div className="profile-card-body">
                                <div className="profile-row">
                                    <div className="profile-col-3">
                                        <label className="profile-label">
                                            Address Label
                                        </label>
                                        <select
                                            className="form-select profile-select"
                                            name="label"
                                            value={address.label}
                                            onChange={handleAddressChange}
                                        >
                                            <option value="Home">🏠 Home</option>
                                            <option value="Office">🏢 Office</option>
                                            <option value="Other">📍 Other</option>
                                        </select>
                                    </div>
                                    <div className="profile-col-9">
                                        <label className="profile-label">
                                            Address Line 1
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control profile-input"
                                            name="address_line1"
                                            value={address.address_line1}
                                            onChange={handleAddressChange}
                                            placeholder="House number, street name"
                                        />
                                    </div>
                                </div>

                                <div className="profile-row">
                                    <div className="profile-col-12">
                                        <label className="profile-label">
                                            Address Line 2
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control profile-input"
                                            name="address_line2"
                                            value={address.address_line2}
                                            onChange={handleAddressChange}
                                            placeholder="Apartment, suite, unit, building (optional)"
                                        />
                                    </div>
                                </div>

                                <div className="profile-row">
                                    <div className="profile-col-4">
                                        <label className="profile-label">
                                            City <span className="profile-required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control profile-input"
                                            name="city"
                                            value={address.city}
                                            onChange={handleAddressChange}
                                            placeholder="City name"
                                        />
                                    </div>
                                    <div className="profile-col-4">
                                        <label className="profile-label">
                                            Area / Locality <span className="profile-required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control profile-input"
                                            name="area"
                                            value={address.area}
                                            onChange={handleAddressChange}
                                            placeholder="Area or locality"
                                        />
                                    </div>
                                    <div className="profile-col-4">
                                        <label className="profile-label">
                                            Pincode <span className="profile-required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control profile-input"
                                            name="pincode"
                                            value={address.pincode}
                                            onChange={handleAddressChange}
                                            placeholder="Postal code"
                                        />
                                    </div>
                                </div>

                                <div className="profile-row">
                                    <div className="profile-col-12">
                                        <label className="profile-label">
                                            Landmark
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control profile-input"
                                            name="landmark"
                                            value={address.landmark}
                                            onChange={handleAddressChange}
                                            placeholder="Nearby landmark (optional)"
                                        />
                                    </div>
                                </div>

                                <div className="profile-divider"></div>

                                <div className="profile-row">
                                    <div className="profile-col-12">
                                        <button
                                            type="button"
                                            className="btn profile-btn-outline"
                                            onClick={getCurrentLocation}
                                            disabled={fetchingLocation}
                                        >
                                            {fetchingLocation ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Fetching Location...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-crosshair me-2"></i>
                                                    Get Current Location
                                                </>
                                            )}
                                        </button>
                                        <small className="profile-text-muted d-block mt-1">
                                            <i className="bi bi-info-circle"></i>
                                            Click to detect your location and auto-fill city, area & pincode
                                        </small>
                                    </div>
                                </div>

                                <div style={{ display: 'none' }}>
                                    <input type="hidden" name="latitude" value={address.latitude} />
                                    <input type="hidden" name="longitude" value={address.longitude} />
                                </div>

                                <div className="profile-row">
                                    <div className="profile-col-12">
                                        <div className="profile-checkbox">
                                            <input
                                                className="profile-checkbox-input"
                                                type="checkbox"
                                                checked={address.is_default === 1}
                                                onChange={(e) =>
                                                    setAddress({
                                                        ...address,
                                                        is_default: e.target.checked ? 1 : 0
                                                    })
                                                }
                                                id="defaultAddress"
                                            />
                                            <label className="profile-checkbox-label" htmlFor="defaultAddress">
                                                Make this my default address
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="profile-button-row">
                                    <button
                                        className="btn profile-btn-success"
                                        onClick={saveAddress}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-save me-2"></i>
                                                Save Address
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* =====================================
                            CHANGE PASSWORD
                        ===================================== */}
                        <div className="profile-card">
                            <div className="profile-card-header profile-card-header-red">
                                <h5>
                                    <i className="bi bi-key-fill me-2"></i>
                                    Change Password
                                </h5>
                            </div>
                            <div className="profile-card-body">
                                <div className="profile-alert">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Password must be at least 6 characters long and contain a mix of letters, numbers, and special characters.
                                </div>

                                <div className="profile-row">
                                    <div className="profile-col-4">
                                        <label className="profile-label">
                                            Current Password
                                        </label>
                                        <div className="profile-password-wrapper">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                className="form-control profile-input profile-password-input"
                                                name="currentPassword"
                                                value={password.currentPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                className="profile-password-toggle"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                tabIndex="-1"
                                            >
                                                <i className={`bi ${showCurrentPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="profile-col-4">
                                        <label className="profile-label">
                                            New Password
                                        </label>
                                        <div className="profile-password-wrapper">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                className="form-control profile-input profile-password-input"
                                                name="newPassword"
                                                value={password.newPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                className="profile-password-toggle"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                tabIndex="-1"
                                            >
                                                <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="profile-col-4">
                                        <label className="profile-label">
                                            Confirm Password
                                        </label>
                                        <div className="profile-password-wrapper">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="form-control profile-input profile-password-input"
                                                name="confirmPassword"
                                                value={password.confirmPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                className="profile-password-toggle"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                tabIndex="-1"
                                            >
                                                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        </div>
                                        {password.newPassword && password.confirmPassword && (
                                            <div className={`profile-password-match ${password.newPassword === password.confirmPassword ? 'profile-match-success' : 'profile-match-error'}`}>
                                                <i className={`bi ${password.newPassword === password.confirmPassword ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                                                {password.newPassword === password.confirmPassword ? ' Passwords match' : ' Passwords do not match'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="profile-button-row">
                                    <button
                                        className="btn profile-btn-danger"
                                        onClick={updatePassword}
                                        disabled={changingPassword}
                                    >
                                        {changingPassword ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-shield-lock-fill me-2"></i>
                                                Change Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default UserProfile;