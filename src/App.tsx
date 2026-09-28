import { Route, Routes } from "react-router-dom";
import Dashboard from "./routes/Dashboard";
import Farm from "./routes/Farm";
import Login from "./routes/Login";

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Login />} />
			<Route path="/dashboard" element={<Dashboard />} />
			<Route path="/farms/:owner" element={<Farm />} />
		</Routes>
	);
}
