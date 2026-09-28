import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { FarmAction, Plant } from "../../shared/types";
import { emitFarmAction, emitLogin, emitVisitFarm } from "../socket";
import { useGameStore } from "../store";

function plantLabel(stage: Plant["stage"]): string {
	return stage === "seedling" ? "Seedling" : "Tomato plant";
}

export default function Farm() {
	const { owner = "" } = useParams<{ owner: string }>();
	const username = useGameStore((s) => s.username);
	const farm = useGameStore((s) => s.activeFarm);
	const navigate = useNavigate();

	useEffect(() => {
		if (!owner) return;

		function visit() {
			emitVisitFarm(owner, (res) => {
				if (res.ok) return;
				if (res.error === "Farm not found") {
					navigate("/dashboard");
				} else if (username) {
					emitLogin(username, () => visit());
				} else {
					navigate("/");
				}
			});
		}

		if (username) {
			emitLogin(username, () => visit());
		} else {
			visit();
		}
	}, [owner, username, navigate]);

	const isOwner = username === owner;

	function act(action: FarmAction) {
		emitFarmAction(owner, action, (res) => {
			if (!res.ok) alert(res.error ?? "Invalid action");
		});
	}

	if (!farm || farm.owner !== owner) {
		return (
			<div className="flex min-h-screen items-center justify-center text-leaf">
				<p className="font-display text-sm uppercase tracking-widest ember-text">
					Visiting farm…
				</p>
			</div>
		);
	}

	const seedlings = farm.field.filter((p) => p.stage === "seedling").length;
	const plants = farm.field.filter((p) => p.stage === "tomato").length;

	return (
		<div className="mx-auto max-w-4xl p-6">
			<header className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-2xl text-barn-red ember-text">
						{isOwner ? "YOUR FIELD" : `${owner.toUpperCase()}'S FARM`}
					</h1>
					{!isOwner && (
						<p className="mt-1 text-xs uppercase tracking-widest text-plum">
							(visiting — read only)
						</p>
					)}
				</div>
				<Link
					to="/dashboard"
					className="text-xs tracking-wider text-husk underline-offset-2 hover:text-leaf hover:underline"
				>
					Back to lobby
				</Link>
			</header>

			<div className="grid grid-cols-2 gap-6">
				<section className="rounded-lg border border-leaf/40 bg-barn p-5 ember-border">
					<h2 className="mb-4 text-xl text-leaf ember-text">FIELD</h2>
					{farm.field.length === 0 ? (
						<p data-testid="field-empty" className="text-sm text-husk">
							Nothing planted. Plant a seed from the barn.
						</p>
					) : (
						<ul data-testid="field" className="flex flex-col gap-2">
							{farm.field.map((plant) => (
								<li
									key={plant.id}
									className="flex items-center justify-between gap-3 rounded border border-cream/10 bg-barn-deep px-4 py-2"
								>
									<span className="text-sm text-cream">
										{plantLabel(plant.stage)}
									</span>
									{isOwner && plant.stage === "seedling" && (
										<button
											type="button"
											onClick={() => act({ kind: "grow", plantId: plant.id })}
											className="rounded border border-leaf/60 bg-leaf/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-leaf transition hover:bg-leaf/20"
										>
											Grow
										</button>
									)}
									{isOwner && plant.stage === "tomato" && (
										<button
											type="button"
											onClick={() =>
												act({ kind: "harvest", plantId: plant.id })
											}
											className="rounded border border-pumpkin/60 bg-pumpkin/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-pumpkin transition hover:bg-pumpkin/20"
										>
											Harvest
										</button>
									)}
								</li>
							))}
						</ul>
					)}
					<p className="mt-4 text-xs text-husk">
						{seedlings} seedling(s) · {plants} tomato plant(s)
					</p>
				</section>

				<section className="rounded-lg border border-wheat/40 bg-barn p-5 ember-border">
					<h2 className="mb-4 text-xl text-wheat ember-text">BARN</h2>
					<ul className="flex flex-col gap-2">
						<li className="flex items-center justify-between gap-3 rounded border border-cream/10 bg-barn-deep px-4 py-2">
							<span className="text-sm text-cream">
								Seeds: <strong data-testid="seeds">{farm.seeds}</strong>
							</span>
							{isOwner && (
								<button
									type="button"
									onClick={() => act({ kind: "plantSeed" })}
									disabled={farm.seeds <= 0}
									className="rounded border border-leaf/60 bg-leaf/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-leaf transition hover:bg-leaf/20 disabled:cursor-not-allowed disabled:opacity-40"
								>
									Plant Seed
								</button>
							)}
						</li>
						<li className="flex items-center justify-between gap-3 rounded border border-cream/10 bg-barn-deep px-4 py-2">
							<span className="text-sm text-cream">
								Tomatoes:{" "}
								<strong data-testid="tomatoes">{farm.tomatoes}</strong>
							</span>
							{isOwner && (
								<button
									type="button"
									onClick={() => act({ kind: "convertTomato" })}
									disabled={farm.tomatoes <= 0}
									className="rounded border border-pumpkin/60 bg-pumpkin/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-pumpkin transition hover:bg-pumpkin/20 disabled:cursor-not-allowed disabled:opacity-40"
								>
									Convert Tomato (+2 seeds)
								</button>
							)}
						</li>
					</ul>
				</section>
			</div>
		</div>
	);
}
