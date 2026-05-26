import { json } from '@sveltejs/kit';
import { PLANES } from '$lib/data/planes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json(PLANES);
};
