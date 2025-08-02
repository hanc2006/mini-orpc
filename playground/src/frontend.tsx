/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CreatePlanetMutationForm } from './components/orpc-mutation';
import { ListPlanetsQuery } from './components/orpc-query';

const queryClient = new QueryClient();

const elem = document.getElementById('root')!;
const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <div>
        <h1>Mini ORPC Playground</h1>
        <hr />
        <CreatePlanetMutationForm />
        <hr />
        <ListPlanetsQuery />
      </div>
    </QueryClientProvider>
  </StrictMode>
);

createRoot(elem).render(app);
