import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Pencil,
  Trash2,
  Building2,
  Clock,
  Users,
  Banknote,
  MapPin,
  Wifi,
  Snowflake,
  Coffee,
  Printer,
  ParkingSquare,
  ShieldCheck,
  Zap,
  Calendar,
  Star,
  ArrowLeft,
  Plus,
  ChevronRight,
  Home,
  List,
  FileText,
  Building,
  CheckCircle,
  XCircle,
  ToggleRight,
  ToggleLeft,
  Ban,
  CreditCard,
  AlarmClock,
  AlertTriangle,
  Sparkles,
  Landmark,
  Store,
  School,
  Warehouse,
  Monitor,
  Armchair,
  DoorClosed,
  Presentation,
  Package,
  Timer,
  CalendarDays
} from 'lucide-react';
import '../../componentstyles/sellerdashboardstyles/SpaceDetails.css';
import BaseUrl from '../../utils/AppConstants';

export default function SpaceDetails() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deletingUnit, setDeletingUnit] = useState(null);
  const [togglingUnit, setTogglingUnit] = useState(null);

  const getAuthToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchSpaceDetails();
  }, [spaceId]);

  const fetchSpaceDetails = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.get(`${BaseUrl}api/spaces/owner/my-spaces`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const foundSpace = response.data.spaces.find(space => space.id === spaceId);
        if (foundSpace) {
          setSpace(foundSpace);
        } else {
          setError('Space not found');
        }
      } else {
        setError(response.data.message || 'Failed to load space details');
      }
    } catch (err) {
      console.error('Failed to fetch space details:', err);
      setError(err.response?.data?.message || 'Failed to load space details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => navigate(`/space/update/${spaceId}`);
  const handleAddUnit = () => navigate(`/spaces/${spaceId}/addunits`);
  const handleViewUnits = () => navigate(`/spaces/${spaceId}/units`);

  const handleEditUnit = (unitId) => {
    const unit = space.units.find(u => u.id === unitId);
    navigate(`/spaces/${spaceId}/units/${unitId}/edit`, { state: { unit } });
  };
  const handleDeleteUnit = async (unitId, unitName) => {
    if (window.confirm(`Are you sure you want to delete "${unitName || 'this unit'}"? This action cannot be undone.`)) {
      setDeletingUnit(unitId);
      try {
        const token = getAuthToken();
        await axios.delete(`${BaseUrl}api/spaces/${spaceId}/units/${unitId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchSpaceDetails();
      } catch (error) {
        console.error('Failed to delete unit:', error);
        alert(error.response?.data?.message || 'Failed to delete unit');
      } finally {
        setDeletingUnit(null);
      }
    }
  };

  const handleToggleUnitStatus = async (unitId, currentStatus, unitName) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';

    if (window.confirm(`Are you sure you want to ${action} "${unitName || 'this unit'}"?`)) {
      setTogglingUnit(unitId);
      try {
        const token = getAuthToken();
        await axios.put(
          `${BaseUrl}api/spaces/${spaceId}/units/${unitId}/toggle-status`,
          { is_active: newStatus },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        fetchSpaceDetails();
      } catch (error) {
        console.error('Failed to toggle unit status:', error);
        alert(error.response?.data?.message || 'Failed to update unit status');
      } finally {
        setTogglingUnit(null);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSpaceIcon = () => {
    const icons = [Building2, Landmark, Store, School, Warehouse];
    const index = space?.name?.length % icons.length || 0;
    const SpaceIcon = icons[index];
    return <SpaceIcon />;
  };

  const getUnitIcon = (unitType) => {
    switch (unitType) {
      case 'open_desk':
        return <Monitor />;
      case 'dedicated_desk':
        return <Armchair />;
      case 'private_cabin':
        return <DoorClosed />;
      case 'meeting_room':
        return <Presentation />;
      default:
        return <Package />;
    }
  };

  const getActivePricing = (unit) => {
    if (unit.hourly_rate && unit.hourly_rate > 0) return { type: 'hourly', rate: unit.hourly_rate };
    if (unit.daily_rate && unit.daily_rate > 0) return { type: 'daily', rate: unit.daily_rate };
    if (unit.monthly_rate && unit.monthly_rate > 0) return { type: 'monthly', rate: unit.monthly_rate };
    return null;
  };

  if (loading) {
    return (
      <div className="sd__loading">
        <div className="sd__loader"></div>
        <p>Loading space details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sd__error">
        <div className="sd__error-icon"><AlertTriangle /></div>
        <p>{error}</p>
        <button onClick={() => navigate('/seller-dashboard')} className="sd__back-btn">
          <Home /> Back to Dashboard
        </button>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="sd__error">
        <p>Space not found</p>
        <button onClick={() => navigate('/seller-dashboard')} className="sd__back-btn">
          <Home /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="sd__container">
      {/* Header */}
      <div className="sd__header">
        <button onClick={() => navigate('/seller-dashboard')} className="sd__back-button">
          <ArrowLeft />
          Back to Dashboard
        </button>
        <div className="sd__header-actions">
          <button onClick={handleEdit} className="sd__edit-button">
            <Pencil />
            Edit Space
          </button>
          <button onClick={handleAddUnit} className="sd__add-unit-button">
            <Plus />
            Add Unit
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="sd__hero">
        <div className="sd__hero-icon">{getSpaceIcon()}</div>
        <div className="sd__hero-content">
          <h1 className="sd__title">{space.name}</h1>
          <div className="sd__badge-group">
            <span className={`sd__badge sd__badge-${space.is_active ? 'active' : 'inactive'}`}>
              {space.is_active ? (
                <>
                  <CheckCircle /> Active
                </>
              ) : (
                <>
                  <XCircle /> Inactive
                </>
              )}
            </span>
            <span className="sd__badge sd__badge-id">
              <Building /> ID: {space.id?.slice(0, 8)}...
            </span>
          </div>
          <p className="sd__description">{space.description || 'No description provided'}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="sd__stats-row">
        <div className="sd__stat-card">
          <div className="sd__stat-icon"><Calendar /></div>
          <div className="sd__stat-info">
            <span className="sd__stat-label">Created</span>
            <span className="sd__stat-number">{formatDate(space.created_at)}</span>
          </div>
        </div>
        <div className="sd__stat-card">
          <div className="sd__stat-icon"><Clock /></div>
          <div className="sd__stat-info">
            <span className="sd__stat-label">Last Updated</span>
            <span className="sd__stat-number">{formatDate(space.updated_at)}</span>
          </div>
        </div>
        <div className="sd__stat-card">
          <div className="sd__stat-icon"><Building2 /></div>
          <div className="sd__stat-info">
            <span className="sd__stat-label">Total Units</span>
            <span className="sd__stat-number">{space.units?.length || 0}</span>
          </div>
        </div>
        <div className="sd__stat-card">
          <div className="sd__stat-icon"><Star /></div>
          <div className="sd__stat-info">
            <span className="sd__stat-label">Active Units</span>
            <span className="sd__stat-number">{space.units?.filter(u => u.is_active).length || 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sd__tabs">
        <button
          className={`sd__tab ${activeTab === 'overview' ? 'sd__tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <List /> Overview
        </button>
        <button
          className={`sd__tab ${activeTab === 'location' ? 'sd__tab-active' : ''}`}
          onClick={() => setActiveTab('location')}
        >
          <MapPin /> Location
        </button>
        <button
          className={`sd__tab ${activeTab === 'hours' ? 'sd__tab-active' : ''}`}
          onClick={() => setActiveTab('hours')}
        >
          <Clock /> Hours
        </button>
        <button
          className={`sd__tab ${activeTab === 'amenities' ? 'sd__tab-active' : ''}`}
          onClick={() => setActiveTab('amenities')}
        >
          <Sparkles /> Amenities
        </button>
        <button
          className={`sd__tab ${activeTab === 'units' ? 'sd__tab-active' : ''}`}
          onClick={() => setActiveTab('units')}
        >
          <Building2 /> Units ({space.units?.filter(u => u.is_active).length}/{space.units?.length || 0})
        </button>
        <button
          className={`sd__tab ${activeTab === 'policies' ? 'sd__tab-active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <FileText /> Policies
        </button>
      </div>

      {/* Tab Content */}
      <div className="sd__content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="sd__overview">
            <div className="sd__info-card">
              <h3>Basic Information</h3>
              <div className="sd__info-grid">
                <div className="sd__info-item">
                  <span className="sd__info-label">Space Name</span>
                  <span className="sd__info-value">{space.name}</span>
                </div>
                <div className="sd__info-item">
                  <span className="sd__info-label">Status</span>
                  <div className={`sd__status-badge ${space.is_active ? 'status-active' : 'status-inactive'}`}>
                    {space.is_active ? (
                      <>
                        <CheckCircle /> Active
                      </>
                    ) : (
                      <>
                        <XCircle /> Inactive
                      </>
                    )}
                  </div>
                </div>
                <div className="sd__info-item">
                  <span className="sd__info-label">Created</span>
                  <span className="sd__info-value">{formatDate(space.created_at)}</span>
                </div>
                <div className="sd__info-item">
                  <span className="sd__info-label">Last Updated</span>
                  <span className="sd__info-value">{formatDate(space.updated_at)}</span>
                </div>
              </div>
            </div>

            <div className="sd__info-card">
              <h3>Description</h3>
              <p className="sd__description-text">{space.description || 'No description provided'}</p>
            </div>

            {/* <button onClick={handleViewUnits} className="sd__view-units-btn">
              View All Units ({space.units?.length || 0})
              <ChevronRight />
            </button> */}
          </div>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <div className="sd__location">
            <div className="sd__info-card">
              <h3><MapPin /> Address Information</h3>
              <div className="sd__info-grid">
                <div className="sd__info-item">
                  <span className="sd__info-label">Address</span>
                  <span className="sd__info-value">{space.address || 'Not specified'}</span>
                </div>
                <div className="sd__info-item">
                  <span className="sd__info-label">City</span>
                  <span className="sd__info-value">{space.city || 'Not specified'}</span>
                </div>
                <div className="sd__info-item">
                  <span className="sd__info-label">Area/Locality</span>
                  <span className="sd__info-value">{space.area || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {(space.latitude && space.longitude) && (
              <div className="sd__info-card">
                <h3><MapPin /> Coordinates</h3>
                <div className="sd__info-grid">
                  <div className="sd__info-item">
                    <span className="sd__info-label">Latitude</span>
                    <span className="sd__info-value">{space.latitude}</span>
                  </div>
                  <div className="sd__info-item">
                    <span className="sd__info-label">Longitude</span>
                    <span className="sd__info-value">{space.longitude}</span>
                  </div>
                </div>
              </div>
            )}

            {space.google_maps_link && (
              <a href={space.google_maps_link} target="_blank" rel="noopener noreferrer" className="sd__map-link">
                <MapPin /> Open in Google Maps
                <ChevronRight />
              </a>
            )}
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === 'hours' && (
          <div className="sd__hours">
            <div className="sd__info-card">
              <h3><Clock /> Operating Hours</h3>
              <div className="sd__info-grid">
                <div className="sd__info-item">
                  <span className="sd__info-label">Opening Time</span>
                  <span className="sd__info-value">{space.opening_time || 'Not specified'}</span>
                </div>
                <div className="sd__info-item">
                  <span className="sd__info-label">Closing Time</span>
                  <span className="sd__info-value">{space.closing_time || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div className="sd__info-card">
              <h3>Working Days</h3>
              <div className="sd__days-grid">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <div key={day} className={`sd__day ${space.working_days?.includes(day) ? 'sd__day-active' : ''}`}>
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === 'amenities' && (
          <div className="sd__amenities">
            <div className="sd__info-card">
              <h3><Sparkles /> Amenities & Features</h3>
              <div className="sd__amenities-grid">
                <div className={`sd__amenity ${space.has_wifi ? 'active' : 'inactive'}`}>
                  <Wifi /> {space.has_wifi ? 'Wi-Fi Available' : 'No Wi-Fi'}
                </div>
                <div className={`sd__amenity ${space.has_ac ? 'active' : 'inactive'}`}>
                  <Snowflake /> {space.has_ac ? 'Air Conditioning' : 'No AC'}
                </div>
                <div className={`sd__amenity ${space.has_coffee ? 'active' : 'inactive'}`}>
                  <Coffee /> {space.has_coffee ? 'Coffee/Tea' : 'No Coffee'}
                </div>
                <div className={`sd__amenity ${space.has_printer ? 'active' : 'inactive'}`}>
                  <Printer /> {space.has_printer ? 'Printer/Scanner' : 'No Printer'}
                </div>
                <div className={`sd__amenity ${space.has_parking ? 'active' : 'inactive'}`}>
                  <ParkingSquare /> {space.has_parking ? 'Parking Available' : 'No Parking'}
                </div>
                <div className={`sd__amenity ${space.has_security ? 'active' : 'inactive'}`}>
                  <ShieldCheck /> {space.has_security ? '24/7 Security' : 'No Security'}
                </div>
                <div className={`sd__amenity ${space.has_backup_power ? 'active' : 'inactive'}`}>
                  <Zap /> {space.has_backup_power ? 'Backup Power' : 'No Backup Power'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Units Tab with Active/Inactive Toggle */}
        {activeTab === 'units' && (
          <div className="sd__units">
            <div className="sd__info-card">
              <div className="sd__units-header">
                <h3><Building2 /> Space Units</h3>
                <button onClick={handleAddUnit} className="sd__add-unit-small">
                  <Plus /> Add New Unit
                </button>
              </div>
              {space.units?.length > 0 ? (
                <div className="sd__units-list">
                  {space.units.map((unit, index) => {
                    const activePricing = getActivePricing(unit);
                    return (
                      <div key={unit.id} className={`sd__unit-item ${!unit.is_active ? 'sd__unit-inactive' : ''}`}>
                        <div className="sd__unit-header">
                          <div className="sd__unit-info-left">
                            <span className="sd__unit-number">#{index + 1}</span>
                            <span className="sd__unit-icon">{getUnitIcon(unit.unit_type)}</span>
                            <span className="sd__unit-type">{unit.unit_type?.replace('_', ' ')}</span>
                            <div className={`sd__unit-status-badge ${unit.is_active ? 'status-active' : 'status-inactive'}`}>
                              {unit.is_active ? (
                                <>
                                  <CheckCircle /> Active
                                </>
                              ) : (
                                <>
                                  <XCircle /> Inactive
                                </>
                              )}
                            </div>
                          </div>
                          <div className="sd__unit-actions">
                            {/* <button
                              onClick={() => handleToggleUnitStatus(unit.id, unit.is_active, unit.name || unit.unit_type)}
                              className={`sd__unit-toggle-btn ${unit.is_active ? 'toggle-active' : 'toggle-inactive'}`}
                              disabled={togglingUnit === unit.id}
                              title={unit.is_active ? 'Deactivate Unit' : 'Activate Unit'}
                            >
                              {togglingUnit === unit.id ? (
                                <div className="sd__small-loader"></div>
                              ) : unit.is_active ? (
                                <ToggleRight />
                              ) : (
                                <ToggleLeft />
                              )}
                            </button> */}
                            <button
                              onClick={() => handleEditUnit(unit.id)}
                              className="sd__unit-edit-btn"
                              title="Edit Unit"
                            >
                              <Pencil />
                            </button>
                            <button
                              onClick={() => handleDeleteUnit(unit.id, unit.name || unit.unit_type)}
                              className="sd__unit-delete-btn"
                              disabled={deletingUnit === unit.id}
                              title="Delete Unit"
                            >
                              {deletingUnit === unit.id ? (
                                <div className="sd__small-loader"></div>
                              ) : (
                                <Trash2 />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="sd__unit-details">
                          <div className="sd__unit-detail">
                            <span>Name:</span>
                            <strong>{unit.name || 'Not specified'}</strong>
                          </div>
                          <div className="sd__unit-detail">
                            <Users /> <span>Capacity:</span>
                            <strong>{unit.total_capacity || 0} people</strong>
                          </div>
                          {activePricing && (
                            <div className="sd__unit-detail sd__unit-pricing">
                              <Banknote /> <span>Active Pricing:</span>
                              <strong className="pricing-badge">
                                {activePricing.type === 'hourly' && <><Timer size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Hourly</>}
                                {activePricing.type === 'daily' && <><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Daily</>}
                                {activePricing.type === 'monthly' && <><CalendarDays size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Monthly</>}
                                : PKR {activePricing.rate}
                              </strong>
                            </div>
                          )}
                          {unit.duration && (
                            <div className="sd__unit-detail">
                              <Clock /> <span>Duration:</span>
                              <strong>{unit.duration}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sd__no-units">
                  <p>No units added yet</p>
                  <button onClick={handleAddUnit} className="sd__add-unit-btn">
                    <Plus /> Add Your First Unit
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="sd__policies">
            <div className="sd__info-card">
              <h3><Ban /> Cancellation Policy</h3>
              <p className="sd__policy-text">{space.cancellation_policy || 'No cancellation policy specified'}</p>
            </div>
            <div className="sd__info-card">
              <h3><CreditCard /> Refund Policy</h3>
              <p className="sd__policy-text">{space.refund_policy || 'No refund policy specified'}</p>
            </div>
            <div className="sd__info-card">
              <h3><AlarmClock /> Late Arrival Policy</h3>
              <p className="sd__policy-text">{space.late_arrival_policy || 'No late arrival policy specified'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}