import { create } from "zustand";
import type { Farm, FarmSummary, Player } from "../shared/types";

const USERNAME_KEY = "grange.username";

interface GameStore {
	username: string;
	players: Player[];
	farms: FarmSummary[];
	activeFarm: Farm | null;
	setUsername: (name: string) => void;
	setPlayers: (players: Player[]) => void;
	setFarms: (farms: FarmSummary[]) => void;
	setActiveFarm: (farm: Farm | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
	username: localStorage.getItem(USERNAME_KEY) ?? "",
	players: [],
	farms: [],
	activeFarm: null,
	setUsername: (username) => {
		localStorage.setItem(USERNAME_KEY, username);
		set({ username });
	},
	setPlayers: (players) => set({ players }),
	setFarms: (farms) => set({ farms }),
	setActiveFarm: (activeFarm) => set({ activeFarm }),
}));
