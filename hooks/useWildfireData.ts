import { useQuery, useMutation } from '@tanstack/react-query';
import { Wildfire, WildfireStats, MapBounds } from '@/types/wildfire';
import { queryClient } from '@/lib/queryClient';

export function useWildfires(bounds?: MapBounds) {
  return useQuery({
    queryKey: ['/api/wildfires', bounds ? JSON.stringify(bounds) : 'all'],
    enabled: true
  });
}

export function useWildfire(id: string | null) {
  return useQuery({
    queryKey: ['/api/wildfires', id],
    enabled: !!id
  });
}

export function useNearbyWildfires(latitude: number | null, longitude: number | null, radius: number = 100) {
  return useQuery({
    queryKey: ['/api/wildfires/nearby', latitude, longitude, radius],
    enabled: !!latitude && !!longitude
  });
}

export function useWildfireStats() {
  return useQuery({
    queryKey: ['/api/wildfires/stats']
  });
}

export function useActiveAlerts(latitude: number | null = null, longitude: number | null = null) {
  return useQuery({
    queryKey: ['/api/alerts/active', latitude, longitude],
    enabled: true
  });
}

export function useSubscribeToAlerts() {
  return useMutation({
    mutationFn: (data: { wildfireId: string, email?: string, phone?: string }) => {
      return fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to subscribe to alerts');
        }
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/alerts/active']
      });
    }
  });
}
