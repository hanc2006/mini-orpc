'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';

export function CreatePlanetMutationForm() {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      return orpc.planet.create(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planets'] });
    },
  });

  return (
    <div>
      <h2>oRPC and Tanstack Query | Create Planet example</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.target as HTMLFormElement);

          const name = form.get('name') as string;
          const description =
            (form.get('description') as string | null) ?? undefined;

          mutate({
            name,
            description,
          });
        }}
      >
        <label>
          Name
          <input name="name" required type="text" />
        </label>
        <label>
          Description
          <textarea name="description" />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
