import type { BatteryServiceMock } from "../../modules/batteryApi";
import ServiceCard from "../ServiceCard/ServiceCard";

export default function ServicesList({
  batteries,
  clipScores,
}: {
  batteries: BatteryServiceMock[];
  clipScores?: ReadonlyMap<number, number>;
}) {
  return (
    <div className={clipScores != null ? "container container--similarity-rank" : "container"}>
      {batteries.map((b) => (
        <ServiceCard key={b.battery_id} battery={b} similarity={clipScores?.get(b.battery_id)} />
      ))}
    </div>
  );
}
