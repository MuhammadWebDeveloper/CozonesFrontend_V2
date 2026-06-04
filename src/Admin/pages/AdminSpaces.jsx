import { useEffect, useState } from "react";
import { adminGetAllSpaces, adminGetUnitsOfSpace } from "../services/admin.service";
import "../styles/AdminLayout.css";

const AMENITY_ICONS = {
  has_wifi: { icon: "ti-wifi",            label: "WiFi"         },
  has_ac:   { icon: "ti-air-conditioning",label: "AC"           },
  has_coffee:{ icon: "ti-coffee",         label: "Coffee"       },
  has_printer:{ icon: "ti-printer",       label: "Printer"      },
  has_parking:{ icon: "ti-car",           label: "Parking"      },
  has_security:{ icon: "ti-shield",       label: "Security"     },
  has_backup_power:{ icon: "ti-bolt",     label: "Backup Power" },
};

export default function AdminSpaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [unitsMap, setUnitsMap] = useState({});
  const [unitsLoading, setUnitsLoading] = useState(null);

  useEffect(() => {
    adminGetAllSpaces()
      .then((d) => setSpaces(d.spaces || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cities = [...new Set(spaces.map((s) => s.city).filter(Boolean))];

  const filtered = spaces.filter((s) => {
    const matchSearch =
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase());
    const matchCity = !cityFilter || s.city === cityFilter;
    return matchSearch && matchCity;
  });

  const toggleExpand = async (spaceId) => {
    if (expandedId === spaceId) { setExpandedId(null); return; }
    setExpandedId(spaceId);
    if (unitsMap[spaceId]) return;
    setUnitsLoading(spaceId);
    try {
      const d = await adminGetUnitsOfSpace(spaceId);
      setUnitsMap((prev) => ({ ...prev, [spaceId]: d.units || [] }));
    } catch (e) {
      setUnitsMap((prev) => ({ ...prev, [spaceId]: [] }));
    } finally {
      setUnitsLoading(null);
    }
  };

  if (loading)
    return (
      <div className="admin-loading">
        <i className="ti ti-loader" />
        <span>Loading spaces…</span>
      </div>
    );

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Spaces & Units</h1>
        <p>{spaces.length} total spaces</p>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <div className="table-toolbar">
          <h2>All Spaces</h2>
          <div className="toolbar-search">
            <i className="ti ti-search" />
            <input
              placeholder="Search by name or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-building-off" />
            No spaces found
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Space</th>
                <th>City / Area</th>
                <th>Hours</th>
                <th>Amenities</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <>
                  <tr key={s.id}>
                    <td>
                      <button
                        className="btn-action"
                        onClick={() => toggleExpand(s.id)}
                        title="Expand units"
                      >
                        <i className={`ti ${expandedId === s.id ? "ti-chevron-up" : "ti-chevron-down"}`} />
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "#111" }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{s.address || "—"}</div>
                    </td>
                    <td>
                      <div>{s.city}</div>
                      {s.area && <div style={{ fontSize: 12, color: "#9ca3af" }}>{s.area}</div>}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {s.opening_time && s.closing_time
                        ? `${s.opening_time} – ${s.closing_time}`
                        : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {Object.entries(AMENITY_ICONS).map(([key, { icon, label }]) =>
                          s[key] ? (
                            <span
                              key={key}
                              title={label}
                              style={{ color: "#6366f1", fontSize: 16 }}
                            >
                              <i className={`ti ${icon}`} aria-label={label} />
                            </span>
                          ) : null
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${s.is_active ? "badge-green" : "badge-red"}`}>
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.is_verified ? "badge-blue" : "badge-amber"}`}>
                        {s.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#9ca3af" }}>
                      {s.units?.length ?? "—"}
                    </td>
                  </tr>

                  {expandedId === s.id && (
                    <tr key={`${s.id}-units`}>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <div className="units-panel">
                          {unitsLoading === s.id ? (
                            <div style={{ padding: "14px", color: "#9ca3af", fontSize: 13 }}>
                              <i className="ti ti-loader" /> Loading units…
                            </div>
                          ) : (unitsMap[s.id] || []).length === 0 ? (
                            <div style={{ padding: "14px", color: "#9ca3af", fontSize: 13 }}>
                              No units found for this space.
                            </div>
                          ) : (
                            <table className="admin-table" style={{ marginTop: 4 }}>
                              <thead>
                                <tr>
                                  <th>Unit Name</th>
                                  <th>Type</th>
                                  <th>Capacity</th>
                                  <th>Hourly</th>
                                  <th>Daily</th>
                                  <th>Monthly</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(unitsMap[s.id] || []).map((u) => (
                                  <tr key={u.id}>
                                    <td>{u.name || "—"}</td>
                                    <td>
                                      <span className="badge badge-purple">
                                        {u.unit_type?.replace(/_/g, " ")}
                                      </span>
                                    </td>
                                    <td>{u.total_capacity ?? "—"}</td>
                                    <td>{u.hourly_rate ? `PKR ${u.hourly_rate}` : "—"}</td>
                                    <td>{u.daily_rate ? `PKR ${u.daily_rate}` : "—"}</td>
                                    <td>{u.monthly_rate ? `PKR ${u.monthly_rate}` : "—"}</td>
                                    <td>
                                      <span className={`badge ${u.is_active ? "badge-green" : "badge-red"}`}>
                                        {u.is_active ? "Active" : "Inactive"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}