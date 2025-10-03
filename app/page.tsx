"use client";

import { useState } from "react";
import { SettingsPanel } from "@/components/settings-panel";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generatePDF } from "@/lib/pdf-generator";

export interface ImageData {
	id: string;
	file: File;
	url: string;
	metadata?: {
		dateTime?: string;
		width?: number;
		height?: number;
	};
	aspectRatio: string;
	crop: {
		x: number;
		y: number;
		zoom: number;
		rotation: number;
	};
}

export interface CollageSettings {
	columns: number;
	rows: number;
	padding: number;
	customWidth?: number;
	customHeight?: number;
	showCaptions: boolean;
}

export default function PaperStoriesPage() {
	const [images, setImages] = useState<ImageData[]>([]);
	const [settings, setSettings] = useState<CollageSettings>({
		columns: 2,
		rows: 4,
		padding: 10,
		showCaptions: false,
	});
	const [isGenerating, setIsGenerating] = useState(false);

	const handleDownload = async () => {
		if (images.length === 0) {
			alert("Please upload at least one image");
			return;
		}

		setIsGenerating(true);
		try {
			await generatePDF(images, settings);
		} catch (error) {
			console.error("[v0] PDF generation error:", error);
			alert("Failed to generate PDF. Please try again.");
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="min-h-screen max-w-xl bg-background mx-auto">
			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold tracking-tight text-foreground">
								PaperStories
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								Create beautiful printable photo collages
							</p>
						</div>
						<Button
							onClick={handleDownload}
							disabled={images.length === 0 || isGenerating}
							size="lg"
							className="gap-2"
						>
							<Download className="h-4 w-4" />
							{isGenerating
								? "Generating..."
								: "Download Collage"}
						</Button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-8">
				<div className="grid">
					{/* Left Column - Settings & Upload */}
					<div className="space-y-6">
						<SettingsPanel
							settings={settings}
							onSettingsChange={setSettings}
						/>
						<ImageUpload
							images={images}
							onImagesChange={setImages}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}
