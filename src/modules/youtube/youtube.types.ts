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
