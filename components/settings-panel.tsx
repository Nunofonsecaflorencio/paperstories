"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { CollageSettings } from "@/app/page";
import { Settings } from "lucide-react";

interface SettingsPanelProps {
	settings: CollageSettings;
	onSettingsChange: (settings: CollageSettings) => void;
}

export function SettingsPanel({
	settings,
	onSettingsChange,
}: SettingsPanelProps) {
	const updateSetting = (key: keyof CollageSettings, value: any) => {
		onSettingsChange({ ...settings, [key]: value });
	};

	return (
		<Card className="p-6">
			<div className="mb-4 flex items-center gap-2">
				<Settings className="h-5 w-5 text-primary" />
				<h2 className="text-xl font-semibold text-card-foreground">
					Settings
				</h2>
			</div>

			<div className="space-y-5">
				{/* Grid Layout */}
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-2">
						<Label
							htmlFor="columns"
							className="text-sm font-medium"
						>
							Columns
						</Label>
						<Input
							id="columns"
							type="number"
							value={settings.columns}
							onChange={(e) =>
								updateSetting(
									"columns",
									Number.parseInt(e.target.value)
								)
							}
							min={1}
							max={10}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="rows" className="text-sm font-medium">
							Rows
						</Label>
						<Input
							id="rows"
							type="number"
							value={settings.rows}
							onChange={(e) =>
								updateSetting(
									"rows",
									Number.parseInt(e.target.value)
								)
							}
							min={1}
							max={10}
						/>
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Label
							htmlFor="padding"
							className="text-sm font-medium"
						>
							Padding
						</Label>
						<span className="text-sm text-muted-foreground">
							{settings.padding} mm
						</span>
					</div>
					<Slider
						id="padding"
						value={[settings.padding]}
						onValueChange={(value) =>
							updateSetting("padding", value[0])
						}
						min={0}
						max={50}
						step={1}
						className="w-full"
					/>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="show-captions"
						checked={settings.showCaptions}
						onCheckedChange={(checked) =>
							updateSetting("showCaptions", checked)
						}
					/>
					<Label
						htmlFor="show-captions"
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Show date & time captions
					</Label>
				</div>

				{/* Info */}
				<div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
					<p className="font-medium text-foreground">
						Total slots: {settings.columns * settings.rows}
					</p>
					<p className="mt-1">Adjust grid to fit your photos</p>
				</div>
			</div>
		</Card>
	);
}
