import React from "react";
import { useAltitude } from "../store";

export default function App() {
    const altitude = useAltitude((state) => state.altitude);
    return <p style={{ position: "absolute", backgroundColor: "white" }}>Altitude: {altitude}</p>;
}
