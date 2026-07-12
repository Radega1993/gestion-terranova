import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SociosEdit from '../SociosEdit';

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ token: 'token-test' })
}));

jest.mock('../../../config', () => ({
  API_BASE_URL: 'http://localhost:3000/api'
}));

describe('SociosEdit', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url.includes('/socios/123')) {
        if (init?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true })
          } as Response);
        }

        return Promise.resolve({
          ok: true,
          json: async () => ({
            _id: '123',
            socio: 'AET001',
            nombre: { nombre: 'Ana', primerApellido: 'López', segundoApellido: 'Ruiz' },
            direccion: { calle: 'Calle Mayor', numero: '10', poblacion: 'Madrid', cp: '28001', provincia: 'Madrid' },
            contacto: { telefonos: ['600123456'], email: ['ana@test.com'] },
            fechaNacimiento: '1990-01-01T00:00:00.000Z',
            active: true
          })
        } as Response);
      }

      return Promise.reject(new Error('Unhandled fetch'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('envía un payload de edición sin el campo email incompatibles y permite guardar', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/socios/editar/123']}>
          <Routes>
            <Route path="/socios/editar/:id" element={<SociosEdit />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const user = userEvent.setup();
    const apellidoInput = await screen.findByLabelText(/primer apellido/i);
    await user.clear(apellidoInput);
    await user.type(apellidoInput, 'Pérez');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/socios/123',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    const putCall = (global.fetch as jest.Mock).mock.calls.find(call => call[0] === 'http://localhost:3000/api/socios/123' && call[1]?.method === 'PUT');
    const body = JSON.parse(putCall?.[1]?.body as string);

    expect(body.contacto).toEqual({
      telefonos: ['600123456'],
      emails: ['ana@test.com']
    });
    expect(body.contacto.email).toBeUndefined();
  });
});
