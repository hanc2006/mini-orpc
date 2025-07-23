import { createORPCClient } from '@mini-orpc/client';
import { JSONLink } from '@mini-orpc/client/fetch';
import type { RouterClient } from '@mini-orpc/server';
import type { router } from '@/router';

const link = new JSONLink({
  url: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/rpc`,
});

export const orpc: RouterClient<typeof router> = createORPCClient(link);
