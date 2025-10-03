"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { ImageData, CollageSettings } from "@/app/page";
import { ImageCropModal } from "@/components/image-crop-modal";
import { Eye } from "lucide-react";

interface CollagePreviewProps {
	images: ImageData[];
	settings: CollageSettings;
	onImagesChange: (images: ImageData[]) => void;
}

export function CollagePreview({
	images,
	settings,
	onImagesChange,
}: CollagePreviewProps) {
	const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

	const totalSlots = settings.columns * settings.rows;
	const slots = Array.from(
		{ length: totalSlots },
		(_, i) => images[i] || null
	);

	const getAspectRatio = (ratio: string) => {
		switch (ratio) {
			case "1:1":
				return 1;
			case "4:3":
				return 4 / 3;
			case "3:2":
				return 3 / 2;
			case "16:9":
				return 16 / 9;
			case "2:3":
				return 2 / 3;
			case "3:4":
				return 3 / 4;
			case "9:16":
				return 9 / 16;
			default:
				return 1;
		}
	};

	const updateAspectRatio = (id: string, aspectRatio: string) => {
		onImagesChange(
			images.map((img) => (img.id === id ? { ...img, aspectRatio } : img))
		);
	};

	const handleCropSave = (updatedImage: ImageData) => {
		onImagesChange(
			images.map((img) =>
				img.id === updatedImage.id ? updatedImage : img
			)
		);
		setSelectedImage(null);
	};

	const formatDateTime = (dateTime?: string) => {
		if (!dateTime) return null;
		try {
			const date = new Date(dateTime);
			return date
				.toLocaleString("us-US", {
					weekday: "long", // full day name
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					hour12: false, // 24-hour format
				})
				.toUpperCase();
		} catch {
			return null;
		}
	};

	return (
		<>
			<Card className="p-6">
				<div className="mb-4 flex items-center gap-2">
					<Eye className="h-5 w-5 text-primary" />
					<h2 className="text-xl font-semibold text-card-foreground">
						Live Preview
					</h2>
				</div>

				<div className="rounded-lg border border-border bg-white p-4">
					<div
						className="grid gap-2"
						style={{
							gridTemplateColumns: `repeat(${settings.columns}, 1fr)`,
							gridTemplateRows: `repeat(${settings.rows}, 1fr)`,
						}}
					>
						{slots.map((image, index) => (
							<div
								key={index}
								className="relative flex flex-col gap-2"
							>
								{image && (
									<div className="space-y-1">
										<Label className="text-xs text-muted-foreground">
											Aspect Ratio
										</Label>
										<Select
											value={image.aspectRatio}
											onValueChange={(value) =>
												updateAspectRatio(
													image.id,
													value
												)
											}
										>
											<SelectTrigger className="h-7 text-xs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="1:1">
													1:1 Square
												</SelectItem>
												<SelectItem value="4:3">
													4:3 Landscape
												</SelectItem>
												<SelectItem value="3:2">
													3:2 Landscape
												</SelectItem>
												<SelectItem value="16:9">
													16:9 Wide
												</SelectItem>
												<SelectItem value="3:4">
													3:4 Portrait
												</SelectItem>
												<SelectItem value="2:3">
													2:3 Portrait
												</SelectItem>
												<SelectItem value="9:16">
													9:16 Tall
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
								<div className="flex flex-col gap-1">
									<div
										className="relative overflow-hidden rounded border border-border bg-muted"
										style={{
											aspectRatio: image
												? getAspectRatio(
														image.aspectRatio
												  )
												: 1,
											minHeight:
												image &&
												getAspectRatio(
													image.aspectRatio
												) < 1
													? "200px"
													: "auto",
										}}
									>
										{image ? (
											<button
												onClick={() =>
													setSelectedImage(image)
												}
												className="group relative h-full w-full"
											>
												<img
													src={
														image.url ||
														"/placeholder.svg"
													}
													alt={`Slot ${index + 1}`}
													className="h-full w-full object-cover transition-transform group-hover:scale-105"
													style={{
														transform: `scale(${image.crop.zoom}) rotate(${image.crop.rotation}deg)`,
														objectPosition: `${image.crop.x}% ${image.crop.y}%`,
													}}
												/>
												<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
													<span className="text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
														Click to adjust
													</span>
												</div>
											</button>
										) : (
											<div className="flex h-full items-center justify-center text-xs text-muted-foreground">
												Empty
											</div>
										)}
									</div>
									{image &&
										settings.showCaptions &&
										formatDateTime(
											image.metadata?.dateTime
										) && (
											<p className="text-xs text-muted-foreground text-center px-1">
												{formatDateTime(
													image.metadata?.dateTime
												)}
											</p>
										)}
								</div>
							</div>
						))}
					</div>
				</div>

				<p className="mt-4 text-xs text-muted-foreground">
					Adjust aspect ratio for each image, then click to fine-tune
					crop, zoom, and rotation
				</p>
			</Card>

			{selectedImage && (
				<ImageCropModal
					image={selectedImage}
					onSave={handleCropSave}
					onClose={() => setSelectedImage(null)}
				/>
			)}
		</>
	);
}
