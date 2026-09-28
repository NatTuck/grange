import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestFarms } from "../socket";
import { useGameStore } from "../store";

export default function Dashboard() {
	const username = useGameStore((s) => s.username);
	const farms = useGameStore((s) => s.farms);
	const navigate = useNavigate();

	useEffect(() => {
		requestFarms();
	}, []);

	const mine = farms.find((f) => f.owner === username);
	const others = farms.filter((f) => f.owner !== username);

	function onVisit(owner: string) {
		navigate(`/farms/${owner}`);
	}

	return (
		<div className="mx-auto max-w-3xl p-6">
			<header className="mb-8 flex items-end justify-between">
				<div>
					<h1 className="text-3xl text-barn-red ember-text">LOBBY</h1>
					<p className="mt-1 text-sm text-husk">
						Logged in as <span className="text-leaf">{username}</span>
					</p>
				</div>
				<Link
					to="/"
					className="text-xs tracking-wider text-husk underline-offset-2 hover:text-leaf hover:underline"
				>
					Change user
				</Link>
			</header>

			<section className="mb-8 rounded-lg border border-leaf/40 bg-barn p-5 ember-border text-leaf">
				<h2 className="mb-4 text-xl text-leaf ember-text">YOUR FARM</h2>
				{mine ? (
					<div className="flex items-center justify-between gap-4 rounded border border-cream/10 bg-barn-deep px-4 py-3">
						<p className="text-sm text-cream">
							{mine.fieldCount} in field · {mine.seedCount} seeds ·{" "}
							{mine.tomatoCount} tomatoes
						</p>
						<button
							type="button"
							onClick={() => onVisit(mine.owner)}
							className="rounded border border-barn-red/60 bg-barn-red/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-barn-red transition hover:bg-barn-red/20 ember-glow"
						>
							Go to field
						</button>
					</div>
				) : (
					<p className="text-sm text-husk">Preparing your farm…</p>
				)}
			</section>

			<section className="rounded-lg border border-plum/40 bg-barn p-5 ember-border text-plum">
				<h2 className="mb-4 text-xl text-barn-red ember-text">OTHER FARMS</h2>
				{others.length === 0 ? (
					<p className="text-sm text-husk">
						No other farms yet. Invite a friend to log in.
					</p>
				) : (
					<ul className="flex flex-col gap-3">
						{others.map((f) => (
							<li
								key={f.owner}
								className="flex items-center justify-between gap-4 rounded border border-cream/10 bg-barn-deep px-4 py-3"
							>
								<div>
									<p className="font-display text-sm text-leaf">{f.owner}</p>
									<p className="mt-1 text-xs text-husk">
										{f.fieldCount} in field · {f.seedCount} seeds ·{" "}
										{f.tomatoCount} tomatoes · {f.visitorCount} visiting
									</p>
								</div>
								<button
									type="button"
									onClick={() => onVisit(f.owner)}
									className="rounded border border-plum/60 bg-plum/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-plum transition hover:bg-plum/20"
								>
									Visit
								</button>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
