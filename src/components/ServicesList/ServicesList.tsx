import type { BatteryServiceMock } from "../../modules/batteryApi";
import ServiceCard from "../ServiceCard/ServiceCard";

export default function ServicesList({ batteries }: { batteries: BatteryServiceMock[] }) {
  return (
    <div className="container">
      {batteries.map((b) => (
        <ServiceCard key={b.battery_id} battery={b} />
      ))}
    </div>
  );
}
