import { useEffect, useState } from "react";
import { vehicleLabels, type VehicleType } from "@loadgo/shared";
import { fetchJson, postJson, putJson } from "./lib/api";

type DashboardStats = {
  activeRides: number;
  totalBookings: number;
  totalRevenue: number;
  pendingDrivers: number;
};

type PricingRule = {
  _id?: string;
  vehicleType: VehicleType;
  baseFare: number;
  perKmRate: number;
  isActive: boolean;
};

type DriverRecord = {
  _id: string;
  vehicleType: VehicleType;
  approvalStatus: string;
  availability: string;
  earningsToday: number;
  totalEarnings: number;
  userId?: {
    name?: string;
    phone?: string;
  };
};

type BookingRecord = {
  id: string;
  pickup: { address: string };
  drop: { address: string };
  status: string;
  finalPrice: number;
};

type SeedResponse = {
  message: string;
  summary: {
    activeRides: number;
    totalBookings: number;
    totalRevenue: number;
    pendingDrivers: number;
    driverProfiles: number;
    bookings: number;
    complaints: number;
  };
};

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [pricing, setPricing] = useState<PricingRule[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [seedSummary, setSeedSummary] = useState<SeedResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [dashboardResponse, pricingResponse, driversResponse, bookingsResponse] = await Promise.all([
        fetchJson<{ activeRides: number; totalBookings: number; totalRevenue: number; pendingDrivers: number }>("/v1/admin/dashboard"),
        fetchJson<{ pricing: PricingRule[] }>("/v1/admin/pricing"),
        fetchJson<{ drivers: DriverRecord[] }>("/v1/admin/drivers"),
        fetchJson<{ bookings: BookingRecord[] }>("/v1/admin/bookings")
      ]);

      setDashboard(dashboardResponse);
      setPricing(pricingResponse.pricing);
      setDrivers(driversResponse.drivers);
      setBookings(bookingsResponse.bookings.slice(0, 6));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function handleSeed(reset: boolean) {
    setBusy("seed");
    setError(null);
    try {
      const response = await postJson<SeedResponse>("/v1/admin/dev/seed", { reset });
      setSeedSummary(response.summary);
      await loadDashboard();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to seed test data");
    } finally {
      setBusy(null);
    }
  }

  async function handleDriverApproval(driverId: string, action: "approve" | "reject") {
    setBusy(driverId);
    setError(null);
    try {
      await postJson(`/v1/admin/drivers/${driverId}/${action}`, {});
      await loadDashboard();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : `Failed to ${action} driver`);
    } finally {
      setBusy(null);
    }
  }

  async function handlePricingChange(vehicleType: VehicleType, field: "baseFare" | "perKmRate", value: number) {
    setPricing((current) => current.map((rule) => (rule.vehicleType === vehicleType ? { ...rule, [field]: value } : rule)));
  }

  async function savePricing(vehicleType: VehicleType) {
    const rule = pricing.find((item) => item.vehicleType === vehicleType);
    if (!rule) {
      return;
    }

    setBusy(`pricing-${vehicleType}`);
    setError(null);
    try {
      await putJson(`/v1/admin/pricing/${vehicleType}`, {
        baseFare: Number(rule.baseFare),
        perKmRate: Number(rule.perKmRate),
        isActive: rule.isActive
      });
      await loadDashboard();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to save pricing");
    } finally {
      setBusy(null);
    }
  }

  const pendingDrivers = drivers.filter((driver) => driver.approvalStatus !== "approved");

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">LoadGo Arunachal</p>
          <h1>Marketplace control room</h1>
          <p className="subcopy">Admin dashboard for operations, pricing, and driver approvals. Seed tools are only for test environments.</p>
          <div className="hero-actions">
            <button disabled={busy === "seed"} onClick={() => void handleSeed(false)}>Seed test data</button>
            <button className="secondary" disabled={busy === "seed"} onClick={() => void handleSeed(true)}>Reset and reseed</button>
            <button className="secondary" disabled={loading} onClick={() => void loadDashboard()}>Refresh</button>
          </div>
          {seedSummary ? (
            <p className="status-note">Seeded {seedSummary.bookings} bookings, {seedSummary.driverProfiles} driver profiles, and {seedSummary.complaints} complaint records.</p>
          ) : null}
          {error ? <p className="error-note">{error}</p> : null}
        </div>
        <div className="stats-grid">
          <article>
            <span>Active rides</span>
            <strong>{dashboard?.activeRides ?? (loading ? "..." : 0)}</strong>
          </article>
          <article>
            <span>Revenue</span>
            <strong>INR {dashboard?.totalRevenue ?? (loading ? "..." : 0)}</strong>
          </article>
          <article>
            <span>Pending KYC</span>
            <strong>{dashboard?.pendingDrivers ?? (loading ? "..." : 0)}</strong>
          </article>
          <article>
            <span>Total bookings</span>
            <strong>{dashboard?.totalBookings ?? (loading ? "..." : 0)}</strong>
          </article>
        </div>
      </section>

      <section className="panel-row">
        <article className="panel large">
          <div className="panel-heading">
            <h2>Recent bookings</h2>
            <span className="pill">Live API</span>
          </div>
          <div className="table-list">
            {bookings.length ? bookings.map((booking) => (
              <div className="row" key={booking.id}>
                <div>
                  <strong>{booking.pickup.address} to {booking.drop.address}</strong>
                  <p>{booking.id}</p>
                </div>
                <span>{booking.status}</span>
                <strong>INR {booking.finalPrice}</strong>
              </div>
            )) : <p className="empty-state">No bookings yet. Seed test data to create sample rides.</p>}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Driver approvals</h2>
            <span className="pill warning">{pendingDrivers.length} pending</span>
          </div>
          <div className="table-list">
            {pendingDrivers.length ? pendingDrivers.map((driver) => (
              <div className="row stacked" key={driver._id}>
                <div>
                  <strong>{driver.userId?.name ?? "Unnamed driver"}</strong>
                  <p>{vehicleLabels[driver.vehicleType].en} • {driver.userId?.phone ?? "No phone"}</p>
                </div>
                <span>{driver.approvalStatus}</span>
                <div className="action-row">
                  <button disabled={busy === driver._id} onClick={() => void handleDriverApproval(driver._id, "approve")}>Approve</button>
                  <button className="secondary" disabled={busy === driver._id} onClick={() => void handleDriverApproval(driver._id, "reject")}>Reject</button>
                </div>
              </div>
            )) : <p className="empty-state">No pending drivers.</p>}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Pricing controls</h2>
          <span className="pill">Per vehicle</span>
        </div>
        <div className="pricing-grid">
          {pricing.map((rule) => (
            <div className="price-card" key={rule.vehicleType}>
              <strong>{vehicleLabels[rule.vehicleType].en}</strong>
              <label>
                Base fare
                <input type="number" value={rule.baseFare} onChange={(event) => void handlePricingChange(rule.vehicleType, "baseFare", Number(event.target.value))} />
              </label>
              <label>
                Per km rate
                <input type="number" value={rule.perKmRate} onChange={(event) => void handlePricingChange(rule.vehicleType, "perKmRate", Number(event.target.value))} />
              </label>
              <button disabled={busy === `pricing-${rule.vehicleType}`} onClick={() => void savePricing(rule.vehicleType)}>Save {vehicleLabels[rule.vehicleType].en}</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

