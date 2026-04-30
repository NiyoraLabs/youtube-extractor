export type CategorySuccessResponse = {
	kind: string;
	etag: string;
	items: CategoryItem[];
}

export type CategoryItem = {
	kind: string;
	etag: string;
	id: string;
	snippet: CategorySnippet;
}

export type CategorySnippet = {
	title: string;
	assignable: boolean;
	channelId: string;
}

export type VideoDetailResponse = {
	kind: string;
	etag: string;
	items: VideoDetailItem[];
	pageInfo: PageInfo;
}


export type VideoDetailItem = {
	kind: string;
	etag: string;
	id: string;
	snippet: VideoSnippet;
	contentDetails: VideoContentDetails;
	statistics: VideoStatistics;
}

export type PageInfo = {
	totalResults: number,
	resultsPerPage: number
}

export type VideoSnippet = {
	publishedAt: string;
	channelId: string;
	title: string;
	description: string;
	thumbnail: VideoThumbnail
	channelTitle: string,
	tags?: string[];
	categoryId: string;
	liveBroadcastContent: string;
	defaultLanguage: string;
	localized: {
		title: string
		description: string
	},
	defaultAudioLanguage: string
}

export type VideoContentDetails = {
	duration: string,
	dimension: string,
	definition: string,
	caption: string,
	licensedContent: boolean,
	contentRating: {},
	projection: string
}

export type VideoStatistics = {
	viewCount: string;
	likeCount: string;
	commentCount?: string;
	favoriteCount: string;
}
export type VideoThumbnail = {
	default: VideoThumbnailItem;
	medium: VideoThumbnailItem;
	high: VideoThumbnailItem;
	standard?: VideoThumbnailItem;
}

export type VideoThumbnailItem = {
	url: string;
	width: number;
	height: number;
}