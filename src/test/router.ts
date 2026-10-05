import { vi } from "vitest";

/** Router falso de next/navigation para probar componentes que navegan. */
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
  forward: vi.fn(),
};

export const navigation = {
  pathname: "/biblioteca",
  searchParams: new URLSearchParams(),
};

export function resetRouter() {
  for (const fn of Object.values(router)) fn.mockReset();
  navigation.pathname = "/biblioteca";
  navigation.searchParams = new URLSearchParams();
}

/** Uso: vi.mock("next/navigation", () => nextNavigationMock()); */
export function nextNavigationMock() {
  return {
    useRouter: () => router,
    usePathname: () => navigation.pathname,
    useSearchParams: () => navigation.searchParams,
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
}
