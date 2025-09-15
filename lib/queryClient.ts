import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Extract the base URL from queryKey[0]
    const baseUrl = queryKey[0] as string;
    
    // Check if we have query parameters in the queryKey (position 1, 2, etc.)
    let url = baseUrl;
    if (queryKey.length > 1) {
      // Build URL parameters for items in the queryKey after the baseUrl
      const params = new URLSearchParams();
      
      // Add latitude and longitude if present
      // When using /api/alerts/active or similar endpoints with location
      if (baseUrl.includes('/alerts/active') || baseUrl.includes('/wildfires/nearby') || baseUrl.includes('/wildfires/stats')) {
        const latitude = queryKey[1];
        const longitude = queryKey[2];
        const radius = queryKey[3];
        
        if (latitude !== null) params.append('latitude', String(latitude));
        if (longitude !== null) params.append('longitude', String(longitude));
        if (radius !== undefined) params.append('radius', String(radius));
      }
      
      // Add the params to the URL if we have any
      if (params.toString()) {
        url = `${baseUrl}?${params.toString()}`;
      }
    }
    
    // Make the request with the constructed URL
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
