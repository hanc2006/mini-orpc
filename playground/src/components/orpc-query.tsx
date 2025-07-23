'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';

export function ListPlanetsQuery() {
  const { data, refetch, fetchNextPage, hasNextPage, status } =
    useSuspenseInfiniteQuery({
      queryKey: ['planets'],
      queryFn: async ({ pageParam }) => {
        return orpc.planet.list({
          cursor: pageParam,
          limit: 10,
        });
      },
      getNextPageParam: (lastPage) => {
        return lastPage.length === 10 ? lastPage.at(-1)?.id : null;
      },
      initialPageParam: 0,
    });

  if (status === 'error') {
    return <p>Something went wrong.</p>;
  }

  return (
    <div>
      <h2>oRPC and Tanstack Query | List Planets example</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {data.pages.flatMap((page, i) =>
            page.map((planet) => (
              <tr key={`${planet.id}-${i}`}>
                <td>{planet.id}</td>
                <td>{planet.name}</td>
                <td>{planet.description}</td>
                <td>{planet.imageUrl}</td>
              </tr>
            ))
          )}
        </tbody>

        <tfoot>
          <tr>
            <td colSpan={4}>
              <button
                disabled={!hasNextPage}
                onClick={() => fetchNextPage()}
                type="button"
              >
                Load more
              </button>

              <button onClick={() => refetch()} type="button">
                Refresh
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
